// functions/_lib/store.js
// Слой доступа к D1. Все запросы асинхронные — это главное отличие от
// прежней версии на better-sqlite3 / node:sqlite, где всё было синхронным.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // без похожих символов (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createUniqueInviteCode(db) {
  let code;
  let exists;
  do {
    code = generateInviteCode();
    exists = await db.prepare('SELECT 1 FROM pairs WHERE invite_code = ?').bind(code).first();
  } while (exists);
  return code;
}

export async function getOrCreateUser(db, telegramUser) {
  let user = await db
    .prepare('SELECT * FROM users WHERE telegram_id = ?')
    .bind(telegramUser.id)
    .first();

  if (!user) {
    const result = await db
      .prepare('INSERT INTO users (telegram_id, username, first_name) VALUES (?, ?, ?)')
      .bind(telegramUser.id, telegramUser.username, telegramUser.first_name)
      .run();
    user = await db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first();
  } else {
    await db
      .prepare('UPDATE users SET username = ?, first_name = ? WHERE id = ?')
      .bind(telegramUser.username, telegramUser.first_name, user.id)
      .run();
    user = await db.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  }
  return user;
}

export async function getPairById(db, pairId) {
  return db.prepare('SELECT * FROM pairs WHERE id = ?').bind(pairId).first();
}

// Бросает 400, если у пользователя ещё нет пары — используется во всех
// /pair/* маршрутах, кроме create/join.
export async function getUserPair(db, user) {
  if (!user.pair_id) {
    throw new HttpError(400, 'no_pair');
  }
  const pair = await getPairById(db, user.pair_id);
  if (!pair) {
    throw new HttpError(400, 'no_pair');
  }
  return pair;
}
