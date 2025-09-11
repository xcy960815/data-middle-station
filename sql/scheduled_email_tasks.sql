-- 定时邮件任务表
CREATE TABLE IF NOT EXISTS `scheduled_email_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(255) NOT NULL COMMENT '任务名称',
  `schedule_time` datetime NOT NULL COMMENT '计划执行时间',
  `email_config` json NOT NULL COMMENT '邮件配置(JSON格式)',
  `analyse_options` json NOT NULL COMMENT '图表数据(JSON格式)',
  `status` enum('pending','running','completed','failed','cancelled') NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  `remark` text COMMENT '备注说明',
  `created_by` varchar(100) NOT NULL COMMENT '创建人',
  `updated_by` varchar(100) NOT NULL COMMENT '更新人',
  `created_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `executed_time` timestamp NULL DEFAULT NULL COMMENT '执行时间',
  `error_message` text COMMENT '错误信息',
  `retry_count` int(11) NOT NULL DEFAULT 0 COMMENT '重试次数',
  `max_retries` int(11) NOT NULL DEFAULT 3 COMMENT '最大重试次数',
  PRIMARY KEY (`id`),
  KEY `idx_schedule_time` (`schedule_time`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务表';

-- 添加索引优化查询性能
CREATE INDEX `idx_task_name` ON `scheduled_email_tasks` (`task_name`);
CREATE INDEX `idx_status_schedule_time` ON `scheduled_email_tasks` (`status`, `schedule_time`);
