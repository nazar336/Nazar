# Lolanceizi — Premium Micro-Task Platform

> Повноцінна веб-платформа для мікрозадач з криптоплатежами, гейміфікацією та спільнотою.

---

## Зміст

- [Архітектура](#архітектура)
- [Технології](#технології)
- [Структура проєкту](#структура-проєкту)
- [API ендпоінти](#api-ендпоінти)
- [База даних](#база-даних)
- [Розгортання](#розгортання)
- [Налаштування .env](#налаштування-env)
- [Крипто-мережі](#крипто-мережі)
- [On-chain верифікація](#on-chain-верифікація)
- [Кешування (Redis)](#кешування-redis)
- [API Versioning](#api-versioning)
- [Тестування](#тестування)
- [CI/CD](#cicd)
- [Безпека](#безпека)
- [Функціонал](#функціонал)

---

## Архітектура

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────┐
│   Frontend SPA  │────▶│  PHP REST API    │────▶│  MySQL 8+  │
│  (ES6 Modules)  │     │  (25 endpoints)  │     │  (22 tables)│
└─────────────────┘     └──────┬───────────┘     └────────────┘
                               │
                        ┌──────┴───────┐
                        │  Redis Cache │  (опціонально)
                        │  (leaderboard,│
                        │   rates)      │
                        └──────────────┘
```

- **Frontend**: Модульний SPA на ванільному ES6+ JavaScript (18 модулів, 12 сторінок)
- **Backend**: PHP 8.1+ REST API з PDO (prepared statements)
- **Database**: MySQL 8.0+ (InnoDB, utf8mb4)
- **Caching**: Redis (опціонально) з file-cache fallback
- **PWA**: Service Worker, manifest.json, офлайн-підтримка

---

## Технології

| Шар | Стек |
|-----|------|
| Frontend | Vanilla ES6+ Modules, CSS3 (Custom Properties), PWA |
| Backend | PHP 8.1+, PDO MySQL, REST JSON API |
| Database | MySQL 8.0+ (InnoDB) |
| Cache | Redis (optional) + file-based fallback |
| Tests | PHPUnit 10.5, Vitest 3.2, Playwright (E2E) |
| CI/CD | GitHub Actions (4 jobs) |
| Crypto | CoinGecko API, RPC nodes (5 мереж) |
| i18n | 6 мов (EN, UA, DE, FR, ES, PL) |

---

## Структура проєкту

```
/
├── index.html              # SPA entry point (PWA-ready)
├── styles.css              # Dark neon theme (2,000+ рядків)
├── manifest.json           # PWA manifest
├── sw.js                   # Service Worker (cache-first/network-first)
├── terms.html              # Terms of Service
├── privacy.html            # Політика приватності
│
├── js/                     # 📦 Модульний frontend (18 файлів)
│   ├── main.js             # Entry point
│   ├── api.js              # Fetch wrapper + error handling
│   ├── state.js            # Global state management
│   ├── router.js           # Hash-based SPA routing
│   ├── shell.js            # App shell (nav, layout)
│   ├── i18n.js             # Мультимовність (6 мов)
│   ├── constants.js        # API endpoints, categories
│   ├── utils.js            # Helper functions
│   ├── event-delegation.js # Event system
│   ├── focus-trap.js       # Keyboard accessibility
│   ├── lazy-images.js      # Image lazy loading
│   ├── virtual-scroll.js   # Virtualized scrolling
│   └── pages/              # 12 page components
│       ├── landing.js, auth.js, verify.js, dashboard.js
│       ├── tasks.js, create-task.js, feed.js, wallet.js
│       ├── chat.js, support.js, profile.js, leaderboard.js
│
├── api/                    # 🔧 PHP REST API (26 файлів)
│   ├── config.php          # .env loader + constants
│   ├── bootstrap.php       # Security, DB, CSRF, rate limiting, Redis, cache
│   ├── crypto-lib.php      # Crypto validation + RPC verification
│   ├── cron-verify.php     # 🆕 On-chain auto-verification cron
│   ├── register.php        # POST — реєстрація
│   ├── login.php           # POST — автентифікація
│   ├── logout.php          # POST — вихід
│   ├── verify.php          # POST — email верифікація
│   ├── session.php         # GET — перевірка сесії
│   ├── profile.php         # GET/POST — профіль
│   ├── tasks.php           # CRUD — задачі
│   ├── take-task.php       # POST — взяти задачу (FOR UPDATE)
│   ├── complete-task.php   # POST — завершити задачу
│   ├── feed.php            # GET/POST/DELETE — feed (cursor pagination)
│   ├── wallet.php          # GET — баланс, транзакції
│   ├── coins.php           # POST — tips, трансфери
│   ├── xp.php              # GET/POST — XP, daily check-in
│   ├── points.php          # Points management
│   ├── crypto-deposit.php  # GET/POST — крипто-депозити
│   ├── crypto-withdraw.php # GET/POST — виводи
│   ├── crypto-rates.php    # GET — live курси (cached)
│   ├── chat-rooms.php      # GET/POST — чат-кімнати
│   ├── messages.php        # GET/POST — direct messages
│   ├── leaderboard.php     # GET — рейтинг (cached)
│   ├── support.php         # GET/POST — підтримка
│   ├── admin-verify-deposit.php   # Admin — депозити
│   └── admin-verify-withdraw.php  # Admin — виводи
│
├── tests/                  # 🧪 Тести
│   ├── Unit/               # PHPUnit (34 тести)
│   ├── js/                 # Vitest (51 тест)
│   └── e2e/                # Playwright E2E (22 тести)
│
├── schema.sql              # Основна схема БД (22 таблиці)
├── migration-2026-04-02.sql # Міграція: feed, crypto, withdrawals
├── migration-indexes.sql   # Індекси продуктивності
├── composer.json + lock    # PHP залежності (зафіксовані)
├── package.json + lock     # Node.js залежності
├── phpunit.xml             # PHPUnit конфігурація
├── vitest.config.js        # Vitest конфігурація
├── playwright.config.js    # 🆕 Playwright E2E конфігурація
├── .env.example            # Шаблон змінних середовища
├── .htaccess               # Apache: HTTPS, security headers, API versioning
└── .github/workflows/ci.yml # CI/CD pipeline
```

---

## API ендпоінти

### Аутентифікація

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| POST | `/api/register.php` | Реєстрація + email-верифікація |
| POST | `/api/login.php` | Вхід (rate-limited) |
| POST | `/api/logout.php` | Вихід |
| POST | `/api/verify.php` | Верифікація email (6-digit код) |
| GET | `/api/session.php` | Перевірка сесії + CSRF token |

### Задачі

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| GET | `/api/tasks.php` | Список задач (фільтри, пагінація) |
| POST | `/api/tasks.php` | Створити задачу (рівень 3+) |
| PUT | `/api/tasks.php` | Оновити статус (open/cancelled) |
| DELETE | `/api/tasks.php` | Видалити задачу |
| POST | `/api/take-task.php` | Взяти задачу (`SELECT...FOR UPDATE`) |
| POST | `/api/complete-task.php` | Завершити задачу |

### Гаманець і крипто

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| GET | `/api/wallet.php` | Баланс, транзакції |
| POST | `/api/coins.php` | Tips / трансфери |
| GET/POST | `/api/crypto-deposit.php` | Крипто-депозити (5 мереж) |
| GET/POST | `/api/crypto-withdraw.php` | Виводи (5% комісія) |
| GET | `/api/crypto-rates.php` | Live курси (Redis-cached) |

### Спільнота

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| GET/POST/DELETE | `/api/feed.php` | Feed (cursor-based pagination) |
| GET | `/api/leaderboard.php` | Рейтинг (Redis-cached) |
| GET/POST | `/api/chat-rooms.php` | Чат-кімнати (tier-based) |
| GET/POST | `/api/messages.php` | Direct messages |
| GET/POST | `/api/support.php` | Підтримка / тікети |

### Адмін

| Метод | Ендпоінт | Опис |
|-------|----------|------|
| GET/POST | `/api/admin-verify-deposit.php` | Верифікація депозитів |
| GET/POST | `/api/admin-verify-withdraw.php` | Верифікація виводів |
| GET | `/api/cron-verify.php` | 🆕 On-chain auto-verify (cron) |

### API Versioning

Всі ендпоінти доступні з версійним префіксом:

```
/api/v1/tasks  →  /api/tasks.php
/api/v1/feed   →  /api/feed.php
```

---

## База даних

```bash
# 1. Створити БД:
mysql -u root -p -e "CREATE DATABASE lolanceizi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Основна схема (22 таблиці):
mysql -u root -p lolanceizi < schema.sql

# 3. Міграція (feed, crypto, withdrawals):
mysql -u root -p lolanceizi < migration-2026-04-02.sql

# 4. Індекси продуктивності:
mysql -u root -p lolanceizi < migration-indexes.sql
```

---

## Розгортання

### Вимоги

- PHP 8.1+ (PDO, mbstring, json)
- MySQL 8.0+
- Apache з mod_rewrite
- Composer 2.x
- Node.js 20+ (для тестів)
- Redis (опціонально)

### Кроки

```bash
# 1. Клонувати
git clone https://github.com/nazar336/Nazar.git
cd Nazar

# 2. Встановити PHP залежності
composer install --no-dev

# 3. Налаштувати середовище
cp .env.example .env
# Відредагувати .env — встановити DB, SMTP, ADMIN_SECRET, crypto wallets

# 4. Застосувати БД
mysql -u root -p lolanceizi < schema.sql
mysql -u root -p lolanceizi < migration-2026-04-02.sql
mysql -u root -p lolanceizi < migration-indexes.sql

# 5. (Опціонально) Налаштувати cron для on-chain верифікації
# Кожні 3 хвилини:
*/3 * * * * curl -s -H "X-Admin-Secret: YOUR_SECRET" https://domain/api/cron-verify.php
```

---

## Налаштування .env

```env
# Базове
APP_ENV=production
APP_DOMAIN=lolanceizi.online

# БД
DB_HOST=127.0.0.1
DB_NAME=lolanceizi
DB_USER=lolanceizi_user
DB_PASS=strong_password

# SMTP (Gmail App Password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_digit_app_password

# Адмін
ADMIN_SECRET=random_32_char_secret

# Крипто кеш TTL (секунди, default 300 = 5 хв)
CRYPTO_RATE_CACHE_TTL=300

# Rate limits (кожен: MAX запитів за WINDOW хвилин)
RATE_LIMIT_DEPOSIT_MAX=5
RATE_LIMIT_DEPOSIT_WINDOW=15
RATE_LIMIT_WITHDRAW_MAX=3
RATE_LIMIT_WITHDRAW_WINDOW=60
RATE_LIMIT_TIP_MAX=20
RATE_LIMIT_TIP_WINDOW=60
RATE_LIMIT_CHAT_MAX=60
RATE_LIMIT_CHAT_WINDOW=5
RATE_LIMIT_TASK_MAX=10
RATE_LIMIT_TASK_WINDOW=60
# ... (повний список в .env.example)

# Redis (опціонально — якщо пусто, використовується file-cache)
REDIS_HOST=
REDIS_PORT=6379
REDIS_PREFIX=lolanceizi:
```

### Gmail App Password

1. https://myaccount.google.com → Security → 2-Step Verification → увімкнути
2. Security → App passwords → Mail → Other → "Lolanceizi" → Generate
3. Скопіювати 16-значний код у `SMTP_PASS`

---

## Крипто-мережі

| Мережа | Валюта | Формат адреси |
|--------|--------|---------------|
| TRC20 | USDT | `T` + 33 символи (base58) |
| BEP20 | USDT | `0x` + 40 hex символів |
| ERC20 | ETH | `0x` + 40 hex символів |
| BTC | BTC | Legacy (`1...`), P2SH (`3...`), Bech32 (`bc1...`) |
| SOL | SOL | 32–44 символи (base58) |

Курси: CoinGecko API (кешується `CRYPTO_RATE_CACHE_TTL` секунд).

---

## On-chain верифікація

Автоматична верифікація депозитів через blockchain RPC:

```bash
# Запуск cron (кожні 3 хвилини):
*/3 * * * * curl -s -H "X-Admin-Secret: YOUR_SECRET" https://domain/api/cron-verify.php
```

**Що робить `cron-verify.php`:**
1. Знаходить pending депозити з tx_hash
2. Перевіряє кожен через RPC ноди (TronGrid, BSC, Ethereum, Blockstream, Solana)
3. Якщо підтверджено on-chain → автоматично кредитує монети
4. Автоматично завершує expired депозити

**RPC ноди:**
- TRC20: `api.trongrid.io`
- BEP20: `bsc-dataseed1.binance.org`
- ERC20: `eth.llamarpc.com`
- BTC: `blockstream.info/api`
- SOL: `api.mainnet-beta.solana.com`

---

## Кешування (Redis)

Redis використовується опціонально для:
- **Leaderboard** — кеш 60 сек
- **Крипто курси** — кеш `CRYPTO_RATE_CACHE_TTL` сек (default 300)
- **Загальний кеш** — через `cache_get()` / `cache_set()` в bootstrap.php

Якщо Redis недоступний, автоматично використовується file-based cache (`/tmp/`).

```php
// Використання в коді:
$rates = cache_get('crypto_rates');       // Redis → file fallback
cache_set('crypto_rates', $rates, 300);   // TTL 300 сек
```

---

## API Versioning

`.htaccess` підтримує версійний routing:

```
/api/v1/tasks     →  /api/tasks.php
/api/v1/feed      →  /api/feed.php
/api/v1/wallet    →  /api/wallet.php
```

Стара адресація `/api/tasks.php` продовжує працювати (backward-compatible).

---

## Тестування

### Unit тести

```bash
# PHP (PHPUnit) — 34 тести:
composer test

# JavaScript (Vitest) — 51 тест:
npm test
```

### E2E тести (Playwright)

```bash
# Встановити браузери:
npx playwright install chromium

# Запустити (22 тести):
npm run test:e2e
```

### Lint

```bash
# PHP:
composer lint

# JavaScript:
npm run lint
```

---

## CI/CD

GitHub Actions pipeline (`.github/workflows/ci.yml`) — 4 jobs:

| Job | Що перевіряє |
|-----|-------------|
| **PHP Tests** | PHPUnit + PHP lint (8.2) |
| **JS Tests** | Vitest + JS syntax check (Node 20) |
| **Security Scan** | Hardcoded creds, SQL injection patterns, .env check |
| **E2E Tests** | Playwright + Chromium |

Запускається на кожен push/PR в `main`.

---

## Безпека

### Реалізовано

| Захист | Деталі |
|--------|--------|
| **CSRF** | Token на всіх POST/PUT/DELETE, `X-CSRF-Token` header |
| **SQL Injection** | PDO prepared statements скрізь |
| **XSS** | `htmlspecialchars()` на виводі, CSP headers |
| **Rate Limiting** | Конфігуровані ліміти через `.env` (`RATE_LIMITS` в config.php) |
| **Session** | `HttpOnly`, `SameSite=Strict`, `Secure` cookies |
| **HTTPS** | HSTS 1 рік, auto-redirect HTTP→HTTPS |
| **Headers** | CSP, X-Frame-Options, X-Content-Type-Options, Permissions-Policy |
| **Admin** | `X-Admin-Secret` header, rate-limited (5/15 хв) |
| **Crypto** | Валідація адрес per-network, RPC верифікація |
| **Race Conditions** | `SELECT...FOR UPDATE` в take-task.php, deposit confirm, withdrawals |

### Конфігуровані rate limits

Всі ліміти тепер задаються через `.env`:

| Дія | Ліміт | .env ключ |
|-----|-------|-----------|
| Депозити | 5/15 хв | `RATE_LIMIT_DEPOSIT_*` |
| Виводи | 3/60 хв | `RATE_LIMIT_WITHDRAW_*` |
| Tips | 20/60 хв | `RATE_LIMIT_TIP_*` |
| Чат | 60/5 хв | `RATE_LIMIT_CHAT_*` |
| Задачі | 10/60 хв | `RATE_LIMIT_TASK_*` |
| Повідомлення | 30/5 хв | `RATE_LIMIT_MSG_*` |
| Підтримка | 10/60 хв | `RATE_LIMIT_SUPPORT_*` |
| Реєстрація | 5/15 хв (per IP) | `RATE_LIMIT_REGISTER_*` |

---

## Функціонал

### Маркетплейс задач
- ✅ CRUD задач (10 категорій, 3 рівні складності)
- ✅ Слоти, дедлайни, рівневі привілеї
- ✅ Захист від race conditions (FOR UPDATE)
- ✅ Автоматичне нарахування винагороди

### Гейміфікація
- ✅ 12 рівнів XP (1000 XP/рівень)
- ✅ Щоденний check-in + стріки
- ✅ Бейджі та досягнення
- ✅ Рівневий доступ до фічей

### Крипто-гаманець
- ✅ 5 мереж: TRC20, BEP20, ERC20, BTC, SOL
- ✅ Live курси (CoinGecko, cached)
- ✅ On-chain auto-верифікація (cron)
- ✅ Ручна адмін-верифікація (fallback)
- ✅ 5% комісія на вивід

### Спільнота
- ✅ Feed (cursor-based pagination, без дублікатів)
- ✅ Чат-кімнати (Bronze/Silver/Gold/Diamond)
- ✅ Direct messages
- ✅ Leaderboard (cached)
- ✅ Підтримка / тікети

### PWA
- ✅ Service Worker (offline support)
- ✅ Installable (manifest.json)
- ✅ Responsive (mobile-first)
- ✅ Accessibility (ARIA, skip-link, focus trap)

### i18n
- ✅ 6 мов: EN, UA, DE, FR, ES, PL
- ✅ 190+ ключів перекладу
- ✅ Dynamic language switch

---

## Ліцензія

Proprietary — Lolanceizi © 2026
