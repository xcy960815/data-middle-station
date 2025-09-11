-- 优化定时邮件任务的数据库索引
-- 用于提高查询性能和减少误差时间

-- 添加复合索引，优化按状态和时间查询
ALTER TABLE `scheduled_email_tasks`
ADD INDEX `idx_status_schedule_time` (`status`, `schedule_time`);

-- 添加时间范围查询索引
ALTER TABLE `scheduled_email_tasks`
ADD INDEX `idx_schedule_time_status` (`schedule_time`, `status`);

-- 添加创建时间索引（用于排序）
ALTER TABLE `scheduled_email_tasks`
ADD INDEX `idx_created_at_status` (`created_at`, `status`);

-- 优化执行日志表的查询性能
ALTER TABLE `scheduled_email_logs`
ADD INDEX `idx_task_id_execution_time` (`task_id`, `execution_time`);

-- 添加状态索引
ALTER TABLE `scheduled_email_logs`
ADD INDEX `idx_status_execution_time` (`status`, `execution_time`);

-- 分析表统计信息，优化查询计划
ANALYZE TABLE `scheduled_email_tasks`;
ANALYZE TABLE `scheduled_email_logs`;
