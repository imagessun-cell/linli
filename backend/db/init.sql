PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS t_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE,
    phone TEXT NOT NULL UNIQUE,
    nickname TEXT,
    avatar_url TEXT,
    role INTEGER NOT NULL DEFAULT 1,
    status INTEGER DEFAULT 0,
    real_name TEXT,
    id_card TEXT,
    face_verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS t_worker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    age INTEGER NOT NULL,
    community TEXT NOT NULL,
    service_radius INTEGER DEFAULT 3000,
    skills TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    total_orders INTEGER DEFAULT 0,
    total_hours INTEGER DEFAULT 0,
    avg_rating REAL DEFAULT 5.0,
    honor_level INTEGER DEFAULT 0,
    status INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_employer (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    credit_score INTEGER DEFAULT 100,
    common_addresses TEXT,
    FOREIGN KEY (user_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_agent_binding (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent_user_id INTEGER NOT NULL,
    worker_user_id INTEGER NOT NULL,
    verified INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (agent_user_id) REFERENCES t_user(id),
    FOREIGN KEY (worker_user_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_task (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employer_id INTEGER NOT NULL,
    type INTEGER NOT NULL,
    sub_type INTEGER,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    address TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    physical_level INTEGER DEFAULT 1,
    budget REAL NOT NULL,
    is_charity INTEGER DEFAULT 0,
    special_requirements TEXT,
    status INTEGER DEFAULT 0,
    worker_id INTEGER,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (employer_id) REFERENCES t_user(id),
    FOREIGN KEY (worker_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_order (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL UNIQUE,
    order_no TEXT NOT NULL UNIQUE,
    employer_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    platform_commission REAL DEFAULT 0,
    worker_income REAL NOT NULL,
    points_earned INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    insurance_no TEXT,
    start_service_time TEXT,
    finish_service_time TEXT,
    created_at TEXT NOT NULL,
    pay_time TEXT,
    complete_time TEXT,
    FOREIGN KEY (task_id) REFERENCES t_task(id),
    FOREIGN KEY (employer_id) REFERENCES t_user(id),
    FOREIGN KEY (worker_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_wallet (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL UNIQUE,
    cash_balance REAL DEFAULT 0,
    points_balance INTEGER DEFAULT 0,
    frozen_amount REAL DEFAULT 0,
    FOREIGN KEY (worker_id) REFERENCES t_worker(id)
);

CREATE TABLE IF NOT EXISTS t_wallet_transaction (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wallet_id INTEGER NOT NULL,
    type INTEGER NOT NULL,
    amount REAL,
    points_change INTEGER,
    order_id INTEGER,
    status INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (wallet_id) REFERENCES t_wallet(id)
);

CREATE TABLE IF NOT EXISTS t_course (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    duration_seconds INTEGER,
    cover_url TEXT,
    sort_order INTEGER DEFAULT 0,
    is_required INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS t_task_type (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    icon TEXT DEFAULT '📋',
    sort_order INTEGER DEFAULT 0,
    has_sub_types INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

INSERT OR IGNORE INTO t_task_type (id, name, icon, sort_order, has_sub_types) VALUES
-- 任务类型：1=全程陪同, 2=挂号取药, 3=门诊陪护, 4=代为问诊, 5=陪诊师培训
(1, '全程陪同', '👣', 1, 1),
(2, '挂号取药', '💊', 2, 1),
(3, '门诊陪护', '🪑', 3, 1),
(4, '代为问诊', '📝', 4, 1),
(5, '陪诊师培训', '🎓', 5, 1);

CREATE TABLE IF NOT EXISTS t_learning_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    finished INTEGER DEFAULT 0,
    last_watch_time TEXT,
    FOREIGN KEY (worker_id) REFERENCES t_worker(id),
    FOREIGN KEY (course_id) REFERENCES t_course(id)
);

CREATE TABLE IF NOT EXISTS t_community_post (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    content_type INTEGER DEFAULT 1,
    content_text TEXT,
    voice_url TEXT,
    image_urls TEXT,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    status INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (worker_id) REFERENCES t_worker(id)
);

CREATE TABLE IF NOT EXISTS t_message (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_user_id INTEGER NOT NULL,
    to_user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    type INTEGER DEFAULT 1,
    is_read INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (from_user_id) REFERENCES t_user(id),
    FOREIGN KEY (to_user_id) REFERENCES t_user(id)
);

CREATE INDEX IF NOT EXISTS idx_user_phone ON t_user(phone);
CREATE INDEX IF NOT EXISTS idx_user_role ON t_user(role);
CREATE INDEX IF NOT EXISTS idx_task_status_created ON t_task(status, created_at);
CREATE INDEX IF NOT EXISTS idx_task_employer ON t_task(employer_id);
CREATE INDEX IF NOT EXISTS idx_order_worker ON t_order(worker_id);
CREATE INDEX IF NOT EXISTS idx_order_employer ON t_order(employer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_worker ON t_wallet(worker_id);