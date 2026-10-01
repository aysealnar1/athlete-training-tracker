import db from '../db.js';
import { validateRecords, createRecordWriter } from '../training-records.js';
const writeTrainingRecords = createRecordWriter(db);

export function installTrainingsRoutes(app) {
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
}
