// src/worker.js
// Единая точка входа Cloudflare Worker.
//
// В отличие от Pages Functions (отдельная статика + отдельные функции),
// здесь всё в одном Worker'е: запросы на /api/* обрабатываются нашей
// логикой, всё остальное отдаётся как статика через биндинг ASSETS
// (настраивается в wrangler.toml в секции [assets]).

import { authenticate } from './lib/telegramAuth.js';
import { HttpError, getOrCreateUser, getUserPair } from './lib/store.js';
import {
  buildPairState,
  handleCreatePair,
  handleJoinPair,
  handleFight,
  handleReconcile,
  handleHistory,
  handleCalendar,
  handleLeave,
} from './lib/pairLogic.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

async function safeJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function handleApi(request, env, path) {
  if (!env.DB) {
    return json({ error: 'd1_not_bound' }, 500);
  }

  const method = request.method;
  const db = env.DB;

  try {
    const telegramUser = await authenticate(request, env);
    const user = await getOrCreateUser(db, telegramUser);

    if (path === '/me' && method === 'GET') {
      return json({ user });
    }

    if (path === '/pair/create' && method === 'POST') {
      return json(await handleCreatePair(db, user));
    }

    if (path === '/pair/join' && method === 'POST') {
      const body = await safeJson(request);
      return json(await handleJoinPair(db, user, body.code));
    }

    if (path === '/pair/state' && method === 'GET') {
      const pair = await getUserPair(db, user);
      return json(await buildPairState(db, pair));
    }

    if (path === '/pair/fight' && method === 'POST') {
      const pair = await getUserPair(db, user);
      const body = await safeJson(request);
      return json(await handleFight(db, pair, user, body.reason));
    }

    if (path === '/pair/reconcile' && method === 'POST') {
      const pair = await getUserPair(db, user);
      return json(await handleReconcile(db, pair, user));
    }

    if (path === '/pair/history' && method === 'GET') {
      const pair = await getUserPair(db, user);
      const events = await handleHistory(db, pair);
      return json({ events });
    }

    if (path === '/pair/calendar' && method === 'GET') {
      const pair = await getUserPair(db, user);
      const url = new URL(request.url);
      const month = url.searchParams.get('month') || new Date().toISOString().slice(0, 7);
      const fightDays = await handleCalendar(db, pair, month);
      return json({ month, fightDays });
    }

    if (path === '/pair/leave' && method === 'POST') {
      return json(await handleLeave(db, user));
    }

    return json({ error: 'not_found' }, 404);
  } catch (err) {
    if (err instanceof HttpError) {
      return json({ error: err.message }, err.status);
    }
    console.error('Unhandled error:', err);
    return json({ error: 'internal_error' }, 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      const apiPath = url.pathname.slice('/api'.length) || '/';
      return handleApi(request, env, apiPath);
    }

    // Всё остальное — статика из client/ (биндинг ASSETS, см. wrangler.toml).
    return env.ASSETS.fetch(request);
  },
};
