-- V1.4b: 诊前病史资料
CREATE TABLE IF NOT EXISTS t_pre_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    patient_name TEXT,
    patient_age INTEGER,
    medical_history TEXT,
    allergy_history TEXT,
    current_symptoms TEXT,
    medication_info TEXT,
    other_info TEXT,
    screenshot_url TEXT,
    confirmed_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES t_order(id),
    FOREIGN KEY (worker_id) REFERENCES t_worker(id)
);

-- V1.4b: 陪诊服务报告
CREATE TABLE IF NOT EXISTS t_service_report (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    doctor_advice TEXT,
    medication_reminder TEXT,
    next_visit_date TEXT,
    photo_urls TEXT,
    notes TEXT,
    submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (order_id) REFERENCES t_order(id),
    FOREIGN KEY (worker_id) REFERENCES t_worker(id)
);

-- V1.4b: 考试题库
CREATE TABLE IF NOT EXISTS t_exam_question (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    category TEXT DEFAULT 'general',
    sort_order INTEGER DEFAULT 0
);

-- V1.4b: 考试记录
CREATE TABLE IF NOT EXISTS t_exam_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    worker_id INTEGER NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    correct_count INTEGER NOT NULL,
    passed INTEGER DEFAULT 0,
    answers TEXT,
    started_at TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT,
    FOREIGN KEY (worker_id) REFERENCES t_worker(id)
);
