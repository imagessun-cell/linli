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
  const initSQL = fs.readFileSync(path.resolve(__dirname, 'init.sql'), 'utf8');
  db.exec(initSQL, (err) => {
    if (err) {
      console.error('数据库初始化失败:', err);
    } else {
      console.log('数据库初始化成功');
      db.exec("ALTER TABLE t_task ADD COLUMN sub_type INTEGER", (alterErr) => {
        if (alterErr && !alterErr.message.includes('duplicate column')) {
          console.error('添加sub_type字段失败:', alterErr);
        } else if (!alterErr) {
          console.log('sub_type字段添加成功');
        }
        initMockData();
      });
    }
  });
});

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
      console.log('用户数据已存在，跳过假数据初始化');
    }
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
      else resolve({ lastInsertRowid: this.lastInsertRowid, changes: this.changes });
    });
  });
};

module.exports = db;
