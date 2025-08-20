-- 用户注册渠道分析数据
-- 创建用户注册渠道统计表

CREATE TABLE IF NOT EXISTS `user_registration_channels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `channel_name` varchar(50) NOT NULL COMMENT '注册渠道名称',
  `channel_code` varchar(20) NOT NULL COMMENT '渠道代码',
  `registration_count` int(11) NOT NULL DEFAULT 0 COMMENT '注册用户数量',
  `conversion_rate` decimal(5,4) NOT NULL DEFAULT 0.0000 COMMENT '转化率',
  `cost_per_user` decimal(10,2) DEFAULT NULL COMMENT '获客成本',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_channel_code` (`channel_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户注册渠道统计表';

-- 插入示例数据
INSERT INTO `user_registration_channels` (`channel_name`, `channel_code`, `registration_count`, `conversion_rate`, `cost_per_user`) VALUES
('搜索引擎优化', 'SEO', 156, 0.0234, 0.00),
('社交媒体推广', 'SOCIAL', 89, 0.0156, 12.50),
('应用商店推荐', 'APP_STORE', 67, 0.0112, 8.75),
('合作伙伴推荐', 'PARTNER', 45, 0.0089, 15.20),
('线下活动推广', 'OFFLINE', 23, 0.0045, 25.80);

-- 创建用户注册详情表（用于更详细的分析）
CREATE TABLE IF NOT EXISTS `user_registrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(32) NOT NULL COMMENT '用户ID',
  `channel_code` varchar(20) NOT NULL COMMENT '注册渠道代码',
  `device_type` varchar(20) DEFAULT NULL COMMENT '设备类型',
  `region` varchar(50) DEFAULT NULL COMMENT '地区',
  `registration_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `is_active` tinyint(1) NOT NULL DEFAULT 1 COMMENT '是否活跃用户',
  PRIMARY KEY (`id`),
  KEY `idx_channel_code` (`channel_code`),
  KEY `idx_registration_time` (`registration_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户注册详情表';

-- 插入用户注册详情示例数据
INSERT INTO `user_registrations` (`user_id`, `channel_code`, `device_type`, `region`, `registration_time`, `is_active`) VALUES
-- SEO渠道用户
('U202401001', 'SEO', 'Desktop', '北京', '2024-01-15 10:30:00', 1),
('U202401002', 'SEO', 'Mobile', '上海', '2024-01-15 11:15:00', 1),
('U202401003', 'SEO', 'Desktop', '广州', '2024-01-15 14:20:00', 0),
('U202401004', 'SEO', 'Mobile', '深圳', '2024-01-15 16:45:00', 1),
('U202401005', 'SEO', 'Desktop', '杭州', '2024-01-15 18:30:00', 1),

-- 社交媒体渠道用户
('U202401006', 'SOCIAL', 'Mobile', '北京', '2024-01-15 09:15:00', 1),
('U202401007', 'SOCIAL', 'Mobile', '上海', '2024-01-15 12:30:00', 1),
('U202401008', 'SOCIAL', 'Desktop', '成都', '2024-01-15 15:45:00', 0),
('U202401009', 'SOCIAL', 'Mobile', '武汉', '2024-01-15 17:20:00', 1),
('U202401010', 'SOCIAL', 'Desktop', '西安', '2024-01-15 19:10:00', 1),

-- 应用商店渠道用户
('U202401011', 'APP_STORE', 'Mobile', '北京', '2024-01-15 08:45:00', 1),
('U202401012', 'APP_STORE', 'Mobile', '上海', '2024-01-15 13:25:00', 1),
('U202401013', 'APP_STORE', 'Mobile', '广州', '2024-01-15 16:50:00', 0),
('U202401014', 'APP_STORE', 'Mobile', '深圳', '2024-01-15 20:15:00', 1),
('U202401015', 'APP_STORE', 'Mobile', '杭州', '2024-01-15 21:30:00', 1),

-- 合作伙伴渠道用户
('U202401016', 'PARTNER', 'Desktop', '北京', '2024-01-15 10:00:00', 1),
('U202401017', 'PARTNER', 'Desktop', '上海', '2024-01-15 14:30:00', 1),
('U202401018', 'PARTNER', 'Mobile', '成都', '2024-01-15 18:45:00', 0),
('U202401019', 'PARTNER', 'Desktop', '武汉', '2024-01-15 22:10:00', 1),
('U202401020', 'PARTNER', 'Mobile', '西安', '2024-01-15 23:25:00', 1),

-- 线下活动渠道用户
('U202401021', 'OFFLINE', 'Mobile', '北京', '2024-01-15 11:00:00', 1),
('U202401022', 'OFFLINE', 'Desktop', '上海', '2024-01-15 15:30:00', 1),
('U202401023', 'OFFLINE', 'Mobile', '广州', '2024-01-15 19:45:00', 0);

-- 查询饼图数据的SQL语句
-- 这个查询可以直接用于生成饼图数据
SELECT
  channel_name as item,
  registration_count as count,
  ROUND(registration_count / SUM(registration_count) OVER(), 4) as percent
FROM user_registration_channels
ORDER BY registration_count DESC;

-- 按设备类型分组的注册渠道分析
SELECT
  CONCAT(channel_name, ' - ', device_type) as item,
  COUNT(*) as count,
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER(), 4) as percent
FROM user_registrations ur
JOIN user_registration_channels urc ON ur.channel_code = urc.channel_code
GROUP BY ur.channel_code, ur.device_type
ORDER BY count DESC;

-- 按地区分组的注册渠道分析
SELECT
  CONCAT(channel_name, ' - ', region) as item,
  COUNT(*) as count,
  ROUND(COUNT(*) / SUM(COUNT(*)) OVER(), 4) as percent
FROM user_registrations ur
JOIN user_registration_channels urc ON ur.channel_code = urc.channel_code
GROUP BY ur.channel_code, ur.region
ORDER BY count DESC;
