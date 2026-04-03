# LOLance — Інструкція розгортання

## 1. Структура файлів на сервері

```
/public_html/               ← або твій веб-корінь
├── index.html
├── styles.css
├── app.js
├── terms.html
├── privacy.html            ← НОВИЙ
└── api/
    ├── config.php          ← ГОЛОВНИЙ КОНФІГ
    ├── bootstrap.php
    ├── register.php
    ├── login.php
    ├── logout.php
    ├── session.php
    ├── verify.php
    ├── profile.php
    ├── tasks.php
    ├── take-task.php
    ├── complete-task.php
    ├── wallet.php
    ├── messages.php
    ├── leaderboard.php
    ├── support.php
    ├── xp.php
    ├── points.php
    ├── coins.php
    ├── chat-rooms.php
    ├── crypto-deposit.php
    ├── crypto-rates.php
    └── admin-verify-deposit.php
```

---

## 2. База даних

```bash
# Запусти основну схему:
mysql -u root -p lolance < schema.sql

# Потім міграцію (додає нові колонки):
mysql -u root -p lolance < migration-2026-04-02.sql
```

---

## 3. Налаштування config.php

Відкрий `api/config.php` і заміни:

| Константа | Що змінити |
|-----------|-----------|
| `APP_DOMAIN` | Твій домен: `'lolance.com'` |
| `DB_USER` | Юзер БД |
| `DB_PASS` | Пароль БД |
| `SMTP_PASS` | **App Password** (дивись нижче!) |
| `ADMIN_SECRET` | Випадковий секрет (мін. 32 символи) |

---

## 4. Gmail App Password — як отримати

Твій звичайний пароль **НЕ ПРАЦЮЄ** для SMTP. Потрібно:

1. Відкрий https://myaccount.google.com
2. Security → 2-Step Verification → **увімкни** (якщо не увімкнено)
3. Знову Security → scroll вниз → **App passwords**
4. Select app: **Mail** | Select device: **Other** → напиши "LOLance"
5. Натисни **Generate** → скопіюй 16-значний код
6. Встав цей код у `config.php` замість `YOUR_GMAIL_APP_PASSWORD`

---

## 5. Адмін-панель верифікації депозитів

Щоб підтвердити депозит користувача:

```bash
# Переглянути всі pending депозити:
GET https://твій-домен/api/admin-verify-deposit.php?secret=ТВІЙadmin_secret

# Підтвердити депозит:
POST https://твій-домен/api/admin-verify-deposit.php
Headers: X-Admin-Secret: ТВІЙadmin_secret
Body: {"deposit_id": 123, "action": "approve"}

# Відхилити:
Body: {"deposit_id": 123, "action": "reject", "note": "Транзакція не знайдена"}
```

---

## 6. Підтримувані крипто-мережі

| Мережа | Валюта | Адреса |
|--------|--------|--------|
| TRC20  | USDT   | TLyCRCFjGAaCagESyZNJTWh1u8Yxz38HdU |
| BEP20  | USDT   | 0x8c275f4fc4dc2121e5322111448921eca6a42dc9 |
| ERC20  | USDT   | 0x8c275f4fc4dc2121e5322111448921eca6a42dc9 |
| BTC    | BTC    | 14N6uCEx64Lv353znfaJ3V996asMgUPSWP |
| SOL    | SOL    | GU2xLFTiau6hhLuTdhrCskTHYsu6SrSUuUw1cbgAWvrN |

Курси автоматично завантажуються з CoinGecko (кеш 1 хв).

---

## 7. Файли, що НЕ змінювались (залиш як є)

- `support.php`
- `take-task.php`
- `wallet.php`
- `profile.php`
- `coins.php`
- `xp.php`
- `points.php`
- `chat-rooms.php`
- `schema.sql` (оновлення через migration-2026-04-02.sql)
- `terms.html`
- `index.html`
- `styles.css`

---

## 8. Що виправлено

| # | Проблема | Статус |
|---|----------|--------|
| 1 | Фальшиві крипто-адреси | ✅ Реальні адреси |
| 2 | Верифікація без перевірки | ✅ Admin approval flow |
| 3 | Відсутній CORS на auth ендпоінтах | ✅ Додано cors_headers() |
| 4 | Відсутня Privacy Policy | ✅ Створено privacy.html |
| 5 | Немає rate limiting | ✅ login_attempts таблиця |
| 6 | php mail() не доставляє | ✅ Власний SMTP клієнт |
| 7 | Подвійне нарахування XP | ✅ Один UPDATE запит |
| 8 | Два джерела балансу | ✅ Видалено balance= з complete-task |
| 9 | slotsLeft завжди = slots | ✅ slots - taken_slots |
| 10 | Небезпечні DB дефолти | ✅ Помилка якщо не задані |
| 11 | Дублікат if в login.php | ✅ Виправлено |
| 12 | read_at ніколи не ставився | ✅ Авто-маркування |
| 13 | Немає валідації довжин у tasks | ✅ Додано всі перевірки |
| 14 | Багатовалютний обмін | ✅ BTC/ETH/SOL/USDT |
| 15 | Вивід крипто (виводи монет) | ✅ crypto-withdraw.php + admin-verify-withdraw.php |
| 16 | TikTok-like Feed | ✅ api/feed.php + feed_posts/feed_likes таблиці |
| 17 | Кеш курсів 5 хв → спекуляції | ✅ Кеш 60с в crypto-lib.php |
| 18 | Захист адмін ендпоінтів | ✅ X-Admin-Secret header + rate limiting |
| 19 | Захардкоджені рядки у UI | ✅ Усі рядки через i18n t() |
| 20 | Міні-рейтинг завжди порожній | ✅ Бере дані з S.leaderboard |
| 21 | Кнопка check-in без i18n | ✅ Використовує t('checkinBtn') |
| 22 | doLogout не очищав сповіщення | ✅ S.notifications=[] при виході |

---

## 9. Поточний етап розробки

**Проект на стадії: Beta / Production-Ready**

### Реалізовано (готово до деплою)

- ✅ Реєстрація / вхід / email-верифікація (капча + код)
- ✅ Система задач: створення, взяття, завершення, слоти, дедлайни
- ✅ Гаманець: баланс, транзакції, крипто-депозит (USDT/BTC/ETH/SOL), вивід
- ✅ Система XP / рівнів (1–12), щоденний check-in, стріки
- ✅ Рейтинг / Leaderboard
- ✅ Повідомлення (direct messages)
- ✅ Чат-кімнати (Bronze/Silver/Gold/Diamond з рівневим доступом)
- ✅ Підтримка / тікети
- ✅ Feed (TikTok-like): публікації, лайки, медіа, XP-нагороди
- ✅ Профіль: аватар, роль, навички, bio
- ✅ Адмін-панель: верифікація депозитів і виводів
- ✅ Rate limiting, input validation, CORS, CSP
- ✅ Мультимовність: EN / UA / DE / FR / ES / PL

### Що можна додати далі (backlog)

- [ ] Push-сповіщення (Web Push API)
- [ ] Пошук користувачів та їхніх профілів
- [ ] Система відгуків та рейтингів виконавців
- [ ] Розширена фільтрація задач (по навичкам, ціні, терміну)
- [ ] Дашборд для замовників (статистика задач)
- [ ] Автоматичне підтвердження виводу через on-chain моніторинг
- [ ] Мобільний PWA (Service Worker + manifest.json)
