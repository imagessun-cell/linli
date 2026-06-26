-- V1.4 migration: add missing columns to t_worker
ALTER TABLE t_worker ADD COLUMN certification_at TEXT;
ALTER TABLE t_worker ADD COLUMN total_rating_count INTEGER DEFAULT 0;
ALTER TABLE t_worker ADD COLUMN complaint_count INTEGER DEFAULT 0;

-- V1.4 migration: create new tables
CREATE TABLE IF NOT EXISTS t_service_agreement (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    agreement_type TEXT NOT NULL,
    version TEXT DEFAULT '1.0',
    signed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_service_checkpoint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    checkpoint_key TEXT NOT NULL,
    checkpoint_name TEXT NOT NULL,
    photo_url TEXT,
    location_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES t_order(id)
);

CREATE TABLE IF NOT EXISTS t_complaint (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    complainant_id INTEGER NOT NULL,
    respondent_id INTEGER,
    complaint_type TEXT NOT NULL,
    description TEXT,
    photo_urls TEXT,
    status INTEGER DEFAULT 0,
    resolution TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    resolved_at TEXT,
    FOREIGN KEY (order_id) REFERENCES t_order(id),
    FOREIGN KEY (complainant_id) REFERENCES t_user(id),
    FOREIGN KEY (respondent_id) REFERENCES t_user(id)
);

CREATE TABLE IF NOT EXISTS t_sos_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER,
    latitude REAL,
    longitude REAL,
    status INTEGER DEFAULT 0,
    responded_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES t_user(id)
);
