// functions/_lib/telegramAuth.js
// Проверка подлинности initData от Telegram Mini App.
// Использует Web Crypto API (crypto.subtle) — он стандартный и доступен
// в среде Cloudflare Workers/Pages Functions без node-зависимостей.
// Алгоритм: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

import { HttpError } from './store.js';

async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return new Uint8Array(signature);
}

function bytesToHex(bytes) {
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function validateInitData(initData, botToken) {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const entries = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const dataCheckString = entries.map(([k, v]) => `${k}=${v}`).join('\n');

  const secretKeyBytes = await hmacSha256(new TextEncoder().encode('WebAppData'), botToken);
  const computedBytes = await hmacSha256(secretKeyBytes, dataCheckString);
  const computedHex = bytesToHex(computedBytes);

  if (computedHex !== hash) return null;

  const userJson = params.get('user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

// Достаёт пользователя из заголовка X-Telegram-Init-Data.
// В режиме разработки (env.SKIP_TELEGRAM_AUTH === 'true') принимает пользователя
// напрямую из заголовков X-Dev-Telegram-Id / X-Dev-Telegram-Name — это позволяет
// тестировать приложение через `wrangler pages dev` в обычном браузере.
export async function authenticate(request, env) {
  const skipAuth = env.SKIP_TELEGRAM_AUTH === 'true';
  const botToken = env.BOT_TOKEN;
  const initData = request.headers.get('x-telegram-init-data');

  if (initData && botToken) {
    const user = await validateInitData(initData, botToken);
    if (user) {
      return {
        id: String(user.id),
        username: user.username || null,
        first_name: user.first_name || null,
      };
    }
    if (!skipAuth) {
      throw new HttpError(401, 'invalid_telegram_signature');
    }
  }

  if (skipAuth) {
    const devId = request.headers.get('x-dev-telegram-id') || 'dev-user-1';
    const devName = request.headers.get('x-dev-telegram-name') || 'Тестовый пользователь';
    return { id: String(devId), username: null, first_name: String(devName) };
  }

  throw new HttpError(401, 'missing_telegram_auth');
}
