import express from 'express';
import cors from 'cors';
import { installAuth, requireAuth } from './auth.js';
import { installOwnershipChecks } from './middleware/ownership.js';
import { installAthletesRoutes } from './routes/athletes.js';
import { installTrainingsRoutes } from './routes/trainings.js';
import { installStatsRoutes } from './routes/stats.js';

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

installAuth(app);
app.use('/api', requireAuth);
installOwnershipChecks(app);
installAthletesRoutes(app);
installTrainingsRoutes(app);
installStatsRoutes(app);

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error', err);
  res.status(500).json({
    error: 'Sunucu hatası',
    detail: undefined
  });
});

export default app;
