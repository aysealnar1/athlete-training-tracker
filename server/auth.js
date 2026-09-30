import { randomBytes, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import db from './db.js';

const scrypt = promisify(scryptCallback);
const cookieName = 'sport_session';
const lifetime = 8 * 60 * 60 * 1000;
const secure = process.env.NODE_ENV === 'production';
const digest = token => createHash('sha256').update(token).digest('hex');
const publicUser = user => ({ id: user.id, name: user.name, surname: user.surname, email: user.email });
const attempts = new Map();

db.exec(`CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY, coach_id INTEGER NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);`);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt}$${key.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  const [format, salt, hex] = String(stored).split('$');
  if (format !== 'scrypt' || !/^[a-f0-9]{32}$/.test(salt || '') || !/^[a-f0-9]{128}$/.test(hex || '')) return false;
  const key = await scrypt(password, salt, 64);
  return timingSafeEqual(key, Buffer.from(hex, 'hex'));
}
function tokenFrom(req) {
  const bearer = req.get('authorization');
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7);
  const value = (req.headers.cookie || '').split(';').map(part => part.trim()).find(part => part.startsWith(`${cookieName}=`));
  return value?.slice(cookieName.length + 1);
}
function limit(req, res, next) {
  const now = Date.now();
  for (const [key, entry] of attempts) if (entry.until <= now) attempts.delete(key);
  const key = req.ip;
  const entry = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
  entry.count++;
  attempts.set(key, entry);
  if (entry.count > 30) return res.status(429).json({ error: 'Çok fazla deneme. 15 dakika sonra yeniden deneyin.' });
  next();
}
const cookieOptions = { httpOnly: true, sameSite: 'strict', secure, path: '/' };

export function requireAuth(req, res, next) {
  const token = tokenFrom(req);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
  const user = db.prepare(`SELECT c.id, c.name, c.surname, c.email FROM coaches c
    JOIN sessions s ON s.coach_id=c.id WHERE s.token_hash=? AND s.expires_at>?`).get(digest(token), Date.now());
  if (!user) return res.status(401).json({ error: 'Oturum sona erdi. Yeniden giriş yapın.' });
  req.user = user;
  next();
}

export function installAuth(app) {
  app.post('/api/register', limit, async (req, res, next) => {
    try {
      const { name, surname, email, password } = req.body || {};
      if (![name, surname, email, password].every(value => typeof value === 'string') ||
          !name.trim() || !surname.trim() || name.length > 100 || surname.length > 100 ||
          email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || password.length < 10 || password.length > 128) {
        return res.status(400).json({ error: 'Ad, soyad ve geçerli e-posta girin. Şifre 10–128 karakter olmalı.' });
      }
      const normalized = email.trim().toLowerCase();
      const hash = await hashPassword(password);
      // INSERT handles concurrent duplicate registration safely.
      try {
        const result = db.prepare('INSERT INTO coaches (name,surname,email,password) VALUES (?,?,?,?)')
          .run(name.trim(), surname.trim(), normalized, hash);
        const user = db.prepare('SELECT id,name,surname,email FROM coaches WHERE id=?').get(result.lastInsertRowid);
        res.status(201).json({ message: 'Kayıt başarılı.', user });
      } catch (err) {
        if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Bu e-posta ile kayıtlı kullanıcı var.' });
        throw err;
      }
    } catch (err) { next(err); }
  });
  app.post('/api/login', limit, async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (typeof email !== 'string' || typeof password !== 'string' || email.length > 254 || password.length > 128) {
        return res.status(400).json({ error: 'E-posta ve şifre girin.' });
      }
      const user = db.prepare('SELECT * FROM coaches WHERE email=?').get(email.trim().toLowerCase());
      // A fixed-format dummy hash keeps unknown accounts on the same expensive verification path.
      const dummy = 'scrypt$' + '0'.repeat(32) + '$' + '0'.repeat(128);
      const valid = await verifyPassword(password, user?.password || dummy);
      if (!user || !valid) return res.status(401).json({ error: 'E-posta veya şifre hatalı.' });
      const token = randomBytes(32).toString('hex');
      db.prepare('DELETE FROM sessions WHERE expires_at<=?').run(Date.now());
      db.prepare('INSERT INTO sessions (token_hash,coach_id,expires_at) VALUES (?,?,?)').run(digest(token),user.id,Date.now()+lifetime);
      if (req.get('x-native-client') !== '1') res.cookie(cookieName, token, { ...cookieOptions, maxAge: lifetime });
      // Native clients explicitly request a bearer token; web clients only use HttpOnly cookies.
      res.json({ message: 'Giriş başarılı.', user: publicUser(user), ...(req.get('x-native-client') === '1' ? { token } : {}) });
    } catch (err) { next(err); }
  });
  app.get('/api/me', requireAuth, (req,res) => res.json({ user: req.user }));
  app.post('/api/logout', (req,res) => {
    const token = tokenFrom(req);
    if (token) db.prepare('DELETE FROM sessions WHERE token_hash=?').run(digest(token));
    res.clearCookie(cookieName, cookieOptions);
    res.status(204).send();
  });
}
