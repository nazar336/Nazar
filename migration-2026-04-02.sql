-- LOLance migration 2026-04-02
-- Run this on your existing DB (safe to run multiple times)

USE lolance;

-- ── Rate limiting for login ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL COMMENT 'email or IP',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_identifier_time (identifier, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Multi-currency crypto deposits ────────────────────────────────
ALTER TABLE crypto_deposits
    ADD COLUMN IF NOT EXISTS currency     VARCHAR(10)    NOT NULL DEFAULT 'USDT' AFTER user_id,
    ADD COLUMN IF NOT EXISTS amount_native DECIMAL(20,8) NOT NULL DEFAULT 0      AFTER currency,
    ADD COLUMN IF NOT EXISTS usd_rate     DECIMAL(16,4)  NOT NULL DEFAULT 1.0000 AFTER amount_native,
    ADD COLUMN IF NOT EXISTS admin_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS admin_note   VARCHAR(255)   NULL;

-- ── Legal acceptances (idempotent) ───────────────────────────────
CREATE TABLE IF NOT EXISTS legal_acceptances (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    doc_type      ENUM('terms','privacy') NOT NULL,
    doc_version   VARCHAR(30) NOT NULL,
    accepted_ip   VARCHAR(45),
    user_agent    VARCHAR(255),
    accepted_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_user_doc_version (user_id, doc_type, doc_version),
    KEY idx_user_doc (user_id, doc_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Crypto withdrawals table ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS crypto_withdrawals (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNSIGNED NOT NULL,
    currency         VARCHAR(10)    NOT NULL DEFAULT 'USDT',
    network          VARCHAR(20)    NOT NULL DEFAULT 'TRC20',
    amount_coins     DECIMAL(16,2)  NOT NULL,
    fee_coins        DECIMAL(16,2)  NOT NULL DEFAULT 0.00,
    net_coins        DECIMAL(16,2)  NOT NULL,
    amount_usd       DECIMAL(12,2)  NOT NULL,
    usd_rate         DECIMAL(16,4)  NOT NULL DEFAULT 1.0000,
    amount_native    DECIMAL(20,8)  NOT NULL DEFAULT 0,
    wallet_address   VARCHAR(128)   NOT NULL,
    transaction_hash VARCHAR(100),
    status           ENUM('pending','completed','rejected','cancelled') DEFAULT 'pending',
    admin_note       VARCHAR(255),
    processed_at     DATETIME,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Drop cached balance from users (single source of truth = transactions) ──
-- ALTER TABLE users DROP COLUMN IF EXISTS balance; -- optional, keep for now

-- ── Make transaction_hash unique to prevent double-spend ──
-- Safe: DROP existing non-unique key first, then add UNIQUE
-- ALTER TABLE crypto_deposits DROP KEY IF EXISTS idx_tx_hash;
-- ALTER TABLE crypto_deposits ADD UNIQUE KEY idx_tx_hash (transaction_hash);

-- ── Cleanup old rate-limiting records (run periodically or via cron) ──
-- DELETE FROM login_attempts WHERE attempted_at < DATE_SUB(NOW(), INTERVAL 1 DAY);

-- ── Add missing indexes for performance ──
-- ALTER TABLE transactions ADD KEY IF NOT EXISTS idx_user_status (user_id, status);
-- ALTER TABLE task_assignments ADD KEY IF NOT EXISTS idx_status (status);
