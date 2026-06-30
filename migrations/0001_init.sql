-- migrations/0001_init.sql
-- Схема для D1 (полностью совместима с обычным SQLite).

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id   TEXT UNIQUE NOT NULL,
  username      TEXT,
  first_name    TEXT,
  pair_id       INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pair_id) REFERENCES pairs(id)
);

CREATE TABLE IF NOT EXISTS pairs (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  invite_code      TEXT UNIQUE NOT NULL,
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  streak_start     TEXT NOT NULL DEFAULT (datetime('now')),
  paused           INTEGER NOT NULL DEFAULT 0,
  best_streak_days INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  pair_id     INTEGER NOT NULL,
  user_id     INTEGER,
  type        TEXT NOT NULL CHECK (type IN ('created','fight','reconcile')),
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (pair_id) REFERENCES pairs(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_events_pair ON events(pair_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_telegram ON users(telegram_id);
