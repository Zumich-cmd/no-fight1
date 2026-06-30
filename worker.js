<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no" />
<title>Огонёк — счётчик дней без ссор</title>
<meta name="description" content="Telegram Mini App для пар: считайте дни без ссор вместе." />

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

<script src="https://telegram.org/js/telegram-web-app.js"></script>
<link rel="stylesheet" href="style.css" />
</head>
<body>

<div id="app" class="app">

  <!-- ===== Экран загрузки ===== -->
  <section id="screen-loading" class="screen screen--loading">
    <div class="ember ember--loading" aria-hidden="true">
      <svg viewBox="0 0 120 160" class="ember-svg">
        <defs>
          <linearGradient id="flameGradLoad" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#FF8E72"/>
            <stop offset="60%" stop-color="#F4C77B"/>
            <stop offset="100%" stop-color="#FFE6B8"/>
          </linearGradient>
        </defs>
        <path class="flame-path" fill="url(#flameGradLoad)" d="M60 10C40 45 25 60 25 95c0 22 16 45 35 45s35-23 35-45c0-14-7-23-12-32 2 14-6 22-12 22-8 0-13-7-11-17 3-16-2-30-10-58Z"/>
      </svg>
    </div>
    <p class="loading-text">Разжигаем огонёк…</p>
  </section>

  <!-- ===== Экран: нет пары (онбординг) ===== -->
  <section id="screen-onboarding" class="screen screen--onboarding hidden">
    <div class="onboarding-hero">
      <svg viewBox="0 0 120 160" class="ember-svg ember-svg--small">
        <defs>
          <linearGradient id="flameGradOnb" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stop-color="#FF8E72"/>
            <stop offset="60%" stop-color="#F4C77B"/>
            <stop offset="100%" stop-color="#FFE6B8"/>
          </linearGradient>
        </defs>
        <path class="flame-path" fill="url(#flameGradOnb)" d="M60 10C40 45 25 60 25 95c0 22 16 45 35 45s35-23 35-45c0-14-7-23-12-32 2 14-6 22-12 22-8 0-13-7-11-17 3-16-2-30-10-58Z"/>
      </svg>
      <h1 class="onboarding-title">Огонёк</h1>
      <p class="onboarding-subtitle">Считайте дни без ссор вместе — один огонёк на двоих.</p>
    </div>

    <div class="onboarding-actions">
      <button id="btn-create-pair" class="btn btn--primary">Создать пару</button>

      <div class="divider"><span>или</span></div>

      <form id="form-join-pair" class="join-form">
        <input id="input-invite-code" class="input input--code" type="text" maxlength="6"
               placeholder="КОД ПРИГЛАШЕНИЯ" autocomplete="off" autocapitalize="characters" />
        <button type="submit" class="btn btn--secondary">Войти по коду</button>
      </form>
    </div>
    <p id="onboarding-error" class="error-text hidden"></p>
  </section>

  <!-- ===== Экран: Главная ===== -->
  <section id="screen-home" class="screen screen--home hidden">
    <header class="topbar">
      <div id="level-pill" class="level-pill">
        <span id="level-emoji">🌱</span>
        <span id="level-title">Начало</span>
      </div>
      <button id="btn-open-settings" class="icon-btn" aria-label="Настройки">⚙️</button>
    </header>

    <div class="hero">
      <div class="ember" aria-hidden="true">
        <svg viewBox="0 0 120 160" class="ember-svg" id="ember-svg-home">
          <defs>
            <linearGradient id="flameGradHome" x1="0" y1="1" x2="0" y2="0">
              <stop id="flameStop1" offset="0%" stop-color="#FF8E72"/>
              <stop id="flameStop2" offset="60%" stop-color="#F4C77B"/>
              <stop id="flameStop3" offset="100%" stop-color="#FFE6B8"/>
            </linearGradient>
          </defs>
          <path class="flame-path" fill="url(#flameGradHome)" d="M60 10C40 45 25 60 25 95c0 22 16 45 35 45s35-23 35-45c0-14-7-23-12-32 2 14-6 22-12 22-8 0-13-7-11-17 3-16-2-30-10-58Z"/>
        </svg>
      </div>

      <p class="hero-label" id="hero-label">Сегодня вы не ссоритесь уже</p>
      <p class="hero-number" id="hero-days">0</p>
      <p class="hero-unit">дней</p>
      <p class="hero-sub" id="hero-hm">0 ч 0 мин</p>
    </div>

    <div class="action-row">
      <button id="btn-fight" class="btn btn--danger">😢 Мы поссорились</button>
      <button id="btn-reconcile" class="btn btn--success hidden">❤️ Помирились</button>
    </div>

    <div class="stat-grid" id="stat-grid">
      <div class="stat-chip">
        <span class="stat-value" id="stat-together">0</span>
        <span class="stat-label">дней вместе</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value" id="stat-current">0</span>
        <span class="stat-label">без ссор сейчас</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value" id="stat-fights">0</span>
        <span class="stat-label">всего ссор</span>
      </div>
      <div class="stat-chip">
        <span class="stat-value" id="stat-best">0</span>
        <span class="stat-label">лучший рекорд</span>
      </div>
    </div>
  </section>

  <!-- ===== Экран: История / Календарь ===== -->
  <section id="screen-history" class="screen screen--history hidden">
    <header class="topbar topbar--simple">
      <h2>История</h2>
    </header>

    <div class="calendar-nav">
      <button id="cal-prev" class="icon-btn" aria-label="Предыдущий месяц">‹</button>
      <span id="cal-month-label" class="cal-month-label">—</span>
      <button id="cal-next" class="icon-btn" aria-label="Следующий месяц">›</button>
    </div>
    <div class="calendar-weekdays">
      <span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span>
    </div>
    <div id="calendar-grid" class="calendar-grid"></div>
    <div class="calendar-legend">
      <span class="legend-item"><i class="legend-dot legend-dot--green"></i>без ссор</span>
      <span class="legend-item"><i class="legend-dot legend-dot--red"></i>была ссора</span>
    </div>

    <h3 class="section-title">Лента событий</h3>
    <ul id="events-list" class="events-list"></ul>
  </section>

  <!-- ===== Экран: Достижения ===== -->
  <section id="screen-achievements" class="screen screen--achievements hidden">
    <header class="topbar topbar--simple">
      <h2>Достижения</h2>
    </header>
    <div id="achievements-grid" class="achievements-grid"></div>

    <h3 class="section-title">Уровень отношений</h3>
    <div id="levels-track" class="levels-track"></div>
  </section>

  <!-- ===== Экран: Настройки ===== -->
  <section id="screen-settings" class="screen screen--settings hidden">
    <header class="topbar topbar--simple">
      <h2>Настройки</h2>
    </header>

    <div class="settings-card">
      <p class="settings-label">Код приглашения для партнёра</p>
      <div class="invite-row">
        <span id="settings-invite-code" class="invite-code">——————</span>
        <button id="btn-copy-code" class="btn btn--small">Скопировать</button>
      </div>
      <p class="settings-hint">Партнёр вводит этот код при первом запуске, чтобы подключиться к общему огоньку.</p>
    </div>

    <div class="settings-card">
      <p class="settings-label">Участники пары</p>
      <ul id="settings-members" class="members-list"></ul>
    </div>

    <div class="settings-card settings-card--danger">
      <p class="settings-label">Покинуть пару</p>
      <p class="settings-hint">Счётчик и история останутся у партнёра. Это действие нельзя отменить.</p>
      <button id="btn-leave-pair" class="btn btn--outline-danger">Покинуть пару</button>
    </div>
  </section>

  <!-- ===== Нижняя навигация ===== -->
  <nav id="bottom-nav" class="bottom-nav hidden">
    <button class="nav-btn nav-btn--active" data-screen="home">
      <span class="nav-icon">❤️</span><span>Главная</span>
    </button>
    <button class="nav-btn" data-screen="history">
      <span class="nav-icon">📅</span><span>История</span>
    </button>
    <button class="nav-btn" data-screen="achievements">
      <span class="nav-icon">🏆</span><span>Награды</span>
    </button>
    <button class="nav-btn" data-screen="settings">
      <span class="nav-icon">⚙️</span><span>Настройки</span>
    </button>
  </nav>

</div>

<!-- ===== Модалка: причина ссоры ===== -->
<div id="modal-reason" class="modal-overlay hidden">
  <div class="modal-sheet">
    <p class="modal-title">Из-за чего поссорились?</p>
    <div id="reason-options" class="reason-grid">
      <button class="reason-btn" data-reason="Ревность">😤 Ревность</button>
      <button class="reason-btn" data-reason="Быт">🧹 Быт</button>
      <button class="reason-btn" data-reason="Деньги">💸 Деньги</button>
      <button class="reason-btn" data-reason="Не поняли друг друга">🗣️ Не поняли друг друга</button>
      <button class="reason-btn" data-reason="Другое">❓ Другое</button>
    </div>
    <button id="modal-reason-cancel" class="btn btn--text">Отмена</button>
  </div>
</div>

<!-- ===== Тост-уведомление ===== -->
<div id="toast" class="toast hidden"></div>

<script src="app.js"></script>
</body>
</html>
