import express from 'express';
import cors from 'cors';
import db from './db.js';
import { ageGroupAtTraining } from './age-group.js';
import { validateAthlete } from './athlete-validation.js';
import { validateRecords, createRecordWriter } from './training-records.js';
import { installAuth, requireAuth } from './auth.js';

const app = express();
const allowedOrigins = new Set((process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(value => value.trim()));
app.use(cors({ origin: (origin, done) => done(null, !origin || allowedOrigins.has(origin)), credentials: true }));
// Cross-origin browser writes are rejected; native clients send the custom header too.
app.use('/api', (req,res,next) => {
  if (['POST','PUT','PATCH','DELETE'].includes(req.method) &&
      (req.get('x-requested-with') !== 'SportTracker' || (req.get('origin') && !allowedOrigins.has(req.get('origin'))))) {
    return res.status(403).json({ error: 'İstek kaynağı doğrulanamadı.' });
  }
  next();
});
app.use(express.json());

const writeTrainingRecords = createRecordWriter(db);

const BRANCHES = ['Basketbol', 'Voleybol'];

installAuth(app);
app.use('/api', requireAuth);
// Every record route verifies ownership before reading or changing data.
app.use('/api/athletes/:id', (req, res, next) => {
  const athlete = db.prepare('SELECT id FROM athletes WHERE id=? AND coach_id=?').get(req.params.id, req.user.id);
  if (!athlete) return res.status(404).json({ error: 'Sporcu bulunamadı.' });
  next();
});
app.use('/api/trainings/:id', (req, res, next) => {
  const training = db.prepare(`SELECT t.id FROM trainings t JOIN athletes a ON a.id=t.athlete_id
    WHERE t.id=? AND a.coach_id=?`).get(req.params.id, req.user.id);
  if (!training) return res.status(404).json({ error: 'Antrenman bulunamadı.' });
  next();
});

// --- Athletes ---
app.get('/api/athletes/:id/trainings', (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT t.*, (SELECT COUNT(*) FROM shot_records WHERE training_id = t.id) as record_count FROM trainings t WHERE athlete_id = ? ORDER BY t.created_at DESC'
    ).all(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/athletes/:id/trainings', err);
    res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
  }
});

app.post('/api/athletes/:id/trainings', (req, res) => {
  try {
    const athlete = db.prepare('SELECT * FROM athletes WHERE id = ?').get(req.params.id);
    if (!athlete) return res.status(404).json({ error: 'Sporcu bulunamadı.' });

    const result = db.prepare('INSERT INTO trainings (athlete_id) VALUES (?)').run(req.params.id);
    const row = db.prepare('SELECT * FROM trainings WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json(row);
  } catch (err) {
    console.error('POST /api/athletes/:id/trainings', err);
    res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
  }
});

app.get('/api/athletes/:id/stats', (req, res) => {
  try {
    const trainings = db.prepare(
      'SELECT id, created_at FROM trainings WHERE athlete_id = ? ORDER BY created_at'
    ).all(req.params.id);

    const progression = [];
    const shotTypes = {
      'Sabit Catch & Shoot': { attempted: 0, made: 0 },
      'Hareketli Catch & Shoot': { attempted: 0, made: 0 },
      'Dribling Üzeri': { attempted: 0, made: 0 },
      'Crossover Üzeri': { attempted: 0, made: 0 }
    };

    for (const t of trainings) {
      const records = db.prepare('SELECT * FROM shot_records WHERE training_id = ?').all(t.id);
      let att = 0;
      let made = 0;

      for (const r of records) {
        att += r.attempted;
        made += r.made;

        const key = r.shot_type in shotTypes ? r.shot_type : 'Sabit Catch & Shoot';
        shotTypes[key].attempted += r.attempted;
        shotTypes[key].made += r.made;
      }

      progression.push({
        trainingId: t.id,
        label: `${trainings.indexOf(t) + 1}. Antrenman`,
        date: t.created_at,
        pct: att ? Math.round((made / att) * 100) : 0
      });
    }

    const shotTypeDistribution = Object.entries(shotTypes)
      .map(([name, d]) => ({
        name,
        value: d.attempted ? Math.round((d.made / d.attempted) * 100) : 0,
        totalAttempted: d.attempted,
        totalMade: d.made
      }))
      .filter(x => x.totalAttempted > 0);

    res.json({ progression, shotTypeDistribution });
  } catch (err) {
    console.error('GET /api/athletes/:id/stats', err);
    res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
  }
});

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

// --- Trainings ---
app.get('/api/trainings/:id', (req, res) => {
  try {
    const training = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);

    if (!training) {
      return res.status(404).json({ error: 'Antrenman bulunamadı.' });
    }

    const records = db.prepare(
      'SELECT * FROM shot_records WHERE training_id = ? ORDER BY id'
    ).all(req.params.id);

    res.json({ ...training, records });
  } catch (err) {
    console.error('GET /api/trainings/:id', err);
    res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
  }
});

app.put('/api/trainings/:id', (req, res) => {
  try {
    const { records } = req.body || {};

    const training = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);

    if (!training) {
      return res.status(404).json({ error: 'Antrenman bulunamadı.' });
    }

    const validationError = validateRecords(records);
    if (validationError) return res.status(400).json({ error: validationError });

    writeTrainingRecords(req.params.id, records);

    const updated = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);

    const recs = db.prepare(
      'SELECT * FROM shot_records WHERE training_id = ? ORDER BY id'
    ).all(req.params.id);

    res.json({ ...updated, records: recs });
  } catch (err) {
    console.error('PUT /api/trainings/:id', err);
    res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
  }
});

// --- Stats for dashboard ---
app.get('/api/stats/branch/:branch', (req, res) => {
  try {
    const { branch } = req.params;

    const athletes = db.prepare('SELECT id FROM athletes WHERE branch = ? AND coach_id = ?').all(branch, req.user.id);
    const ids = athletes.map(a => a.id);

    if (ids.length === 0) {
      return res.json({
        monthlyTrend: [],
        shotTypeDistribution: [],
        ageGroupSuccess: []
      });
    }

    const placeholders = ids.map(() => '?').join(',');

    const trainings = db.prepare(
      `SELECT id, athlete_id, created_at FROM trainings WHERE athlete_id IN (${placeholders}) ORDER BY created_at`
    ).all(...ids);

    const monthly = {};

    const shotTypes = {
      'Sabit Catch & Shoot': { attempted: 0, made: 0 },
      'Hareketli Catch & Shoot': { attempted: 0, made: 0 },
      'Dribling Üzeri': { attempted: 0, made: 0 },
      'Crossover Üzeri': { attempted: 0, made: 0 }
    };

    const ageUnder18 = { attempted: 0, made: 0 };
    const ageOver18 = { attempted: 0, made: 0 };
    const ageUnknown = { attempted: 0, made: 0 };

    for (const t of trainings) {
      const yearMonth = (t.created_at || '').toString().slice(0, 7);

      if (!yearMonth) continue;

      if (!monthly[yearMonth]) {
        monthly[yearMonth] = { attempted: 0, made: 0 };
      }

      const records = db.prepare('SELECT * FROM shot_records WHERE training_id = ?').all(t.id);
      const athlete = db.prepare('SELECT birth_date FROM athletes WHERE id = ?').get(t.athlete_id);

      const group = ageGroupAtTraining(athlete?.birth_date, t.created_at);
      const ageTotals = group === 'under18' ? ageUnder18 : group === 'adult' ? ageOver18 : ageUnknown;

      for (const r of records) {
        monthly[yearMonth].attempted += r.attempted;
        monthly[yearMonth].made += r.made;

        const key = r.shot_type in shotTypes ? r.shot_type : 'Sabit Catch & Shoot';

        shotTypes[key].attempted += r.attempted;
        shotTypes[key].made += r.made;

        ageTotals.attempted += r.attempted;
        ageTotals.made += r.made;
      }
    }

    const monthlyTrend = Object.entries(monthly)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, d]) => ({
        month,
        pct: d.attempted ? Math.round((d.made / d.attempted) * 100) : 0
      }));

    const shotTypeDistribution = Object.entries(shotTypes)
      .map(([name, d]) => ({
        name,
        value: d.attempted ? Math.round((d.made / d.attempted) * 100) : 0,
        totalAttempted: d.attempted,
        totalMade: d.made
      }))
      .filter(x => x.totalAttempted > 0);

    const ageGroupSuccess = [
      ['18 Yaş Altı', ageUnder18], ['18 Yaş ve Üzeri', ageOver18], ['Yaş Bilinmiyor', ageUnknown]
    ].map(([name, totals]) => ({
      name, pct: totals.attempted ? Math.round(totals.made / totals.attempted * 100) : 0,
      totalAttempted: totals.attempted, totalMade: totals.made
    }));

    res.json({
      monthlyTrend,
      shotTypeDistribution,
      ageGroupSuccess
    });
  } catch (err) {
    console.error('GET /api/stats/branch/:branch', err);
    res.status(500).json({ error: 'Sunucu hatası', detail: undefined });
  }
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({
    error: 'Sunucu hatası',
    detail: undefined
  });
});

const PORT = Number(process.env.PORT || 3001);

app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
  console.log(`API http://localhost:${PORT}`);
  console.log('Telefonla test için HOST ve ALLOWED_ORIGINS ayarlarını README üzerinden yapılandırın.');
});