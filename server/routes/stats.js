import db from '../db.js';
import { ageGroupAtTraining } from '../age-group.js';

export function installStatsRoutes(app) {
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
}
