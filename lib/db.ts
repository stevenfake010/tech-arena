import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'demo-day.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    seedUsers(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      department TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'normal'
    );

    CREATE TABLE IF NOT EXISTS demos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      summary TEXT NOT NULL,
      track TEXT NOT NULL,
      demo_link TEXT,
      submitter1_name TEXT NOT NULL,
      submitter1_dept TEXT NOT NULL,
      submitter2_name TEXT,
      submitter2_dept TEXT,
      background TEXT,
      solution TEXT,
      media_urls TEXT DEFAULT '[]',
      submitted_by INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (submitted_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voter_id INTEGER NOT NULL,
      demo_id INTEGER NOT NULL,
      vote_type TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (voter_id) REFERENCES users(id),
      FOREIGN KEY (demo_id) REFERENCES demos(id)
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique ON votes(voter_id, demo_id, vote_type);

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      author_id INTEGER NOT NULL,
      title TEXT,
      content TEXT NOT NULL,
      category TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS message_upvotes (
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      PRIMARY KEY (message_id, user_id),
      FOREIGN KEY (message_id) REFERENCES messages(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

function seedUsers(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c > 0) return;

  const usersPath = path.join(process.cwd(), 'data', 'users.json');
  if (!fs.existsSync(usersPath)) return;

  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));
  const insert = db.prepare('INSERT OR IGNORE INTO users (name, department, role) VALUES (?, ?, ?)');
  const tx = db.transaction(() => {
    for (const u of users) {
      insert.run(u.name, u.department, u.role);
    }
  });
  tx();
}

export default getDb;
