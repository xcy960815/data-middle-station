-- 任务执行日志表
-- 注意：此表依赖于 scheduled_email_tasks 表，请确保先创建 scheduled_email_tasks 表
CREATE TABLE IF NOT EXISTS `scheduled_email_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `task_id` int(11) NOT NULL COMMENT '任务ID',
  `execution_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  `status` enum('success','failed') NOT NULL COMMENT '执行状态',
  `message` text COMMENT '执行消息',
  `error_details` text COMMENT '错误详情',
  `email_message_id` varchar(255) COMMENT '邮件消息ID',
  `execution_duration` int(11) COMMENT '执行耗时(毫秒)',
  `created_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_execution_time` (`execution_time`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务执行日志表';

-- 添加外键约束（如果 scheduled_email_tasks 表已存在）
-- ALTER TABLE `scheduled_email_logs` ADD CONSTRAINT `fk_scheduled_email_logs_task_id` FOREIGN KEY (`task_id`) REFERENCES `scheduled_email_tasks` (`id`) ON DELETE CASCADE;

-- 添加索引优化查询性能
CREATE INDEX IF NOT EXISTS `idx_task_status` ON `scheduled_email_logs` (`task_id`, `status`);
