# 🚀 Lolanceizi — Деплой на Hostinger (Business план)

> Покрокова інструкція для розгортання Lolanceizi на Hostinger shared hosting через hPanel.

---

## 📋 Зміст

1. [Підготовка домену](#1-підготовка-домену)
2. [Налаштування PHP](#2-налаштування-php)
3. [Створення бази даних MySQL](#3-створення-бази-даних-mysql)
4. [Завантаження файлів](#4-завантаження-файлів)
5. [Створення .env файлу](#5-створення-env-файлу)
6. [SSL сертифікат](#6-ssl-сертифікат)
7. [Налаштування SMTP (email)](#7-налаштування-smtp-email)
8. [Cron Jobs](#8-cron-jobs)
9. [Фінальна перевірка](#9-фінальна-перевірка)
10. [Усунення проблем](#10-усунення-проблем)

---

## 1. Підготовка домену

### 1.1 Увійти в hPanel
1. Відкрий https://hpanel.hostinger.com/
2. Залогінься в свій акаунт
3. На головній сторінці побачиш свій хостинг-план **Business**

### 1.2 Підключити домен
1. Ліва панель → **Домени** (Domains)
2. Якщо домен куплений на Hostinger — він вже підключений
3. Якщо домен з іншого реєстратора → **Додати домен** → вкажи NS сервери Hostinger:
   ```
   ns1.dns-parking.com
   ns2.dns-parking.com
   ```
4. Зачекай до 24 годин на пропагацію DNS

### 1.3 Framework Preset
> ⚠️ Коли Hostinger питає "Framework preset" — обирай **"PHP"** або **"None / Other"**.
> Lolanceizi НЕ використовує Laravel, WordPress, React чи будь-який інший фреймворк.

---

## 2. Налаштування PHP

### 2.1 Версія PHP
1. hPanel → ліва панель → **Розширені** (Advanced) → **PHP конфігурація** (PHP Configuration)
2. Вкладка **PHP Version** → обери **PHP 8.2** (або новішу)
3. Натисни **Оновити** (Update)

### 2.2 Розширення PHP
1. Вкладка **Extensions** → переконайся що увімкнені:
   - ✅ `pdo_mysql` — для роботи з БД
   - ✅ `mbstring` — для UTF-8
   - ✅ `json` — для API
   - ✅ `curl` — для крипто-курсів і RPC
   - ✅ `openssl` — для SMTP/TLS
   - ✅ `session` — для авторизації
   - ✅ `fileinfo` — для MIME detection
2. Натисни **Зберегти** (Save)

### 2.3 PHP Options (php.ini)
1. Вкладка **PHP Options** → встанови:
   ```
   display_errors = Off
   error_reporting = E_ALL
   log_errors = On
   max_execution_time = 60
   max_input_time = 60
   memory_limit = 256M
   post_max_size = 32M
   upload_max_filesize = 16M
   session.cookie_secure = On
   session.cookie_httponly = On
   session.cookie_samesite = Strict
   session.use_strict_mode = On
   ```
2. Натисни **Зберегти** (Save)

---

## 3. Створення бази даних MySQL

### 3.1 Створити базу даних
1. hPanel → ліва панель → **Бази даних** (Databases) → **MySQL Databases**
2. Заповни форму:
   - **Назва бази**: `lolanceizi` → стане `u310037570_lolanceizi`
   - **Ім'я користувача**: `lolanceizi_user` → стане `u310037570_lolanceizi_user`
   - **Пароль**: придумай **сильний** пароль (збережи його!)
3. Натисни **Створити** (Create)

> ⚠️ **ВАЖЛИВО**: Запиши точні назви з префіксом `u310037570_`!

### 3.2 Імпортувати схему через phpMyAdmin
1. hPanel → **Бази даних** → натисни **phpMyAdmin** поруч з твоєю базою
2. phpMyAdmin відкриється → обери свою базу в лівій панелі

#### Крок A: Основна схема
1. Вкладка **SQL** (зверху)
2. Скопіюй вміст `schema.sql` — **АЛЕ ВИДАЛИ** перші 2 рядки:
   ```sql
   -- ВИДАЛИ ЦІ ДВА РЯДКИ:
   -- CREATE DATABASE IF NOT EXISTS lolanceizi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   -- USE lolanceizi;
   ```
3. Вставити решту SQL → натисни **Виконати** (Execute/Go)

#### Крок B: Міграція
1. Знову вкладка **SQL**
2. Скопіюй вміст `migration-2026-04-02.sql` — **ВИДАЛИ** рядок `USE lolanceizi;`
3. Натисни **Виконати** (Execute/Go)

#### Крок C: Індекси
1. Знову вкладка **SQL**
2. Скопіюй вміст `migration-indexes.sql` — **ВИДАЛИ** рядок `USE lolanceizi;`
3. Натисни **Виконати** (Execute/Go)

### 3.3 Перевірка
В лівій панелі phpMyAdmin побачиш **22+ таблиць**:
```
achievements, chat_room_messages, chat_room_passes, coin_spending,
crypto_deposits, crypto_withdrawals, daily_checkins, daily_visits,
email_verifications, feed_likes, feed_posts, legal_acceptances,
login_attempts, message_threads, messages, notifications,
support_tickets, task_assignments, task_reviews, tasks,
ticket_responses, transactions, user_coins, users
```

---

## 4. Завантаження файлів

### Варіант A: Git (рекомендовано)

1. hPanel → ліва панель → **Розширені** (Advanced) → **Git**
2. **Repository URL**: `https://github.com/nazar336/Nazar.git`
3. **Branch**: `main`
4. **Directory**: `public_html` (або `/`)
5. Натисни **Create** → файли будуть завантажені

> Якщо Git недоступний — використай Варіант B.

### Варіант B: File Manager

1. hPanel → ліва панель → **Файли** (Files) → **File Manager**
2. Відкрий папку `public_html/`
3. **ВИДАЛИ** все що там є за замовчуванням (default.html тощо)
4. Натисни **Завантажити** (Upload) → завантаж ZIP архів проєкту
5. Розпакуй його — всі файли мають бути прямо в `public_html/`:

```
public_html/
├── index.html          ← ЦЕ ПОВИННО БУТИ ТУТ (не в підпапці!)
├── styles.css
├── .htaccess
├── sw.js
├── manifest.json
├── robots.txt
├── sitemap.xml
├── terms.html
├── privacy.html
├── 404.html
├── .env                ← СТВОРИШ ОКРЕМО (крок 5)
├── js/                 ← папка з JS модулями
│   ├── main.js
│   └── pages/
├── api/                ← папка з PHP API
│   ├── config.php
│   ├── bootstrap.php
│   └── ...
├── assets/             ← іконки/логотип
└── schema.sql          ← можна видалити після імпорту БД
```

### Варіант C: FTP/SFTP

1. hPanel → ліва панель → **Файли** → **FTP Акаунти**
2. Створи FTP акаунт або використай головний
3. Використай FileZilla/WinSCP:
   - **Host**: ftp.lolanceizi.online або IP з hPanel
   - **Port**: 21 (FTP) або 22 (SFTP)
   - **Username/Password**: з hPanel
4. Завантаж всі файли в `public_html/`

> ⚠️ **СТРУКТУРА**: `index.html` ПОВИНЕН бути прямо в `public_html/`, НЕ в підпапці!

---

## 5. Створення .env файлу

### 5.1 Створити .env
1. hPanel → **File Manager** → відкрий `public_html/`
2. Натисни **Новий файл** (New File) → назви `.env`
3. Вставити наступний вміст (заміни значення):

```env
# ── Lolanceizi Production Configuration ──

# Environment
APP_ENV=production
APP_DOMAIN=lolanceizi.online

# Database
DB_HOST=localhost
DB_NAME=u310037570_lolanceizi
DB_USER=u310037570_lolanceizi_user
DB_PASS=ТВІЙ_ПАРОЛЬ_БАЗИ_ДАНИХ

# Session
SESSION_NAME=lolanceizi_session

# Email / SMTP (Hostinger Email)
MAIL_FROM=Verefi@lolanceizi.online
MAIL_FROM_NAME=Lolanceizi
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=Verefi@lolanceizi.online
SMTP_PASS=ТВІЙ_ПАРОЛЬ_EMAIL

# Legal
TERMS_VERSION=2026-04-01
PRIVACY_VERSION=2026-04-01

# Admin secret (ГЕНЕРУЙ НОВИЙ!)
# Згенеруй: https://www.browserling.com/tools/random-hex → 64 символи
ADMIN_SECRET=ВСТАВЬ_ЗГЕНЕРОВАНИЙ_СЕКРЕТ_ТУТ

# Rate limiting
LOGIN_MAX_ATTEMPTS=5
LOGIN_LOCKOUT_MINUTES=15

# Crypto wallets (ТВОЇ адреси)
CRYPTO_WALLET_TRC20=TLyCRCFjGAaCagESyZNJTWh1u8Yxz38HdU
CRYPTO_WALLET_BEP20=0x8c275f4fc4dc2121e5322111448921eca6a42dc9
CRYPTO_WALLET_ERC20=0x8c275f4fc4dc2121e5322111448921eca6a42dc9
CRYPTO_WALLET_BTC=14N6uCEx64Lv353znfaJ3V996asMgUPSWP

# Economy
COINS_PER_USD=100.0
MIN_DEPOSIT_USD=1.0
MAX_DEPOSIT_USD=10000.0
DEPOSIT_EXPIRE_MINUTES=60

# Cache TTL
CRYPTO_RATE_CACHE_TTL=300

# Rate limits (defaults OK для початку)
RATE_LIMIT_DEPOSIT_MAX=5
RATE_LIMIT_DEPOSIT_WINDOW=15
RATE_LIMIT_WITHDRAW_MAX=3
RATE_LIMIT_WITHDRAW_WINDOW=60
RATE_LIMIT_TIP_MAX=20
RATE_LIMIT_TIP_WINDOW=60
RATE_LIMIT_XP_MAX=10
RATE_LIMIT_XP_WINDOW=60
RATE_LIMIT_CHAT_MAX=60
RATE_LIMIT_CHAT_WINDOW=5
RATE_LIMIT_TASK_MAX=10
RATE_LIMIT_TASK_WINDOW=60
RATE_LIMIT_MSG_MAX=30
RATE_LIMIT_MSG_WINDOW=5
RATE_LIMIT_SUPPORT_MAX=10
RATE_LIMIT_SUPPORT_WINDOW=60
RATE_LIMIT_REGISTER_MAX=5
RATE_LIMIT_REGISTER_WINDOW=15

# Redis (залиш пустим — на shared hosting нема Redis)
REDIS_HOST=
REDIS_PORT=6379
REDIS_PREFIX=lolanceizi:
```

### 5.2 Перевірка безпеки .env
`.htaccess` вже блокує доступ до `.env` через браузер. Перевір: відкрий `https://lolanceizi.online/.env` — має бути 403 Forbidden.

---

## 6. SSL сертифікат

### 6.1 Увімкнути SSL
1. hPanel → ліва панель → **Безпека** (Security) → **SSL**
2. Якщо SSL ще не встановлений → натисни **Встановити** (Install)
3. Hostinger Business має безкоштовний **Let's Encrypt** SSL
4. Зачекай 5–10 хвилин на активацію

### 6.2 Примусовий HTTPS
1. hPanel → **Безпека** → **SSL** → увімкни **Force HTTPS** (якщо є)
2. `.htaccess` вже має HTTPS redirect — це працюватиме навіть без галочки

### 6.3 Перевірка
1. Відкрий `http://lolanceizi.online` — повинно перенаправити на `https://`
2. Значок замка в браузері повинен бути зеленим

---

## 7. Налаштування SMTP (email)

Lolanceizi використовує SMTP для верифікації email при реєстрації.

### Варіант A: Hostinger Email (вже налаштовано)

Email `Verefi@lolanceizi.online` вже створений на Hostinger. В `.env` вже є правильні налаштування:

```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=Verefi@lolanceizi.online
SMTP_PASS=ТВІЙ_ПАРОЛЬ_EMAIL
MAIL_FROM=Verefi@lolanceizi.online
```

> ⚠️ Тільки підстав реальний пароль від email в `SMTP_PASS`!

### Варіант B: Gmail App Password (альтернатива)

1. Відкрий https://myaccount.google.com/
2. **Security** → **2-Step Verification** → увімкни (якщо ще не)
3. **Security** → **App passwords** (внизу сторінки 2-Step Verification)
4. **Select app**: Mail → **Select device**: Other → введи "Lolanceizi"
5. Натисни **Generate** → скопіюй 16-значний код
6. Встав цей код в `.env` як `SMTP_PASS`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=твій-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
```

### Варіант C: Інший Hostinger Email (створити новий)
1. hPanel → **Emails** → створи email (наприклад `noreply@lolanceizi.online`)
2. Використай налаштування:
```env
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=noreply@lolanceizi.online
SMTP_PASS=ПАРОЛЬ_ВІД_EMAIL
MAIL_FROM=noreply@lolanceizi.online
```

---

## 8. Cron Jobs

Lolanceizi потребує cron job для автоматичної верифікації крипто-депозитів.

### 8.1 Налаштування cron
1. hPanel → ліва панель → **Розширені** (Advanced) → **Cron Jobs**
2. Додай новий cron:
   - **Interval**: Every 5 minutes (`*/5 * * * *`)
   - **Command**:
     ```
     /usr/bin/curl -s -H "X-Admin-Secret: ТВІЙ_ADMIN_SECRET" https://lolanceizi.online/api/cron-verify.php > /dev/null 2>&1
     ```
3. Натисни **Створити** (Create)

> Заміни `ТВІЙ_ADMIN_SECRET` на значення `ADMIN_SECRET` з `.env`
> Заміни `lolanceizi.online` на свій реальний домен

### 8.2 Альтернативний формат cron (PHP CLI)
Якщо curl не працює на shared hosting:
```
*/5 * * * * /usr/bin/php /home/u310037570/public_html/api/cron-verify.php --admin-secret=ТВІЙ_SECRET > /dev/null 2>&1
```

---

## 9. Фінальна перевірка

### 9.1 Чеклист
Перевір кожен пункт, відкривши URL в браузері:

| # | Перевірка | URL | Очікуваний результат |
|---|-----------|-----|---------------------|
| 1 | Головна сторінка | `https://lolanceizi.online/` | Показує landing page Lolanceizi |
| 2 | HTTPS redirect | `http://lolanceizi.online/` | Переправляє на https |
| 3 | API session | `https://lolanceizi.online/api/session.php` | JSON: `{"success":true/false,...}` |
| 4 | .env захищений | `https://lolanceizi.online/.env` | 403 Forbidden |
| 5 | config.php захищений | `https://lolanceizi.online/api/config.php` | 403 Forbidden або пустий |
| 6 | SQL файли захищені | `https://lolanceizi.online/schema.sql` | 403 Forbidden |
| 7 | 404 сторінка | `https://lolanceizi.online/неіснуючий` | Кастомна 404 сторінка |
| 8 | PWA manifest | `https://lolanceizi.online/manifest.json` | JSON manifest |
| 9 | Service Worker | `https://lolanceizi.online/sw.js` | JavaScript файл |
| 10 | Реєстрація | Зареєструйся на сайті | Отримай email з кодом |

### 9.2 Тест API
Відкрий DevTools (F12) → Console → спробуй:
```javascript
fetch('/api/session.php').then(r=>r.json()).then(console.log)
```
Повинен повернути JSON з `success` полем.

### 9.3 Тест бази даних
Спробуй зареєструватися на сайті. Якщо реєстрація проходить — БД працює ✅

---

## 10. Усунення проблем

### ❌ Білий екран / 500 Internal Server Error
1. hPanel → **File Manager** → перевір що `.htaccess` завантажений
2. Перевір PHP версію (потрібна 8.1+)
3. Подивись логи: hPanel → **Розширені** → **Error logs**

### ❌ "Database unavailable"
1. **Автодіагностика**: відкрий `https://yourdomain.com/api/db-check.php?secret=YOUR_ADMIN_SECRET`
   - Покаже стан .env, підключення до БД, які таблиці є/відсутні
2. **Автостворення таблиць**: 
   ```bash
   curl -X POST "https://yourdomain.com/api/db-check.php?secret=YOUR_ADMIN_SECRET&action=setup"
   ```
3. Перевір `.env` — правильні `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`
4. `DB_HOST` на Hostinger = `localhost` (НЕ `127.0.0.1`)
5. Перевір що назва БД має префікс Hostinger (наприклад `u310037570_lolanceizi`)

### ❌ API повертає 404
1. Перевір що `api/` папка є в `public_html/`
2. Перевір що mod_rewrite увімкнений (зазвичай увімкнений за замовчуванням)

### ❌ Email не приходить
1. Перевір `SMTP_PASS` — це App Password, НЕ звичайний пароль
2. Перевір що 2-Step Verification увімкнено в Google
3. Спробуй Hostinger Email як альтернативу

### ❌ CORS помилки
1. Переконайся що домен в `.env` (`APP_DOMAIN`) відповідає реальному домену
2. Перевір що `credentials: 'same-origin'` працює (API і frontend на одному домені)

### ❌ .htaccess не працює
1. hPanel → **Розширені** → **PHP Configuration** → перевір Apache modules
2. Переконайся що `mod_rewrite` увімкнений

### ❌ "Invalid CSRF token"
1. Очисти кеш браузера (Ctrl+Shift+Delete)
2. Перевір що cookies увімкнені
3. Перевір що `session.cookie_secure = On` тільки з HTTPS

### ❌ Крипто курси не завантажуються
1. Без Redis — файловий кеш працює автоматично (`/tmp/`)
2. Перевір що `curl` PHP extension увімкнений
3. CoinGecko може блокувати занадто часті запити — збільш `CRYPTO_RATE_CACHE_TTL`

---

## 📌 Важливі нотатки

### Оновлення домену в файлах
Якщо твій домен НЕ `lolanceizi.online`, оновлюй URL в:
- `index.html` — рядки 10, 15, 16, 23 (canonical, og:url, og:image)
- `robots.txt` — рядок 7 (Sitemap URL)
- `sitemap.xml` — рядки 4, 9, 14 (всі `<loc>` URL)
- `.env` — `APP_DOMAIN`

### Файли які можна видалити з production
Після деплою можна видалити з `public_html/`:
- `tests/` — тести не потрібні на production
- `phpunit.xml`, `vitest.config.js`, `playwright.config.js` — конфіги тестів
- `composer.json`, `composer.lock` — не потрібні (немає PHP залежностей на runtime)
- `package.json`, `package-lock.json` — не потрібні (Node.js тільки для тестів)
- `schema.sql`, `migration-*.sql` — після імпорту БД
- `.github/` — CI/CD конфіги

### Безпека на production
- ✅ `.env` захищений `.htaccess` (403 Forbidden)
- ✅ `.sql` файли захищені `.htaccess` (403 Forbidden)
- ✅ `config.php` захищений `.htaccess` (403 Forbidden)
- ✅ HTTPS примусовий через `.htaccess`
- ✅ Security headers встановлені (CSP, HSTS, X-Frame-Options)
- ✅ Sessions: HttpOnly, Secure, SameSite=Strict
- ❌ Redis недоступний на shared hosting → автоматичний file-cache fallback

---

## 🔄 Оновлення сайту

### Через Git (якщо налаштований)
1. hPanel → **Розширені** → **Git** → **Pull**

### Через File Manager
1. Завантаж нові файли → перезапиш старі
2. НЕ ПЕРЕЗАПИСУЙ `.env` файл!

### Після оновлення
1. Якщо є нові SQL міграції → виконай через phpMyAdmin
2. Очисти кеш браузера (Ctrl+Shift+F5)
