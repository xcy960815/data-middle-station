-- 定时邮件任务表（支持定时任务和重复任务）
CREATE TABLE IF NOT EXISTS `scheduled_email_tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(255) NOT NULL COMMENT '任务名称',
  `schedule_time` datetime NULL COMMENT '计划执行时间（定时任务使用）',
  `task_type` enum('scheduled','recurring') NOT NULL DEFAULT 'scheduled' COMMENT '任务类型：定时任务|重复任务',
  `recurring_days` json NULL COMMENT '重复的星期几 [0,1,2,3,4,5,6]，0=周日',
  `recurring_time` time NULL COMMENT '每日执行时间 HH:mm',
  `is_active` boolean NOT NULL DEFAULT TRUE COMMENT '是否启用任务',
  `next_execution_time` datetime NULL COMMENT '下次执行时间（重复任务使用）',
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
  KEY `idx_created_time` (`created_time`),
  KEY `idx_task_type` (`task_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_next_execution_time` (`next_execution_time`),
  KEY `idx_recurring_active` (`task_type`, `is_active`, `next_execution_time`),
  -- 约束检查：定时任务必须有schedule_time，重复任务必须有recurring_days和recurring_time
  CONSTRAINT `chk_scheduled_task` CHECK (
    (task_type = 'scheduled' AND schedule_time IS NOT NULL) OR
    (task_type = 'recurring' AND recurring_days IS NOT NULL AND recurring_time IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务表（支持定时任务和重复任务）';

-- 添加索引优化查询性能
CREATE INDEX `idx_task_name` ON `scheduled_email_tasks` (`task_name`);
CREATE INDEX `idx_status_schedule_time` ON `scheduled_email_tasks` (`status`, `schedule_time`);
