-- 定时邮件任务表
CREATE TABLE IF NOT EXISTS `scheduled_email_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(255) NOT NULL COMMENT '任务名称',
  `schedule_time` datetime NOT NULL COMMENT '计划执行时间',
  `email_config` json NOT NULL COMMENT '邮件配置(JSON格式)',
  `chart_data` json NOT NULL COMMENT '图表数据(JSON格式)',
  `status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  `remark` text COMMENT '备注说明',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `executed_at` timestamp NULL DEFAULT NULL COMMENT '执行时间',
  `error_message` text COMMENT '错误信息',
  `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '重试次数',
  `max_retries` int(11) NOT NULL DEFAULT 3 COMMENT '最大重试次数',
  PRIMARY KEY (`id`),
  KEY `idx_schedule_time` (`schedule_time`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务表';

-- 任务执行日志表
CREATE TABLE IF NOT EXISTS `scheduled_email_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `task_id` int(11) NOT NULL COMMENT '任务ID',
  `execution_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  `status` enum('success','failed') NOT NULL COMMENT '执行状态',
  `message` text COMMENT '执行消息',
  `error_details` text COMMENT '错误详情',
  `email_message_id` varchar(255) COMMENT '邮件消息ID',
  `execution_duration` int(11) COMMENT '执行耗时(毫秒)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_execution_time` (`execution_time`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_scheduled_email_logs_task_id` FOREIGN KEY (`task_id`) REFERENCES `scheduled_email_tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务执行日志表';

-- 添加索引优化查询性能
CREATE INDEX `idx_task_name` ON `scheduled_email_tasks` (`task_name`);
CREATE INDEX `idx_status_schedule_time` ON `scheduled_email_tasks` (`status`, `schedule_time`);
CREATE INDEX `idx_task_status` ON `scheduled_email_logs` (`task_id`, `status`);
