-- Lolanceizi migration — Platform commission fees
-- Run this on your existing DB (safe to run multiple times)

USE lolanceizi;

-- ── Add 'platform_fee' to coin_spending type enum ─────────────────
ALTER TABLE coin_spending
    MODIFY COLUMN type ENUM('task_payment','tip','premium','withdraw','platform_fee') DEFAULT 'task_payment';
