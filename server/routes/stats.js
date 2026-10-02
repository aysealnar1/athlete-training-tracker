import db from '../db.js';
import { trainingDateKey } from '../../shared/training-time.mjs';
import { ageGroupAtTraining } from '../age-group.js';

export function installStatsRoutes(app) {
  app.get('/api/athletes/:id/stats', (req, res) => {
    try {
      const { dateFrom = '', dateTo = '' } = req.query;
      const validDate = value => typeof value === 'string' && (value === '' ||
        /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) &&
        new Date(value + 'T00:00:00Z').toISOString().slice(0,10) === value);
      if (!validDate(dateFrom) || !validDate(dateTo) || (dateFrom && dateTo && dateFrom > dateTo)) {
        return res.status(400).json({ error: 'Geçerli bir tarih aralığı seçin.' });
      }
      const trainings = db.prepare(
        'SELECT id, created_at FROM trainings WHERE athlete_id = ? ORDER BY created_at, id'
      ).all(req.params.id).map((training, index) => ({...training, number: index + 1}));

      const progression = [];
      const shotTypes = {
        'Sabit Catch & Shoot': { attempted: 0, made: 0 },
        'Hareketli Catch & Shoot': { attempted: 0, made: 0 },
        'Dribling Üzeri': { attempted: 0, made: 0 },
        'Crossover Üzeri': { attempted: 0, made: 0 }
      };

      for (const t of trainings) {
        const date = trainingDateKey(t.created_at);
        if ((dateFrom && date < dateFrom) || (dateTo && date > dateTo)) continue;
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

        if (att === 0) continue;
        progression.push({
          trainingId: t.id,
          label: `${t.number}. Antrenman`,
          date: t.created_at,
          pct: Math.round((made / att) * 100),
          totalAttempted: att, totalMade: made
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
        const trainingDate = trainingDateKey(t.created_at);
        const yearMonth = trainingDate.slice(0, 7);

        if (!yearMonth) continue;

        if (!monthly[yearMonth]) {
          monthly[yearMonth] = { attempted: 0, made: 0 };
        }

        const records = db.prepare('SELECT * FROM shot_records WHERE training_id = ?').all(t.id);
        const athlete = db.prepare('SELECT birth_date FROM athletes WHERE id = ?').get(t.athlete_id);

        const group = ageGroupAtTraining(athlete?.birth_date, trainingDate);
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
        .filter(([, totals]) => totals.attempted > 0)
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
}
