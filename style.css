// client/app.js
// Логика Telegram Mini App «Огонёк». Без фреймворков — чистый JS.

(function () {
  'use strict';

  // ---------- Telegram WebApp SDK ----------
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    tg.ready();
    tg.expand();
    applyTelegramTheme();
    tg.onEvent && tg.onEvent('themeChanged', applyTelegramTheme);
  }

  function applyTelegramTheme() {
    if (!tg || !tg.themeParams) return;
    const root = document.documentElement.style;
    const tp = tg.themeParams;
    // Мягко подмешиваем цвета темы Telegram, не теряя фирменный огонёк-акцент.
    if (tp.bg_color) root.setProperty('--bg-deep', tp.bg_color);
    if (tp.secondary_bg_color) root.setProperty('--bg-card', tp.secondary_bg_color);
    if (tp.text_color) root.setProperty('--text-light', tp.text_color);
    if (tp.hint_color) root.setProperty('--text-faint', tp.hint_color);
  }

  function hapticImpact(style) {
    if (tg && tg.HapticFeedback) tg.HapticFeedback.impactOccurred(style || 'light');
  }
  function hapticNotify(type) {
    if (tg && tg.HapticFeedback) tg.HapticFeedback.notificationOccurred(type || 'success');
  }

  // ---------- API helper ----------
  const API_BASE = '/api';

  function devHeaders() {
    // Используется только когда приложение открыто вне Telegram (для разработки).
    let devId = localStorage.getItem('dev_telegram_id');
    if (!devId) {
      devId = 'dev-' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem('dev_telegram_id', devId);
    }
    return { 'X-Dev-Telegram-Id': devId, 'X-Dev-Telegram-Name': 'Гость' };
  }

  async function api(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (tg && tg.initData) {
      headers['X-Telegram-Init-Data'] = tg.initData;
    } else {
      Object.assign(headers, devHeaders());
    }
    const res = await fetch(API_BASE + path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.error || 'request_failed');
      err.payload = data;
      throw err;
    }
    return data;
  }

  // ---------- Состояние ----------
  let pairState = null;
  let calendarMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // ---------- DOM refs ----------
  const $ = (sel) => document.querySelector(sel);
  const screens = {
    loading: $('#screen-loading'),
    onboarding: $('#screen-onboarding'),
    home: $('#screen-home'),
    history: $('#screen-history'),
    achievements: $('#screen-achievements'),
    settings: $('#screen-settings'),
  };
  const bottomNav = $('#bottom-nav');

  function showScreen(name) {
    Object.values(screens).forEach((el) => el.classList.add('hidden'));
    screens[name].classList.remove('hidden');
    if (name === 'home' || name === 'history' || name === 'achievements' || name === 'settings') {
      bottomNav.classList.remove('hidden');
      document.querySelectorAll('.nav-btn').forEach((btn) => {
        btn.classList.toggle('nav-btn--active', btn.dataset.screen === name);
      });
    } else {
      bottomNav.classList.add('hidden');
    }
  }

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.remove('hidden');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add('hidden'), 2400);
  }

  // ---------- Инициализация ----------
  async function init() {
    try {
      await api('GET', '/me');
      const state = await api('GET', '/pair/state').catch((e) => {
        if (e.payload && e.payload.error === 'no_pair') return null;
        throw e;
      });
      if (state) {
        pairState = state;
        renderHome();
        showScreen('home');
      } else {
        showScreen('onboarding');
      }
    } catch (e) {
      console.error(e);
      toast('Не удалось подключиться к серверу');
      showScreen('onboarding');
    }
  }

  // ---------- Онбординг ----------
  $('#btn-create-pair').addEventListener('click', async () => {
    try {
      pairState = await api('POST', '/pair/create');
      hapticNotify('success');
      renderHome();
      showScreen('home');
      toast('Пара создана! Поделитесь кодом из настроек 💌');
    } catch (e) {
      showOnboardingError('Не удалось создать пару, попробуйте ещё раз');
    }
  });

  $('#form-join-pair').addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = $('#input-invite-code').value.trim().toUpperCase();
    if (code.length < 4) {
      showOnboardingError('Введите код приглашения целиком');
      return;
    }
    try {
      pairState = await api('POST', '/pair/join', { code });
      hapticNotify('success');
      renderHome();
      showScreen('home');
      toast('Вы подключились к общему огоньку ❤️');
    } catch (e) {
      const reason =
        e.payload && e.payload.error === 'invite_not_found'
          ? 'Такого кода не существует'
          : e.payload && e.payload.error === 'pair_full'
          ? 'В этой паре уже два человека'
          : 'Не получилось войти, проверьте код';
      showOnboardingError(reason);
    }
  });

  function showOnboardingError(text) {
    const el = $('#onboarding-error');
    el.textContent = text;
    el.classList.remove('hidden');
  }

  // ---------- Главный экран ----------
  function renderHome() {
    if (!pairState) return;
    $('#level-emoji').textContent = pairState.level.emoji;
    $('#level-title').textContent = pairState.level.title;

    if (pairState.paused) {
      $('#hero-label').textContent = 'Вы недавно поссорились';
      $('#hero-days').textContent = '0';
      $('#hero-unit').textContent = 'дней без ссор';
      $('#hero-hm').textContent = 'Нажмите «Помирились», когда будете готовы';
      $('#btn-fight').classList.add('hidden');
      $('#btn-reconcile').classList.remove('hidden');
    } else {
      $('#hero-label').textContent = 'Сегодня вы не ссоритесь уже';
      $('#hero-days').textContent = pairState.streak.days;
      $('#hero-unit').textContent = pluralDays(pairState.streak.days);
      $('#hero-hm').textContent = `${pairState.streak.hours} ч ${pairState.streak.minutes} мин`;
      $('#btn-fight').classList.remove('hidden');
      $('#btn-reconcile').classList.add('hidden');
    }

    $('#stat-together').textContent = pairState.stats.totalDaysTogether;
    $('#stat-current').textContent = pairState.stats.currentStreakDays;
    $('#stat-fights').textContent = pairState.stats.totalFights;
    $('#stat-best').textContent = pairState.stats.bestStreakDays;

    updateFlameIntensity(pairState.paused ? 0 : pairState.streak.days);
  }

  function pluralDays(n) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'дней';
    if (mod10 === 1) return 'день';
    if (mod10 >= 2 && mod10 <= 4) return 'дня';
    return 'дней';
  }

  // Огонёк визуально «разгорается» по мере роста серии без ссор.
  function updateFlameIntensity(days) {
    const s1 = $('#flameStop1');
    const s2 = $('#flameStop2');
    const s3 = $('#flameStop3');
    if (!s1 || !s2 || !s3) return;
    if (days <= 0) {
      s1.setAttribute('stop-color', '#7A5A6E');
      s2.setAttribute('stop-color', '#9A6E76');
      s3.setAttribute('stop-color', '#C7AFC4');
    } else if (days < 30) {
      s1.setAttribute('stop-color', '#FF8E72');
      s2.setAttribute('stop-color', '#F4C77B');
      s3.setAttribute('stop-color', '#FFE6B8');
    } else if (days < 100) {
      s1.setAttribute('stop-color', '#FF7A57');
      s2.setAttribute('stop-color', '#FFC15E');
      s3.setAttribute('stop-color', '#FFF0C2');
    } else {
      s1.setAttribute('stop-color', '#FF6A3D');
      s2.setAttribute('stop-color', '#FFD24C');
      s3.setAttribute('stop-color', '#FFFFFF');
    }
  }

  // ---------- Кнопка "Мы поссорились" ----------
  $('#btn-fight').addEventListener('click', () => {
    $('#modal-reason').classList.remove('hidden');
  });
  $('#modal-reason-cancel').addEventListener('click', () => {
    $('#modal-reason').classList.add('hidden');
  });
  $('#reason-options').addEventListener('click', async (e) => {
    const btn = e.target.closest('.reason-btn');
    if (!btn) return;
    const reason = btn.dataset.reason;
    $('#modal-reason').classList.add('hidden');
    try {
      pairState = await api('POST', '/pair/fight', { reason });
      hapticImpact('heavy');
      renderHome();
      toast('Записали. Помиритесь, когда будете готовы 🤍');
    } catch (err) {
      toast('Не удалось сохранить, попробуйте снова');
    }
  });

  // ---------- Кнопка "Помирились" ----------
  $('#btn-reconcile').addEventListener('click', async () => {
    try {
      pairState = await api('POST', '/pair/reconcile');
      hapticNotify('success');
      renderHome();
      toast('Огонёк снова разгорается ❤️‍🔥');
    } catch (err) {
      toast('Не удалось сохранить, попробуйте снова');
    }
  });

  // ---------- Нижняя навигация ----------
  bottomNav.addEventListener('click', (e) => {
    const btn = e.target.closest('.nav-btn');
    if (!btn) return;
    const screen = btn.dataset.screen;
    showScreen(screen);
    if (screen === 'home') renderHome();
    if (screen === 'history') loadHistory();
    if (screen === 'achievements') renderAchievements();
    if (screen === 'settings') renderSettings();
  });
  $('#btn-open-settings').addEventListener('click', () => {
    showScreen('settings');
    renderSettings();
    document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('nav-btn--active', b.dataset.screen === 'settings'));
  });

  // ---------- История / Календарь ----------
  async function loadHistory() {
    try {
      const [{ events }, calendar] = await Promise.all([
        api('GET', '/pair/history'),
        api('GET', `/pair/calendar?month=${calendarMonth}`),
      ]);
      renderCalendar(calendar.fightDays);
      renderEvents(events);
    } catch (e) {
      toast('Не удалось загрузить историю');
    }
  }

  $('#cal-prev').addEventListener('click', () => {
    calendarMonth = shiftMonth(calendarMonth, -1);
    loadHistory();
  });
  $('#cal-next').addEventListener('click', () => {
    calendarMonth = shiftMonth(calendarMonth, 1);
    loadHistory();
  });

  function shiftMonth(yyyyMm, delta) {
    const [y, m] = yyyyMm.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return d.toISOString().slice(0, 7);
  }

  function renderCalendar(fightDays) {
    const [year, month] = calendarMonth.split('-').map(Number);
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    });
    $('#cal-month-label').textContent = monthLabel;

    const firstDay = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    // Понедельник = 0
    const startOffset = (firstDay.getDay() + 6) % 7;

    const grid = $('#calendar-grid');
    grid.innerHTML = '';

    for (let i = 0; i < startOffset; i++) {
      const cell = document.createElement('div');
      cell.className = 'cal-day cal-day--empty';
      grid.appendChild(cell);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const fightSet = new Set(fightDays);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarMonth}-${String(day).padStart(2, '0')}`;
      const cell = document.createElement('div');
      cell.textContent = String(day);
      let cls = 'cal-day';
      if (dateStr > todayStr) {
        cls += ' cal-day--future';
      } else if (fightSet.has(dateStr)) {
        cls += ' cal-day--fight';
      } else {
        cls += ' cal-day--ok';
      }
      cell.className = cls;
      grid.appendChild(cell);
    }
  }

  function renderEvents(events) {
    const list = $('#events-list');
    list.innerHTML = '';
    if (!events.length) {
      list.innerHTML = '<li class="empty-state">Событий пока нет — это хороший знак 🤍</li>';
      return;
    }
    for (const ev of events) {
      const li = document.createElement('li');
      li.className = 'event-item';
      const icon = ev.type === 'fight' ? '😢' : ev.type === 'reconcile' ? '❤️' : '✨';
      const title =
        ev.type === 'fight'
          ? `Ссора · ${ev.reason || 'без причины'}`
          : ev.type === 'reconcile'
          ? 'Помирились'
          : 'Пара создана';
      const who = ev.first_name || ev.username || '';
      const date = formatDateTime(ev.created_at);
      li.innerHTML = `
        <span class="event-icon">${icon}</span>
        <span class="event-body">
          <span class="event-title">${escapeHtml(title)}</span><br/>
          <span class="event-meta">${escapeHtml(who)} · ${date}</span>
        </span>`;
      list.appendChild(li);
    }
  }

  function formatDateTime(isoStr) {
    // SQLite хранит datetime('now') как 'YYYY-MM-DD HH:MM:SS' в UTC, без суффикса.
    const normalized = isoStr.includes('T') ? isoStr : isoStr.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Достижения ----------
  function renderAchievements() {
    if (!pairState) return;
    const grid = $('#achievements-grid');
    grid.innerHTML = '';
    for (const a of pairState.achievements) {
      const card = document.createElement('div');
      card.className = 'achievement-card' + (a.unlocked ? '' : ' achievement-card--locked');
      card.innerHTML = `
        <span class="achievement-emoji">${a.emoji}</span>
        <span class="achievement-title">${escapeHtml(a.title)}</span>
        <span class="achievement-state">${a.unlocked ? 'Получено' : 'Заблокировано'}</span>`;
      grid.appendChild(card);
    }

    const levels = [
      { id: 'start', minDays: 0, title: 'Начало', emoji: '🌱' },
      { id: 'strong', minDays: 30, title: 'Крепкая пара', emoji: '🌿' },
      { id: 'team', minDays: 180, title: 'Настоящая команда', emoji: '🌳' },
      { id: 'forever', minDays: 365, title: 'Неразлучные', emoji: '👑' },
    ];
    const track = $('#levels-track');
    track.innerHTML = '';
    for (const lvl of levels) {
      const row = document.createElement('div');
      row.className = 'level-row' + (lvl.id === pairState.level.id ? ' level-row--active' : '');
      row.innerHTML = `
        <span class="level-row-emoji">${lvl.emoji}</span>
        <span class="level-row-title">${escapeHtml(lvl.title)}</span>
        <span class="level-row-days">от ${lvl.minDays} дн.</span>`;
      track.appendChild(row);
    }
  }

  // ---------- Настройки ----------
  function renderSettings() {
    if (!pairState) return;
    $('#settings-invite-code').textContent = pairState.inviteCode;
    const list = $('#settings-members');
    list.innerHTML = '';
    for (const m of pairState.members) {
      const li = document.createElement('li');
      li.textContent = '👤 ' + (m.first_name || m.username || 'Без имени');
      list.appendChild(li);
    }
  }

  $('#btn-copy-code').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(pairState.inviteCode);
      toast('Код скопирован');
    } catch {
      toast(pairState.inviteCode);
    }
  });

  $('#btn-leave-pair').addEventListener('click', async () => {
    const sure = window.confirm('Точно покинуть пару? Это нельзя отменить.');
    if (!sure) return;
    try {
      await api('POST', '/pair/leave');
      pairState = null;
      showScreen('onboarding');
    } catch {
      toast('Не удалось покинуть пару');
    }
  });

  // ---------- Старт ----------
  init();
})();
