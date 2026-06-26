const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../data/linli.db');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 先启用 WAL 模式以支持并发读写
  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA busy_timeout=10000');

  const initSQL = fs.readFileSync(path.resolve(__dirname, 'init.sql'), 'utf8');
  // Remove ALTER TABLE lines from init.sql (handled separately below)
  const cleanSQL = initSQL.split('\n').filter(line => !line.trim().startsWith('ALTER TABLE')).join('\n');
  db.exec(cleanSQL, (err) => {
    if (err) {
      console.error('数据库初始化失败:', err);
    } else {
      console.log('数据库初始化成功');
      repairLegacyTaskTable(() => {
      // V1.4: ALTER TABLE - 逐条执行，忽略重复列错误
      const alterStatements = [
        "ALTER TABLE t_worker ADD COLUMN certification_level INTEGER DEFAULT 0",
        "ALTER TABLE t_worker ADD COLUMN certification_at TEXT",
        "ALTER TABLE t_worker ADD COLUMN total_rating_count INTEGER DEFAULT 0",
        "ALTER TABLE t_worker ADD COLUMN complaint_count INTEGER DEFAULT 0",
        "ALTER TABLE t_worker ADD COLUMN service_periods TEXT",
        "ALTER TABLE t_task ADD COLUMN target_hospital TEXT",
        "ALTER TABLE t_task ADD COLUMN target_hospital_lat REAL",
        "ALTER TABLE t_task ADD COLUMN target_hospital_lng REAL"
      ];
      let alterIndex = 0;
      const runNextAlter = () => {
        if (alterIndex >= alterStatements.length) {
          initMockData();
          return;
        }
        db.run(alterStatements[alterIndex], (alterErr) => {
          if (alterErr && !alterErr.message.includes('duplicate column')) {
            console.error('添加字段失败:', alterStatements[alterIndex], alterErr);
          }
          alterIndex++;
          runNextAlter();
        });
      };
      runNextAlter();
      });
    }
  });
});

function repairLegacyTaskTable(done) {
  db.all('PRAGMA table_info(t_task)', (err, columns) => {
    if (err) {
      console.error('检查任务表结构失败:', err);
      done();
      return;
    }

    const columnNames = columns.map(column => column.name);
    const hasLegacyEmployerId = columnNames.includes('employer_id_old');

    if (!hasLegacyEmployerId) {
      done();
      return;
    }

    const targetHospitalSelect = columnNames.includes('target_hospital') ? 'target_hospital' : 'NULL';
    const targetHospitalLatSelect = columnNames.includes('target_hospital_lat') ? 'target_hospital_lat' : 'NULL';
    const targetHospitalLngSelect = columnNames.includes('target_hospital_lng') ? 'target_hospital_lng' : 'NULL';

    const repairSQL = `
      PRAGMA foreign_keys=OFF;
      BEGIN TRANSACTION;

      DROP INDEX IF EXISTS idx_task_status_created;
      DROP INDEX IF EXISTS idx_task_employer;

      CREATE TABLE t_task_new (
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
        target_hospital TEXT,
        target_hospital_lat REAL,
        target_hospital_lng REAL,
        FOREIGN KEY (employer_id) REFERENCES t_user(id),
        FOREIGN KEY (worker_id) REFERENCES t_user(id)
      );

      INSERT INTO t_task_new (
        id, employer_id, type, sub_type, start_time, end_time, duration_minutes,
        address, latitude, longitude, physical_level, budget, is_charity,
        special_requirements, status, worker_id, created_at, expires_at,
        target_hospital, target_hospital_lat, target_hospital_lng
      )
      SELECT
        id, COALESCE(employer_id, employer_id_old), type, sub_type, start_time,
        end_time, duration_minutes, address, latitude, longitude, physical_level,
        budget, is_charity, special_requirements, status, worker_id, created_at,
        expires_at, ${targetHospitalSelect}, ${targetHospitalLatSelect}, ${targetHospitalLngSelect}
      FROM t_task;

      DROP TABLE t_task;
      ALTER TABLE t_task_new RENAME TO t_task;

      CREATE INDEX IF NOT EXISTS idx_task_status_created ON t_task(status, created_at);
      CREATE INDEX IF NOT EXISTS idx_task_employer ON t_task(employer_id);

      COMMIT;
      PRAGMA foreign_keys=ON;
    `;

    console.log('检测到旧任务表字段 employer_id_old，正在修复 t_task 表结构...');
    db.exec(repairSQL, (repairErr) => {
      if (repairErr) {
        console.error('修复 t_task 表结构失败:', repairErr);
        db.exec('ROLLBACK; PRAGMA foreign_keys=ON;', () => done());
        return;
      }

      console.log('t_task 表结构修复完成');
      done();
    });
  });
}

function initMockData() {
  db.get("SELECT COUNT(*) as count FROM t_user", (err, row) => {
    if (err) {
      console.error('检查用户数据失败:', err);
      return;
    }

    if (row.count === 0) {
      console.log('开始初始化假数据...');
      const mockSQL = fs.readFileSync(path.resolve(__dirname, 'init_data.sql'), 'utf8');
      db.exec(mockSQL, (err) => {
        if (err) {
          console.error('假数据初始化失败:', err);
        } else {
          console.log('假数据初始化成功');
          refreshDemoTaskDates();
        }
      });
    } else {
      console.log('数据库已有数据，更新服务者技能标签为陪诊子服务...');
      const updateSkillsSQL = `
        UPDATE t_worker SET skills = CASE user_id
          WHEN 1 THEN '["全程陪同","挂号取药"]'
          WHEN 2 THEN '["挂号取药","门诊陪护"]'
          WHEN 3 THEN '["全程陪同","代为问诊"]'
          WHEN 4 THEN '["挂号取药"]'
          WHEN 5 THEN '["门诊陪护","全程陪同"]'
        END
        WHERE user_id IN (1, 2, 3, 4, 5)
      `;
      db.run(updateSkillsSQL, (updateErr) => {
        if (updateErr) {
          console.error('更新服务者技能标签失败:', updateErr);
        } else {
          console.log('服务者技能标签已更新为陪诊子服务');
        }
      });
      refreshDemoTaskDates();
      console.log('用户数据已存在，跳过假数据初始化');
    }
  });
}

function refreshDemoTaskDates() {
  const demoSchedule = [
    { id: 1, day: 1, start: '08:30:00', end: '11:00:00', duration: 150 },
    { id: 2, day: 1, start: '10:30:00', end: '12:00:00', duration: 90 },
    { id: 3, day: 1, start: '14:00:00', end: '17:00:00', duration: 180 },
    { id: 4, day: 1, start: '15:30:00', end: '16:30:00', duration: 60 },
    { id: 5, day: 2, start: '08:00:00', end: '10:00:00', duration: 120 },
    { id: 6, day: 2, start: '09:30:00', end: '12:30:00', duration: 180 },
    { id: 7, day: 2, start: '13:30:00', end: '16:30:00', duration: 180 },
    { id: 8, day: 2, start: '15:30:00', end: '17:00:00', duration: 90 },
    { id: 9, day: 3, start: '08:30:00', end: '11:00:00', duration: 150 },
    { id: 10, day: 3, start: '10:00:00', end: '12:00:00', duration: 120 },
    { id: 11, day: 3, start: '14:00:00', end: '17:00:00', duration: 180 },
    { id: 12, day: 3, start: '15:30:00', end: '16:30:00', duration: 60 },
    { id: 13, day: 4, start: '08:00:00', end: '11:30:00', duration: 210 },
    { id: 14, day: 4, start: '09:30:00', end: '11:00:00', duration: 90 },
    { id: 15, day: 4, start: '14:00:00', end: '17:00:00', duration: 180 }
  ];

  const sql = `
    UPDATE t_task
    SET start_time = date('now', ?) || ?,
        end_time = date('now', ?) || ?,
        duration_minutes = ?,
        expires_at = date('now', ?) || ' 23:59:59'
    WHERE id = ?
      AND status = 0
      AND employer_id IN (11, 12, 13, 14, 15)
  `;

  demoSchedule.forEach(({ id, day, start, end, duration }) => {
    const dayModifier = `+${day} day`;
    db.run(sql, [
      dayModifier,
      ` ${start}`,
      dayModifier,
      ` ${end}`,
      duration,
      dayModifier,
      id
    ]);
  });
}

db.allSync = (sql, ...params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, ...params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

db.getSync = (sql, ...params) => {
  return new Promise((resolve, reject) => {
    db.get(sql, ...params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

db.runSync = (sql, ...params) => {
  return new Promise((resolve, reject) => {
    db.run(sql, ...params, function(err) {
      if (err) reject(err);
      else resolve({ lastInsertRowid: this.lastID, changes: this.changes });
    });
  });
};

module.exports = db;
