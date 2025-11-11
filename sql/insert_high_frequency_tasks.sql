-- ========================================
-- 高频调度任务数据插入脚本
-- 说明：包含10条高频触发的调度任务
-- 频率：每天多次、每天固定时间、工作日等
-- ========================================

USE data_middle_station;

-- 插入高频调度任务数据
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

-- 1. 每天早上8点 - 销售数据日报
(
  '销售数据日报 - 每日早8点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '08:00:00',
  1,
  NULL,
  '{"to": "sales@company.com", "subject": "每日销售数据报告", "additionalContent": "请查收今日销售数据分析报告"}',
  '{"filename": "销售数据看板", "analyzeId": 1, "chartType": "bar", "analyzeName": "销售数据看板"}',
  'pending',
  '每天早上8点自动发送销售数据日报',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 2. 每天中午12点 - 运营数据午报
(
  '运营数据午报 - 每日中午12点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '12:00:00',
  1,
  NULL,
  '{"to": "operations@company.com", "subject": "每日运营数据午报", "additionalContent": "上午运营数据汇总"}',
  '{"filename": "大数据表格", "analyzeId": 5, "chartType": "table", "analyzeName": "大数据表格"}',
  'pending',
  '每天中午12点发送运营数据午报',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 3. 每天下午6点 - 数据日报汇总
(
  '数据日报汇总 - 每日下午6点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '18:00:00',
  1,
  NULL,
  '{"to": "management@company.com", "subject": "每日数据汇总报告", "additionalContent": "今日数据汇总分析"}',
  '{"filename": "销售数据看板", "analyzeId": 1, "chartType": "bar", "analyzeName": "销售数据看板"}',
  'pending',
  '每天下午6点发送数据日报汇总',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 4. 工作日早上9点 - 工作日数据报告
(
  '工作日数据报告 - 周一至周五早9点',
  NULL,
  'recurring',
  '[1,2,3,4,5]',
  '09:00:00',
  1,
  NULL,
  '{"to": "team@company.com", "subject": "工作日数据报告", "additionalContent": "工作日数据分析"}',
  '{"filename": "城市-月份-降雨量（柱状图）", "analyzeId": 2, "chartType": "bar", "analyzeName": "城市-月份-降雨量（柱状图）"}',
  'pending',
  '工作日（周一至周五）早上9点发送',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 5. 每天凌晨2点 - 数据备份报告
(
  '数据备份报告 - 每日凌晨2点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '02:00:00',
  1,
  NULL,
  '{"to": "devops@company.com", "subject": "每日数据备份报告", "additionalContent": "数据备份状态检查"}',
  '{"filename": "大数据表格", "analyzeId": 5, "chartType": "table", "analyzeName": "大数据表格"}',
  'pending',
  '每天凌晨2点执行数据备份并发送报告',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 6. 每周一早上10点 - 周报
(
  '周数据报告 - 每周一早10点',
  NULL,
  'recurring',
  '[1]',
  '10:00:00',
  1,
  NULL,
  '{"to": "management@company.com", "subject": "每周数据报告", "additionalContent": "上周数据汇总分析"}',
  '{"filename": "销售数据看板", "analyzeId": 1, "chartType": "bar", "analyzeName": "销售数据看板"}',
  'pending',
  '每周一早上10点发送周报',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 7. 每天早上7点 - 用户注册渠道分析
(
  '用户注册渠道分析 - 每日早7点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '07:00:00',
  1,
  NULL,
  '{"to": "marketing@company.com", "subject": "每日用户注册渠道分析", "additionalContent": "昨日用户注册渠道数据"}',
  '{"filename": "用户注册渠道分析（饼状图）", "analyzeId": 4, "chartType": "pie", "analyzeName": "用户注册渠道分析（饼状图）"}',
  'pending',
  '每天早上7点发送用户注册渠道分析',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 8. 每天晚上11点 - 日终数据核对
(
  '日终数据核对 - 每日晚11点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '23:00:00',
  1,
  NULL,
  '{"to": "finance@company.com", "subject": "日终数据核对报告", "additionalContent": "今日数据核对结果"}',
  '{"filename": "大数据表格", "analyzeId": 5, "chartType": "table", "analyzeName": "大数据表格"}',
  'pending',
  '每天晚上11点进行日终数据核对',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 9. 每天下午3点 - 气温数据报告
(
  '气温数据报告 - 每日下午3点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '15:00:00',
  1,
  NULL,
  '{"to": "weather@company.com", "subject": "每日气温数据报告", "additionalContent": "城市气温数据分析"}',
  '{"filename": "城市-月份-气温（折线图）", "analyzeId": 3, "chartType": "line", "analyzeName": "城市-月份-气温（折线图）"}',
  'pending',
  '每天下午3点发送气温数据报告',
  'admin',
  'admin',
  NOW(),
  NOW(),
  0,
  3
),

-- 10. 每天下午4点 - 降雨量数据报告
(
  '降雨量数据报告 - 每日下午4点',
  NULL,
  'recurring',
  '[0,1,2,3,4,5,6]',
  '16:00:00',
  1,
  NULL,
  '{"to": "weather@company.com", "subject": "每日降雨量数据报告", "additionalContent": "城市降雨量数据分析"}',
  '{"filename": "城市-月份-降雨量（柱状图）", "analyzeId": 2, "chartType": "bar", "analyzeName": "城市-月份-降雨量（柱状图）"}',
  'pending',
  '每天下午4点发送降雨量数据报告',
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
  recurring_time,
  next_execution_time,
  status,
  is_active
FROM scheduled_email_tasks
WHERE created_time >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
ORDER BY recurring_time;
