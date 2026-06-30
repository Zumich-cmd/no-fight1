// functions/_lib/logic.js
// Чистые функции без обращений к БД — даты, достижения, уровни.

export const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const ACHIEVEMENTS = [
  { id: 'days_7', days: 7, title: '7 дней без ссор', emoji: '🌟' },
  { id: 'days_30', days: 30, title: '30 дней без ссор', emoji: '🏆' },
  { id: 'days_100', days: 100, title: '100 дней без ссор', emoji: '💎' },
  { id: 'days_365', days: 365, title: 'Год без ссор', emoji: '👑' },
];

export const LEVELS = [
  { id: 'start', minDays: 0, title: 'Начало', emoji: '🌱' },
  { id: 'strong', minDays: 30, title: 'Крепкая пара', emoji: '🌿' },
  { id: 'team', minDays: 180, title: 'Настоящая команда', emoji: '🌳' },
  { id: 'forever', minDays: 365, title: 'Неразлучные', emoji: '👑' },
];

// SQLite/D1 datetime('now') возвращает 'YYYY-MM-DD HH:MM:SS' в UTC, без суффикса.
// new Date(...) в части окружений парсит строку с пробелом как локальное время,
// поэтому нормализуем явно в ISO с 'Z'.
export function toUtcDate(sqliteDatetime) {
  const normalized = sqliteDatetime.includes('T')
    ? sqliteDatetime
    : sqliteDatetime.replace(' ', 'T') + 'Z';
  return new Date(normalized);
}

export function msBetween(fromIso, toDate = new Date()) {
  return toDate.getTime() - toUtcDate(fromIso).getTime();
}

export function formatDuration(ms) {
  if (ms < 0) ms = 0;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  return { days, hours, minutes };
}

export function currentLevel(totalDays) {
  let level = LEVELS[0];
  for (const l of LEVELS) {
    if (totalDays >= l.minDays) level = l;
  }
  return level;
}
