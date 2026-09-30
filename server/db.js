import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(process.env.DB_PATH || join(__dirname, 'sport.db'));
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS coaches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, surname TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE, password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS athletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch TEXT NOT NULL DEFAULT 'Basketbol',
    name TEXT NOT NULL,
    surname TEXT NOT NULL,
    height REAL,
    weight REAL,
    body_fat REAL,
    birth_date TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    athlete_id INTEGER NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS shot_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER NOT NULL,
    shot_type TEXT NOT NULL,
    points_json TEXT NOT NULL,
    attempted INTEGER NOT NULL,
    made INTEGER NOT NULL,
    FOREIGN KEY (training_id) REFERENCES trainings(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_athletes_branch ON athletes(branch);
  CREATE INDEX IF NOT EXISTS idx_trainings_athlete ON trainings(athlete_id);
  CREATE INDEX IF NOT EXISTS idx_shot_records_training ON shot_records(training_id);
`);

// Legacy athlete records remain unassigned and cannot be read by new accounts.
if (!db.prepare('PRAGMA table_info(athletes)').all().some(column => column.name === 'coach_id')) {
  db.exec('ALTER TABLE athletes ADD COLUMN coach_id INTEGER REFERENCES coaches(id)');
}
if (!db.prepare('PRAGMA table_info(athletes)').all().some(column => column.name === 'gender')) {
  db.exec('ALTER TABLE athletes ADD COLUMN gender TEXT');
}
db.exec(`CREATE INDEX IF NOT EXISTS idx_athletes_coach ON athletes(coach_id);`);
export default db;
