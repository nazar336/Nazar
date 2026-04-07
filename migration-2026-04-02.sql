-- Lolanceizi migration 2026-04-02
-- Run this on your existing DB (safe to run multiple times)

USE lolanceizi;

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

-- ── Feed posts (content with XP rewards) ──────────────────────────
CREATE TABLE IF NOT EXISTS feed_posts (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    text          TEXT         NOT NULL,
    media_url     VARCHAR(500),
    media_type    ENUM('image','video') DEFAULT NULL,
    post_type     ENUM('text','task','achievement','wallet') DEFAULT 'text',
    likes_count   INT UNSIGNED DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_created_at (created_at),
    KEY idx_user_date (user_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Feed likes (unique per user+post) ─────────────────────────────
CREATE TABLE IF NOT EXISTS feed_likes (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_id       INT UNSIGNED NOT NULL,
    user_id       INT UNSIGNED NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES feed_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uniq_post_user (post_id, user_id),
    KEY idx_post_id (post_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
