// functions/_lib/pairLogic.js
// Обработчики бизнес-операций над парой. Каждая функция принимает D1-биндинг
// (db) и нужные данные, возвращает готовый к JSON-сериализации объект.

import { HttpError, createUniqueInviteCode, getPairById } from './store.js';
import { MS_PER_DAY, ACHIEVEMENTS, currentLevel, msBetween, formatDuration } from './logic.js';

export async function buildPairState(db, pair) {
  const now = new Date();
  const streakMs = pair.paused ? 0 : msBetween(pair.streak_start, now);
  const streakDuration = formatDuration(streakMs);
  const streakDays = pair.paused ? 0 : Math.floor(streakMs / MS_PER_DAY);

  const totalDaysTogether = Math.floor(msBetween(pair.created_at, now) / MS_PER_DAY);

  const fightsRow = await db
    .prepare("SELECT COUNT(*) AS c FROM events WHERE pair_id = ? AND type = 'fight'")
    .bind(pair.id)
    .first();
  const totalFights = fightsRow ? fightsRow.c : 0;

  const bestStreak = Math.max(pair.best_streak_days, streakDays);
  const level = currentLevel(totalDaysTogether);
  const achievements = ACHIEVEMENTS.map((a) => ({ ...a, unlocked: bestStreak >= a.days }));

  const membersResult = await db
    .prepare('SELECT id, username, first_name FROM users WHERE pair_id = ?')
    .bind(pair.id)
    .all();
  const members = membersResult.results || [];

  return {
    pairId: pair.id,
    inviteCode: pair.invite_code,
    createdAt: pair.created_at,
    paused: !!pair.paused,
    streak: {
      days: streakDays,
      hours: streakDuration.hours,
      minutes: streakDuration.minutes,
      since: pair.streak_start,
    },
    stats: {
      totalDaysTogether,
      totalFights,
      bestStreakDays: bestStreak,
      currentStreakDays: streakDays,
    },
    level,
    achievements,
    members,
  };
}

export async function handleCreatePair(db, user) {
  if (user.pair_id) throw new HttpError(400, 'already_in_pair');

  const inviteCode = await createUniqueInviteCode(db);
  const insertResult = await db
    .prepare('INSERT INTO pairs (invite_code) VALUES (?)')
    .bind(inviteCode)
    .run();
  const pairId = insertResult.meta.last_row_id;

  await db.prepare('UPDATE users SET pair_id = ? WHERE id = ?').bind(pairId, user.id).run();
  await db
    .prepare("INSERT INTO events (pair_id, user_id, type) VALUES (?, ?, 'created')")
    .bind(pairId, user.id)
    .run();

  const pair = await getPairById(db, pairId);
  return buildPairState(db, pair);
}

export async function handleJoinPair(db, user, rawCode) {
  if (user.pair_id) throw new HttpError(400, 'already_in_pair');

  const code = String(rawCode || '').toUpperCase().trim();
  const pair = await db.prepare('SELECT * FROM pairs WHERE invite_code = ?').bind(code).first();
  if (!pair) throw new HttpError(404, 'invite_not_found');

  const countRow = await db
    .prepare('SELECT COUNT(*) AS c FROM users WHERE pair_id = ?')
    .bind(pair.id)
    .first();
  if (countRow && countRow.c >= 2) throw new HttpError(400, 'pair_full');

  await db.prepare('UPDATE users SET pair_id = ? WHERE id = ?').bind(pair.id, user.id).run();
  return buildPairState(db, pair);
}

export async function handleFight(db, pair, user, rawReason) {
  const reason = String(rawReason || 'Другое').slice(0, 100);

  if (!pair.paused) {
    const streakDays = Math.floor(msBetween(pair.streak_start) / MS_PER_DAY);
    const newBest = Math.max(pair.best_streak_days, streakDays);
    await db
      .prepare('UPDATE pairs SET paused = 1, best_streak_days = ? WHERE id = ?')
      .bind(newBest, pair.id)
      .run();
  }

  await db
    .prepare("INSERT INTO events (pair_id, user_id, type, reason) VALUES (?, ?, 'fight', ?)")
    .bind(pair.id, user.id, reason)
    .run();

  const updatedPair = await getPairById(db, pair.id);
  return buildPairState(db, updatedPair);
}

export async function handleReconcile(db, pair, user) {
  await db
    .prepare("UPDATE pairs SET paused = 0, streak_start = datetime('now') WHERE id = ?")
    .bind(pair.id)
    .run();
  await db
    .prepare("INSERT INTO events (pair_id, user_id, type) VALUES (?, ?, 'reconcile')")
    .bind(pair.id, user.id)
    .run();

  const updatedPair = await getPairById(db, pair.id);
  return buildPairState(db, updatedPair);
}

export async function handleHistory(db, pair) {
  const result = await db
    .prepare(
      `SELECT events.id, events.type, events.reason, events.created_at,
              users.first_name, users.username
       FROM events
       LEFT JOIN users ON users.id = events.user_id
       WHERE events.pair_id = ?
       ORDER BY events.created_at DESC
       LIMIT 200`
    )
    .bind(pair.id)
    .all();
  return result.results || [];
}

export async function handleCalendar(db, pair, month) {
  const result = await db
    .prepare(
      `SELECT created_at FROM events
       WHERE pair_id = ? AND type = 'fight' AND substr(created_at, 1, 7) = ?`
    )
    .bind(pair.id, month)
    .all();
  const rows = result.results || [];
  const fightDays = new Set(rows.map((r) => r.created_at.slice(0, 10)));
  return [...fightDays];
}

export async function handleLeave(db, user) {
  await db.prepare('UPDATE users SET pair_id = NULL WHERE id = ?').bind(user.id).run();
  return { ok: true };
}
