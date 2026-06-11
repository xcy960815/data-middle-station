DROP TABLE IF EXISTS `analyze_alarm_logs`;
DROP TABLE IF EXISTS `analyze_alarms`;

CREATE TABLE IF NOT EXISTS `analyze_alarms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `analyze_id` bigint unsigned NOT NULL COMMENT '关联的图表 ID（外键关联 analyze 表）',
  `alarm_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '报警名称',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '报警是否启用：0-停用，1-启用',
  `cron_expression` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '定时检测频率（Cron表达式）',
  `conditions` json NOT NULL COMMENT '报警触发条件',
  `notification_config` json NOT NULL COMMENT '通知接收人配置',
  `alarm_strategy` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'always' COMMENT '连续报警策略：always, once_per_day, only_state_change',
  `last_triggered_time` datetime DEFAULT NULL COMMENT '上次成功触发通知的时间',
  `created_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '创建人',
  `updated_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '更新人',
  `created_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_analyze_id` (`analyze_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表报警规则表';

CREATE TABLE IF NOT EXISTS `analyze_alarm_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键 ID',
  `alarm_id` bigint unsigned NOT NULL COMMENT '关联的报警规则 ID',
  `execute_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '任务执行（检查）时间',
  `is_triggered` tinyint(1) NOT NULL DEFAULT '0' COMMENT '本次检测是否满足了报警条件：0-未触发，1-触发',
  `trigger_detail` json DEFAULT NULL COMMENT '触发详情（记录当时的实际指标值是多少）',
  `notify_status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '通知发送状态：success, failed, skipped',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '失败时的异常原因记录',
  PRIMARY KEY (`id`),
  KEY `idx_alarm_id` (`alarm_id`),
  KEY `idx_execute_time` (`execute_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表报警执行日志表';

-- --------------------------------------------------------
-- 插入测试用的 Mock 报警规则
-- --------------------------------------------------------
INSERT INTO `analyze_alarms` (`id`, `analyze_id`, `alarm_name`, `is_active`, `cron_expression`, `conditions`, `notification_config`, `alarm_strategy`, `created_by`, `updated_by`) VALUES
(1, 1, '测试报警：活跃用户激增', 1, '* * * * *', '[{"measureId": "active_users", "operator": ">", "threshold": 1000}]', '{"emails": ["test@example.com"], "webhookUrl": ""}', 'always', 'system', 'system'),
(2, 1, '收入跌破预警', 1, '0 * * * *', '[{"measureId": "revenue", "operator": "<", "threshold": 5000}]', '{"emails": ["manager@example.com"], "webhookUrl": "https://webhook.test/api"}', 'once_per_day', 'admin', 'admin'),
(3, 105, '异常错误率检测', 0, '0 9 * * *', '[{"measureId": "error_rate", "operator": ">=", "threshold": 0.05}]', '{"emails": ["devops@example.com"], "webhookUrl": ""}', 'only_state_change', 'developer', 'developer');

-- --------------------------------------------------------
-- 插入测试用的 Mock 报警执行日志
-- --------------------------------------------------------
INSERT INTO `analyze_alarm_logs` (`alarm_id`, `execute_time`, `is_triggered`, `trigger_detail`, `notify_status`, `error_message`) VALUES
(1, '2026-06-12 00:00:00', 1, '{"active_users": 1050, "date": "2026-06-11"}', 'success', ''),
(1, '2026-06-12 00:01:00', 0, NULL, 'skipped', ''),
(2, '2026-06-12 00:00:00', 1, '{"revenue": 4500}', 'failed', 'Network Timeout when calling webhook'),
(2, '2026-06-11 23:00:00', 0, NULL, 'skipped', '');
