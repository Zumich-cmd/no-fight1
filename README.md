# 🔥 Огонёк (No-Fight App)

Telegram Mini App для пар: счётчик дней без ссор, общий на двоих.

Полностью на Cloudflare: один **Cloudflare Worker** отдаёт и статику (HTML/CSS/JS), и API,
база данных — **Cloudflare D1** (serverless SQLite). Никакого отдельного сервера держать
не нужно, всё на одном бесплатном тарифе Cloudflare.

> Раньше эта версия была устроена как Cloudflare Pages + Pages Functions — это тоже рабочий
> вариант, но если в вашем аккаунте Cloudflare проект уже создан как **Worker** (это два
> разных типа ресурсов в Cloudflare, даже когда называются одинаково), то проще и надёжнее
> сделать всё как один Worker — см. ниже. Современные Workers умеют отдавать статику напрямую
> через биндинг `assets`, отдельный Pages-проект для этого не нужен.

## Что внутри

```
no-fight-app/
│
├── client/                      ← статика: HTML/CSS/JS, отдаётся через assets-биндинг
│   ├── index.html
│   ├── style.css
│   └── app.js
│
├── src/
│   ├── worker.js                 ← единая точка входа: /api/* → наша логика, остальное → статика
│   └── lib/
│       ├── telegramAuth.js       ← проверка подписи Telegram initData (Web Crypto)
│       ├── store.js              ← запросы к D1: пользователи, пары
│       ├── logic.js              ← чистые функции: даты, достижения, уровни
│       └── pairLogic.js          ← обработчики: создать пару, ссора, примирение…
│
├── migrations/
│   └── 0001_init.sql             ← схема базы для D1
│
├── wrangler.toml                 ← конфиг Worker'а (entry point, assets, D1, переменные)
├── .dev.vars.example             ← пример локальных переменных для разработки
└── package.json
```

## Возможности

- 🔐 Авторизация через Telegram (проверка подписи `initData` через Web Crypto API)
- 💌 Создание пары + код приглашения (6 символов)
- 🔗 Подключение второго человека по коду — общий счётчик на двоих
- ⏳ Таймер «без ссор уже N дней Ч ч М мин»
- 😢 Кнопка «Мы поссорились» с выбором причины
- ❤️ Кнопка «Помирились» — перезапускает таймер
- 📅 Календарь месяца: зелёные/красные дни
- 📝 Лента событий (история)
- 🏆 Достижения: 7 / 30 / 100 / 365 дней без ссор
- 🌱→👑 Уровень отношений по общему стажу пары
- 📊 Статистика: вместе / без ссор / всего ссор / лучший рекорд

## Деплой на Cloudflare — пошагово

### 0. Установка

```bash
npm install
npx wrangler login
```

### 1. Создайте базу данных D1

```bash
npx wrangler d1 create no-fight-db
```

Команда выведет блок вида:

```toml
[[d1_databases]]
binding = "DB"
database_name = "no-fight-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

Скопируйте `database_id` и вставьте его в `wrangler.toml` вместо `PASTE_DATABASE_ID_HERE`.

### 2. Примените схему (миграцию)

```bash
npx wrangler d1 migrations apply no-fight-db --remote
```

### 3. Задайте секрет с токеном бота

```bash
npx wrangler secret put BOT_TOKEN
```

Введите значение — токен от [@BotFather](https://t.me/BotFather).

### 4. Выключите dev-режим для продакшена

В `wrangler.toml` стоит `SKIP_TELEGRAM_AUTH = "true"` — удобно для разработки (открыть
приложение в обычном браузере без Telegram), но в проде подпись обязательно нужно
проверять. Перед боевым деплоем смените на `"false"` либо удалите эту строку совсем.

### 5. Задеплойте

```bash
npm run deploy
```

Это выполнит `wrangler deploy` — соберёт и опубликует Worker целиком (статику + API).

### Если деплой идёт через подключённый GitHub-репозиторий (Cloudflare сам собирает на пуш)

Тогда локально ничего деплоить не нужно — Cloudflare запускает сборку сам при каждом
пуше. Но для этого в настройках проекта в дашборде (**Workers & Pages → ваш проект →
Settings**) должно быть:

- **Deploy command**: `npx wrangler deploy` (это значение по умолчанию для Worker-проектов,
  трогать не нужно)
- В **Variables and secrets** на проде должны быть заданы:
  - `CLOUDFLARE_API_TOKEN` (Secret) — токен с правами Account → Workers Scripts → Edit
    и Account → D1 → Edit, создаётся на странице
    [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens)
  - `CLOUDFLARE_ACCOUNT_ID` (Plaintext) — ID вашего аккаунта (виден в логах деплоя или
    в правом нижнем углу любой страницы дашборда)
  - `BOT_TOKEN` (Secret) — токен бота
  - `SKIP_TELEGRAM_AUTH` = `false` (Plaintext) — для прод-окружения

Миграцию D1 (шаг 2) и привязку базы к проекту через git-деплой Cloudflare не делает
автоматически — это нужно выполнить один раз вручную локальным `wrangler` (шаги 0–2 выше),
после чего обычные пуши в репозиторий будут просто обновлять код Worker'а, данные останутся.

## Локальная разработка

```bash
cp .dev.vars.example .dev.vars
npm run db:migrate:local      # применяет схему к локальной копии D1 (файл на диске)
npm run dev                   # wrangler dev — поднимет Worker локально
```

Откройте адрес, который выведет Wrangler (обычно `http://localhost:8787`). Работает
без Telegram — каждый браузер получает свой dev-аккаунт автоматически.

## API (кратко)

| Метод | Путь                  | Описание                                  |
|-------|------------------------|--------------------------------------------|
| GET   | /api/me                | текущий пользователь                       |
| POST  | /api/pair/create        | создать пару, вернуть код приглашения      |
| POST  | /api/pair/join          | войти по коду `{ code }`                   |
| GET   | /api/pair/state         | состояние пары: таймер, статистика, уровень|
| POST  | /api/pair/fight         | зафиксировать ссору `{ reason }`           |
| POST  | /api/pair/reconcile     | помирились — таймер обнуляется             |
| GET   | /api/pair/history       | лента событий                              |
| GET   | /api/pair/calendar      | дни ссор за месяц `?month=YYYY-MM`         |
| POST  | /api/pair/leave         | покинуть пару                              |

Фронтенд и API на одном домене (один Worker), поэтому CORS не нужен.

## Дальнейшее развитие

- Push-напоминания вечером — Cloudflare Cron Triggers (расписание прямо в этом же
  Worker'е, секция `[triggers]` в `wrangler.toml`) + Telegram Bot API для отправки
- Платные темы оформления, виджет на главный экран
- Экспорт статистики
- Персональные (не только парные) достижения

## Известные ограничения

- Напоминания (push) не реализованы — см. «Дальнейшее развитие»
- Пара ограничена двумя участниками (как и задумано)
- D1 — это SQLite, реплицируемый по edge-сети Cloudflare; для очень высоких нагрузок
  в будущем можно рассмотреть Durable Objects или внешний Postgres, но для MVP пары
  D1 более чем достаточно
