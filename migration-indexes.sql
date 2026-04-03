-- LOLance migration — Performance indexes
-- Run this on your existing DB (safe to run multiple times — uses IF NOT EXISTS)

USE lolance;

-- ── tasks: composite indexes for filtered listings ────────────────
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_status_created (status, created_at DESC);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_category (category);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_difficulty (difficulty);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_deadline (deadline);
ALTER TABLE tasks ADD INDEX IF NOT EXISTS idx_creator_status (creator_id, status);

-- ── task_assignments: composite for per-task status lookups ───────
ALTER TABLE task_assignments ADD INDEX IF NOT EXISTS idx_task_status (task_id, status);
ALTER TABLE task_assignments ADD INDEX IF NOT EXISTS idx_user_status (user_id, status);

-- ── transactions: type filter & user+type combo ──────────────────
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_type (type);
ALTER TABLE transactions ADD INDEX IF NOT EXISTS idx_user_type (user_id, type, created_at DESC);

-- ── notifications: unread per user lookup ─────────────────────────
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_user_read (user_id, read_at);
ALTER TABLE notifications ADD INDEX IF NOT EXISTS idx_user_created (user_id, created_at DESC);

-- ── messages: ordered by time within thread ──────────────────────
ALTER TABLE messages ADD INDEX IF NOT EXISTS idx_thread_created (thread_id, created_at DESC);

-- ── support_tickets: user's tickets by status ─────────────────────
ALTER TABLE support_tickets ADD INDEX IF NOT EXISTS idx_user_status (user_id, status);

-- ── coin_spending: user history ordered ───────────────────────────
ALTER TABLE coin_spending ADD INDEX IF NOT EXISTS idx_user_created (user_id, created_at DESC);
ALTER TABLE coin_spending ADD INDEX IF NOT EXISTS idx_type (type);

-- ── crypto_deposits: user+status combo for pending check ─────────
ALTER TABLE crypto_deposits ADD INDEX IF NOT EXISTS idx_user_network_status (user_id, network, status);
ALTER TABLE crypto_deposits ADD INDEX IF NOT EXISTS idx_expires (expires_at);

-- ── crypto_withdrawals: user+status combo ─────────────────────────
ALTER TABLE crypto_withdrawals ADD INDEX IF NOT EXISTS idx_user_status_combo (user_id, status);
ALTER TABLE crypto_withdrawals ADD INDEX IF NOT EXISTS idx_created (created_at DESC);

-- ── chat_room_passes: expiry check for valid passes ──────────────
ALTER TABLE chat_room_passes ADD INDEX IF NOT EXISTS idx_expires (expires_at);

-- ── feed_posts: post_type filter ─────────────────────────────────
ALTER TABLE feed_posts ADD INDEX IF NOT EXISTS idx_post_type (post_type);
