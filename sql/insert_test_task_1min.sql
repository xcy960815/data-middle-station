-- ========================================
-- 高频测试任务 - 支持每N分钟执行
-- 用途：本地开发测试
-- 说明：使用 */N 格式表示每N分钟执行一次
-- ========================================

USE data_middle_station;

-- 删除旧的测试任务（如果存在）
DELETE FROM `scheduled_email_tasks` WHERE task_name LIKE '%测试任务%';

-- 插入高频测试任务
INSERT INTO `scheduled_email_tasks` (
  `task_name`, 
  `schedule_time`, 
  `task_type`, 
  `recurring_days`, 
  `recurring_time`, 
  `is_active`, 
  `next_execution_time`, 
  `email_config`, 
  `analyze_options`, 
  `status`, 
  `remark`, 
  `created_by`, 
  `updated_by`, 
  `created_time`, 
  `updated_time`, 
  `retry_count`, 
  `max_retries`
) VALUES
-- 每1分钟执行一次
(
  '测试任务 - 每1分钟',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '*/1',
  1,
  NULL,
  '{"to": "test@company.com", "subject": "测试任务 - 每1分钟执行", "additionalContent": "这是一个高频测试任务"}',
  '{"filename": "销售数据看板", "analyzeId": 1, "chartType": "bar", "analyzeName": "销售数据看板"}',
  'pending',
  '测试任务：每1分钟执行一次，用于本地开发测试',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),
-- 每2分钟执行一次
(
  '测试任务 - 每2分钟',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '*/2',
  1,
  NULL,
  '{"to": "test@company.com", "subject": "测试任务 - 每2分钟执行", "additionalContent": "这是一个高频测试任务"}',
  '{"filename": "城市-月份-降雨量（柱状图）", "analyzeId": 2, "chartType": "bar", "analyzeName": "城市-月份-降雨量（柱状图）"}',
  'pending',
  '测试任务：每2分钟执行一次',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),
-- 每5分钟执行一次
(
  '测试任务 - 每5分钟',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '*/5',
  1,
  NULL,
  '{"to": "test@company.com", "subject": "测试任务 - 每5分钟执行", "additionalContent": "这是一个高频测试任务"}',
  '{"filename": "城市-月份-气温（折线图）", "analyzeId": 3, "chartType": "line", "analyzeName": "城市-月份-气温（折线图）"}',
  'pending',
  '测试任务：每5分钟执行一次',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
);

-- 查询插入结果
SELECT 
  id,
  task_name,
  task_type,
  recurring_days,
  recurring_time,
  next_execution_time,
  status,
  is_active,
  remark
FROM scheduled_email_tasks
WHERE task_name LIKE '%测试任务%'
ORDER BY id DESC
LIMIT 1;
