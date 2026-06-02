-- Demo data-source tables for dashboard/analyze examples.
-- Apply to the kanban_data database.

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `sales_funnel_daily` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `channel` varchar(50) NOT NULL COMMENT '渠道',
  `visitors` int NOT NULL DEFAULT 0 COMMENT '访问人数',
  `leads` int NOT NULL DEFAULT 0 COMMENT '线索数',
  `orders` int NOT NULL DEFAULT 0 COMMENT '订单数',
  `revenue` decimal(12,2) NOT NULL DEFAULT 0 COMMENT '收入',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_stat_date` (`stat_date`),
  KEY `idx_channel` (`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='销售漏斗日报';

CREATE TABLE IF NOT EXISTS `inventory_turnover` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `warehouse` varchar(50) NOT NULL COMMENT '仓库',
  `category` varchar(50) NOT NULL COMMENT '品类',
  `stock_qty` int NOT NULL DEFAULT 0 COMMENT '库存数量',
  `sold_qty` int NOT NULL DEFAULT 0 COMMENT '售出数量',
  `turnover_days` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '周转天数',
  `stat_month` varchar(20) NOT NULL COMMENT '统计月份',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_warehouse` (`warehouse`),
  KEY `idx_category` (`category`),
  KEY `idx_stat_month` (`stat_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存周转数据';

CREATE TABLE IF NOT EXISTS `support_ticket_daily` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `stat_date` date NOT NULL COMMENT '统计日期',
  `team` varchar(50) NOT NULL COMMENT '团队',
  `priority` varchar(20) NOT NULL COMMENT '优先级',
  `ticket_count` int NOT NULL DEFAULT 0 COMMENT '工单数',
  `resolved_count` int NOT NULL DEFAULT 0 COMMENT '已解决数',
  `avg_response_minutes` decimal(10,2) NOT NULL DEFAULT 0 COMMENT '平均响应分钟',
  `satisfaction_score` decimal(5,2) NOT NULL DEFAULT 0 COMMENT '满意度',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_stat_date` (`stat_date`),
  KEY `idx_team` (`team`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客服工单日报';

CREATE TABLE IF NOT EXISTS `campaign_conversion` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `campaign_name` varchar(100) NOT NULL COMMENT '活动名称',
  `channel` varchar(50) NOT NULL COMMENT '渠道',
  `impressions` int NOT NULL DEFAULT 0 COMMENT '曝光数',
  `clicks` int NOT NULL DEFAULT 0 COMMENT '点击数',
  `conversions` int NOT NULL DEFAULT 0 COMMENT '转化数',
  `cost` decimal(12,2) NOT NULL DEFAULT 0 COMMENT '投放成本',
  `conversion_rate` decimal(8,4) NOT NULL DEFAULT 0 COMMENT '转化率',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_campaign_name` (`campaign_name`),
  KEY `idx_channel` (`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='营销活动转化数据';

TRUNCATE TABLE `sales_funnel_daily`;
TRUNCATE TABLE `inventory_turnover`;
TRUNCATE TABLE `support_ticket_daily`;
TRUNCATE TABLE `campaign_conversion`;

INSERT INTO `sales_funnel_daily` (`stat_date`, `channel`, `visitors`, `leads`, `orders`, `revenue`) VALUES
('2026-05-25', '官网', 8200, 980, 210, 168500.00),
('2026-05-25', '小程序', 6100, 760, 185, 139800.00),
('2026-05-25', '短视频', 9300, 870, 162, 121400.00),
('2026-05-26', '官网', 8600, 1030, 226, 181200.00),
('2026-05-26', '小程序', 6400, 820, 194, 146900.00),
('2026-05-26', '短视频', 9800, 920, 171, 129700.00),
('2026-05-27', '官网', 9100, 1120, 248, 199300.00),
('2026-05-27', '小程序', 7000, 880, 205, 155600.00),
('2026-05-27', '短视频', 10400, 990, 188, 142100.00);

INSERT INTO `inventory_turnover` (`warehouse`, `category`, `stock_qty`, `sold_qty`, `turnover_days`, `stat_month`) VALUES
('华东仓', '数码', 1280, 860, 18.50, '2026-03'),
('华东仓', '家电', 940, 520, 26.20, '2026-03'),
('华东仓', '服饰', 2100, 1680, 14.80, '2026-03'),
('华南仓', '数码', 1160, 790, 19.30, '2026-03'),
('华南仓', '家电', 880, 470, 28.10, '2026-03'),
('华南仓', '服饰', 2350, 1720, 15.60, '2026-03'),
('西南仓', '数码', 760, 430, 24.90, '2026-03'),
('西南仓', '家电', 520, 260, 31.40, '2026-03'),
('西南仓', '服饰', 1420, 980, 18.20, '2026-03');

INSERT INTO `support_ticket_daily` (`stat_date`, `team`, `priority`, `ticket_count`, `resolved_count`, `avg_response_minutes`, `satisfaction_score`) VALUES
('2026-05-24', '售前支持', 'P1', 26, 25, 8.50, 4.80),
('2026-05-24', '售后支持', 'P2', 84, 78, 18.20, 4.45),
('2026-05-24', '技术支持', 'P1', 42, 39, 12.70, 4.60),
('2026-05-25', '售前支持', 'P2', 58, 55, 14.10, 4.70),
('2026-05-25', '售后支持', 'P1', 35, 34, 9.80, 4.55),
('2026-05-25', '技术支持', 'P2', 76, 70, 21.40, 4.35),
('2026-05-26', '售前支持', 'P1', 31, 30, 7.90, 4.86),
('2026-05-26', '售后支持', 'P2', 91, 84, 19.60, 4.42),
('2026-05-26', '技术支持', 'P1', 47, 45, 11.30, 4.72);

INSERT INTO `campaign_conversion` (`campaign_name`, `channel`, `impressions`, `clicks`, `conversions`, `cost`, `conversion_rate`) VALUES
('618预热', '搜索广告', 320000, 18400, 1260, 56000.00, 0.0685),
('618预热', '信息流', 510000, 22600, 1480, 82000.00, 0.0655),
('618预热', '短视频', 760000, 31800, 2060, 118000.00, 0.0648),
('会员日', '短信', 88000, 9600, 1360, 12000.00, 0.1417),
('会员日', '小程序', 150000, 21000, 2940, 18000.00, 0.1400),
('会员日', '公众号', 120000, 14400, 1720, 15000.00, 0.1194),
('新品首发', '搜索广告', 210000, 11500, 690, 39000.00, 0.0600),
('新品首发', '信息流', 340000, 15300, 820, 52000.00, 0.0536),
('新品首发', '短视频', 460000, 19800, 1180, 74000.00, 0.0596);
