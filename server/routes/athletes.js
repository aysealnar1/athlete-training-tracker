import db from '../db.js';
import { validateAthlete } from '../athlete-validation.js';
const BRANCHES = ['Basketbol', 'Voleybol'];

export function installAthletesRoutes(app) {
  app.get('/api/branches', (_, res) => res.json(BRANCHES));

  app.get('/api/athletes', (req, res) => {
    try {
      const { branch = 'Basketbol', q } = req.query;

      let sql = 'SELECT * FROM athletes WHERE branch = ? AND coach_id = ?';
      const params = [branch, req.user.id];

      if (q && q.trim()) {
        sql += ' AND (name LIKE ? OR surname LIKE ?)';
        const like = `%${q.trim()}%`;
        params.push(like, like);
      }

      sql += ' ORDER BY surname, name';

      const rows = db.prepare(sql).all(...params);
      res.json(rows);
    } catch (err) {
      console.error('GET /api/athletes', err);
      res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
    }
  });

  app.post('/api/athletes', (req, res) => {
    try {
      const checked = validateAthlete(req.body);
      if (checked.error) return res.status(400).json({ error: checked.error });
      const { branch, name, surname, height, weight, body_fat, birth_date, gender } = checked.values;

      const stmt = db.prepare(
        'INSERT INTO athletes (branch, name, surname, height, weight, body_fat, birth_date, gender, coach_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      );

      const result = stmt.run(
        branch,
        name.trim(),
        surname.trim(),
        height ?? null,
        weight ?? null,
        body_fat ?? null,
        birth_date ?? null,
        gender,
        req.user.id
      );

      const row = db.prepare('SELECT * FROM athletes WHERE id = ?').get(result.lastInsertRowid);

      res.status(201).json(row);
    } catch (err) {
      console.error('POST /api/athletes', err);
      res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
    }
  });

  app.get('/api/athletes/:id', (req, res) => {
    try {
      const row = db.prepare('SELECT * FROM athletes WHERE id = ?').get(req.params.id);

      if (!row) {
        return res.status(404).json({ error: 'Sporcu bulunamadı.' });
      }

      res.json(row);
    } catch (err) {
      console.error('GET /api/athletes/:id', err);
      res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
    }
  });

  app.put('/api/athletes/:id', (req, res) => {
    try {
      const existing = db.prepare('SELECT * FROM athletes WHERE id = ?').get(req.params.id);

      if (!existing) {
        return res.status(404).json({ error: 'Sporcu bulunamadı.' });
      }

      const checked = validateAthlete(req.body, existing);
      if (checked.error) return res.status(400).json({ error: checked.error });
      const { name, surname, height, weight, body_fat, birth_date, gender } = checked.values;

      db.prepare(
        'UPDATE athletes SET name=?, surname=?, height=?, weight=?, body_fat=?, birth_date=?, gender=? WHERE id=?'
      ).run(
        name,
        surname,
        height,
        weight,
        body_fat,
        birth_date,
        gender,
        req.params.id
      );

      const row = db.prepare('SELECT * FROM athletes WHERE id = ?').get(req.params.id);

      res.json(row);
    } catch (err) {
      console.error('PUT /api/athletes/:id', err);
      res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
    }
  });

  app.delete('/api/athletes/:id', (req, res) => {
    try {
      const r = db.prepare('DELETE FROM athletes WHERE id = ?').run(req.params.id);

      if (r.changes === 0) {
        return res.status(404).json({ error: 'Sporcu bulunamadı.' });
      }

      res.status(204).send();
    } catch (err) {
      console.error('DELETE /api/athletes/:id', err);
      res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
    }
  });
}
