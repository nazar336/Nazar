CREATE DATABASE IF NOT EXISTS lolance CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lolance;

-- ── USERS ──
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(80)  NOT NULL,
    username      VARCHAR(32)  NOT NULL UNIQUE,
    email         VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN DEFAULT FALSE,
    avatar        VARCHAR(500),
    bio           TEXT,
    role          VARCHAR(100),
    skills        TEXT,
    website       VARCHAR(255),
    location      VARCHAR(150),
    balance       DECIMAL(12,2) DEFAULT 0.00,
    earnings      DECIMAL(12,2) DEFAULT 0.00,
    level         INT DEFAULT 1,
    xp            INT DEFAULT 0,
    streak        INT DEFAULT 0,
    completed_tasks INT DEFAULT 0,
    active_tasks  INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_username (username),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── LEGAL ACCEPTANCES (Terms/Privacy consent log) ──
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

-- ── EMAIL VERIFICATION ──
CREATE TABLE IF NOT EXISTS email_verifications (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    verification_code VARCHAR(6) NOT NULL,
    is_verified   BOOLEAN DEFAULT FALSE,
    attempts      INT DEFAULT 0,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at    DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    UNIQUE KEY unique_user_verification (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TASKS ──
CREATE TABLE IF NOT EXISTS tasks (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    creator_id    INT UNSIGNED NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   LONGTEXT NOT NULL,
    category      VARCHAR(50),
    difficulty    ENUM('easy','medium','hard') DEFAULT 'medium',
    reward        DECIMAL(10,2) NOT NULL,
    slots         INT DEFAULT 1,
    taken_slots   INT DEFAULT 0,
    status        ENUM('open','in_progress','completed','cancelled') DEFAULT 'open',
    deadline      DATETIME,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_status (status),
    KEY idx_creator_id (creator_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TASK ASSIGNMENTS (who took what task) ──
CREATE TABLE IF NOT EXISTS task_assignments (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id       INT UNSIGNED NOT NULL,
    user_id       INT UNSIGNED NOT NULL,
    status        ENUM('taken','completed','cancelled') DEFAULT 'taken',
    assigned_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at  DATETIME,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_task_user (task_id, user_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── WALLET / TRANSACTIONS ──
CREATE TABLE IF NOT EXISTS transactions (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    type          ENUM('deposit','withdraw','transfer_sent','transfer_received','task_reward','task_refund') NOT NULL,
    amount        DECIMAL(12,2) NOT NULL,
    from_user_id  INT UNSIGNED,
    to_user_id    INT UNSIGNED,
    task_id       INT UNSIGNED,
    status        ENUM('pending','completed','failed','cancelled') DEFAULT 'pending',
    description   VARCHAR(255),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    KEY idx_user_id (user_id),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── MESSAGE THREADS (створити ЕРШ ніж messages!) ──
CREATE TABLE IF NOT EXISTS message_threads (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user1_id      INT UNSIGNED NOT NULL,
    user2_id      INT UNSIGNED NOT NULL,
    task_id       INT UNSIGNED,
    last_message_at DATETIME,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    UNIQUE KEY unique_thread (user1_id, user2_id),
    KEY idx_user1_id (user1_id),
    KEY idx_user2_id (user2_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── MESSAGES / CHAT ──
CREATE TABLE IF NOT EXISTS messages (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id     INT UNSIGNED NOT NULL,
    sender_id     INT UNSIGNED NOT NULL,
    content       TEXT NOT NULL,
    read_at       DATETIME,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_thread_id (thread_id),
    KEY idx_sender_id (sender_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── NOTIFICATIONS ──
CREATE TABLE IF NOT EXISTS notifications (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    type          ENUM('task','message','payment','achievement','system') DEFAULT 'system',
    title         VARCHAR(255) NOT NULL,
    content       TEXT,
    related_id    INT UNSIGNED,
    read_at       DATETIME,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── SUPPORT TICKETS ──
CREATE TABLE IF NOT EXISTS support_tickets (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    subject       VARCHAR(255) NOT NULL,
    description   LONGTEXT NOT NULL,
    category      ENUM('billing','technical','account','general') DEFAULT 'general',
    priority      ENUM('low','normal','high','critical') DEFAULT 'normal',
    status        ENUM('open','in_progress','resolved','closed') DEFAULT 'open',
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TICKET RESPONSES ──
CREATE TABLE IF NOT EXISTS ticket_responses (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_id     INT UNSIGNED NOT NULL,
    user_id       INT UNSIGNED NOT NULL,
    content       LONGTEXT NOT NULL,
    is_admin      BOOLEAN DEFAULT FALSE,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_ticket_id (ticket_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ACHIEVEMENTS ──
CREATE TABLE IF NOT EXISTS achievements (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    badge_name    VARCHAR(100) NOT NULL,
    description   TEXT,
    earned_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── TASK FEEDBACK / REVIEWS ──
CREATE TABLE IF NOT EXISTS task_reviews (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    task_id       INT UNSIGNED NOT NULL,
    reviewer_id   INT UNSIGNED NOT NULL,
    reviewee_id   INT UNSIGNED NOT NULL,
    rating        INT DEFAULT 5,
    comment       TEXT,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewee_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (task_id, reviewer_id),
    KEY idx_reviewee_id (reviewee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── КРИПТО ГАМАНЕЦЬ / МОНЕТИ ──
CREATE TABLE IF NOT EXISTS user_coins (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         INT UNSIGNED NOT NULL,
    coin_balance    DECIMAL(16,2) DEFAULT 0.00,
    usdt_balance    DECIMAL(16,2) DEFAULT 0.00,
    total_purchased DECIMAL(16,2) DEFAULT 0.00,
    total_spent     DECIMAL(16,2) DEFAULT 0.00,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_coins (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── КРИПТО ДЕПОЗИТИ ──
CREATE TABLE IF NOT EXISTS crypto_deposits (
    id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          INT UNSIGNED NOT NULL,
    transaction_hash VARCHAR(100),
    amount_usdt      DECIMAL(12,2) NOT NULL,
    amount_coins     DECIMAL(16,2) NOT NULL,
    exchange_rate    DECIMAL(12,2) NOT NULL,
    network          VARCHAR(20) DEFAULT 'TRC20',
    status           ENUM('pending','confirmed','failed','expired') DEFAULT 'pending',
    wallet_address   VARCHAR(100),
    expires_at       DATETIME,
    confirmed_at     DATETIME,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_id (user_id),
    KEY idx_status (status),
    KEY idx_tx_hash (transaction_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ЩОДЕННИЙ CHECK-IN (30-денний календар) ──
CREATE TABLE IF NOT EXISTS daily_checkins (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    checkin_date  DATE         NOT NULL,
    points_earned INT          DEFAULT 10,
    UNIQUE KEY uniq_user_date (user_id, checkin_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_date (user_id, checkin_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ЩОДЕННИЙ ВІЗИТ (окремо від check-in, дає XP) ──
CREATE TABLE IF NOT EXISTS daily_visits (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    visit_date    DATE         NOT NULL,
    points_earned INT          DEFAULT 5,
    UNIQUE KEY uniq_user_visit (user_id, visit_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_visit (user_id, visit_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ПАСИ ДЛЯ ДОСТУПУ ДО ЧАТУ (куплені за монети) ──
CREATE TABLE IF NOT EXISTS chat_room_passes (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id       INT UNSIGNED NOT NULL,
    room_tier     TINYINT      NOT NULL  COMMENT '2=silver,3=gold,4=diamond',
    coins_paid    INT          NOT NULL,
    expires_at    DATETIME     NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_user_tier (user_id, room_tier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ПОВІДОМЛЕННЯ В ПУБЛІЧНИХ ЧАТ-КІМНАТАХ ──
CREATE TABLE IF NOT EXISTS chat_room_messages (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    room_tier     TINYINT      NOT NULL,
    user_id       INT UNSIGNED NOT NULL,
    username      VARCHAR(32)  NOT NULL,
    message       TEXT         NOT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    KEY idx_room_time (room_tier, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ВИТРАТИ МОНЕТ ──
CREATE TABLE IF NOT EXISTS coin_spending (
    id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     INT UNSIGNED NOT NULL,
    task_id     INT UNSIGNED,
    amount      DECIMAL(16,2) NOT NULL,
    type        ENUM('task_payment','tip','premium','withdraw') DEFAULT 'task_payment',
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── FEED POSTS (контент стрічки з XP нагородами) ──
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

-- ── FEED LIKES (лайки з захистом від дублів) ──
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

-- ── КРИПТО ВИВОДИ ──
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
