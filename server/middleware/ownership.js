import db from '../db.js';

export function installOwnershipChecks(app) {
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
}
