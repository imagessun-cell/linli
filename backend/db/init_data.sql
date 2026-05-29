-- ========================
-- 邻里平台假数据初始化脚本
-- ========================
-- 仅在数据库为空时执行

-- 插入用户（服务者、用工方）
INSERT INTO t_user (id, phone, nickname, role, status, real_name, face_verified, created_at, updated_at) VALUES
(1, '13800000001', '王阿姨', 1, 0, '王淑芬', 1, datetime('now'), datetime('now')),
(2, '13800000002', '李大叔', 1, 0, '李建国', 1, datetime('now'), datetime('now')),
(3, '13800000003', '张奶奶', 1, 0, '张秀英', 1, datetime('now'), datetime('now')),
(4, '13800000004', '刘师傅', 1, 0, '刘德明', 1, datetime('now'), datetime('now')),
(5, '13800000005', '陈阿姨', 1, 0, '陈美珍', 0, datetime('now'), datetime('now')),

(11, '13900000001', '赵女士', 2, 0, '赵丽华', 1, datetime('now'), datetime('now')),
(12, '13900000002', '孙先生', 2, 0, '孙志远', 1, datetime('now'), datetime('now')),
(13, '13900000003', '周小姐', 2, 0, '周敏', 1, datetime('now'), datetime('now')),
(14, '13900000004', '吴先生', 2, 0, '吴国栋', 1, datetime('now'), datetime('now')),
(15, '13900000005', '郑女士', 2, 0, '郑晓燕', 0, datetime('now'), datetime('now'));

-- 插入服务者扩展信息（年龄50-65，社区，技能标签）
INSERT INTO t_worker (user_id, age, community, service_radius, skills, emergency_contact_name, emergency_contact_phone, total_orders, total_hours, avg_rating, honor_level, status) VALUES
(1, 58, '浦东新区花木街道', 3000, '["陪诊","陪聊"]', '王强', '138****1111', 12, 36, 4.9, 2, 1),
(2, 62, '徐汇区田林街道', 2500, '["小时保洁","做饭"]', '李芳', '138****2222', 8, 24, 4.8, 1, 1),
(3, 64, '静安区南京西路街道', 2000, '["陪聊","看护"]', '张明', '138****3333', 20, 60, 4.95, 3, 1),
(4, 55, '杨浦区五角场街道', 3500, '["跑腿","简单维修"]', '刘红', '138****4444', 5, 15, 4.7, 1, 1),
(5, 60, '黄浦区外滩街道', 3000, '["做饭","接送"]', '陈浩', '138****5555', 0, 0, 5.0, 0, 0);

-- 插入用工方信息
INSERT INTO t_employer (user_id, credit_score, common_addresses) VALUES
(11, 98, '["浦东新区张江高科技园区"]'),
(12, 95, '["徐汇区龙华街道龙华路123号"]'),
(13, 100, '["静安区共和新路街道"]'),
(14, 92, '["杨浦区新江湾城街道"]'),
(15, 85, '["闵行区七宝镇"]');

-- 插入任务（岗位），使用百度BD-09坐标（上海市各区域）
INSERT INTO t_task (employer_id, type, start_time, end_time, duration_minutes, address, latitude, longitude, physical_level, budget, is_charity, special_requirements, status, created_at, expires_at) VALUES
(11, 1, '2026-06-01 09:00:00', '2026-06-01 11:30:00', 150, '浦东新区东方路1678号仁济医院东院', 31.214, 121.520, 1, 60, 0, '需帮助取药', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(12, 2, '2026-06-02 14:00:00', '2026-06-02 16:00:00', 120, '徐汇区龙华路123号', 31.175, 121.453, 1, 45, 0, '会说上海话优先', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(13, 3, '2026-06-03 10:00:00', '2026-06-03 12:00:00', 120, '静安区愚园路108号', 31.221, 121.442, 2, 70, 0, '三室一厅', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(14, 4, '2026-06-04 17:30:00', '2026-06-04 19:00:00', 90, '杨浦区大学路318号', 31.308, 121.511, 1, 50, 0, '清淡口味', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(15, 5, '2026-06-05 08:00:00', '2026-06-05 08:40:00', 40, '虹口区广中路123号', 31.284, 121.473, 1, 30, 0, '儿童座椅需有', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(11, 6, '2026-06-06 09:00:00', '2026-06-06 12:00:00', 180, '浦东新区锦绣路800号', 31.201, 121.567, 2, 100, 0, '有护理经验', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(12, 7, '2026-06-07 10:30:00', '2026-06-07 11:00:00', 30, '徐汇区漕溪北路78号', 31.180, 121.433, 1, 25, 0, '帮取快递', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(13, 8, '2026-06-08 15:00:00', '2026-06-08 17:00:00', 120, '静安区乌鲁木齐北路505号', 31.208, 121.442, 1, 55, 0, '教老人用智能手机', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(14, 1, '2026-06-09 13:00:00', '2026-06-09 15:30:00', 150, '杨浦区长海路168号长海医院', 31.299, 121.512, 1, 65, 0, '需轮椅协助', 0, datetime('now'), datetime('2026-06-10 23:59:59')),
(11, 3, '2026-06-10 09:30:00', '2026-06-10 11:30:00', 120, '浦东新区世纪大道100号', 31.237, 121.511, 2, 80, 0, '简单收纳', 0, datetime('now'), datetime('2026-06-10 23:59:59'));

-- 为部分服务者创建钱包
INSERT INTO t_wallet (worker_id, cash_balance, points_balance, frozen_amount) VALUES
(1, 128.50, 350, 0),
(2, 89.00, 210, 0),
(3, 245.00, 680, 0),
(4, 35.00, 90, 0);

-- 插入几个已完成订单的流水（示例）
INSERT INTO t_wallet_transaction (wallet_id, type, amount, points_change, order_id, status, created_at) VALUES
(1, 1, 60, 10, NULL, 1, datetime('now', '-3 days')),
(1, 1, 45, 8, NULL, 1, datetime('now', '-2 days')),
(2, 1, 50, 10, NULL, 1, datetime('now', '-1 day')),
(3, 1, 70, 15, NULL, 1, datetime('now', '-4 days'));

-- 银发圈动态（示例）
INSERT INTO t_community_post (worker_id, content_type, content_text, voice_url, image_urls, like_count, comment_count, status, created_at) VALUES
(1, 1, '今天陪诊的王爷爷很慈祥，还给我带了自己做的点心。#暖心', NULL, NULL, 12, 2, 0, datetime('now', '-2 days')),
(2, 1, '做保洁的时候发现客户家书柜倒了，顺手帮忙修理了一下。大家遇到类似情况量力而行。', NULL, NULL, 5, 1, 0, datetime('now', '-1 day'));

-- 插入培训课程
INSERT INTO t_course (title, video_url, duration_seconds, cover_url, sort_order, is_required) VALUES
('新员工入职培训', 'https://example.com/video1.mp4', 1800, 'https://example.com/cover1.jpg', 1, 1),
('服务礼仪规范', 'https://example.com/video2.mp4', 1200, 'https://example.com/cover2.jpg', 2, 1),
('老年人沟通技巧', 'https://example.com/video3.mp4', 1500, 'https://example.com/cover3.jpg', 3, 0),
('急救基础知识', 'https://example.com/video4.mp4', 2000, 'https://example.com/cover4.jpg', 4, 0);