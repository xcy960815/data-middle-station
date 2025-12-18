/*
 Navicat Premium Dump SQL

 Source Server         : dms-service-local
 Source Server Type    : MySQL
 Source Server Version : 80402 (8.4.2)
 Source Host           : localhost:3310
 Source Schema         : data_middle_station

 Target Server Type    : MySQL
 Target Server Version : 80402 (8.4.2)
 File Encoding         : 65001

 Date: 18/12/2025 16:31:08
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for scheduled_email_tasks
-- ----------------------------
DROP TABLE IF EXISTS `scheduled_email_tasks`;
CREATE TABLE `scheduled_email_tasks` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `task_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务名称',
  `schedule_time` datetime DEFAULT NULL COMMENT '计划执行时间（定时任务使用）',
  `task_type` enum('scheduled','recurring') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'scheduled' COMMENT '任务类型：定时任务|重复任务',
  `recurring_days` json DEFAULT NULL COMMENT '重复的星期几 [0,1,2,3,4,5,6]，0=周日',
  `recurring_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '重复执行时间，支持 HH:mm[:ss] 或 "*/N" 分钟高频格式',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '是否启用任务',
  `next_execution_time` datetime DEFAULT NULL COMMENT '下次执行时间（重复任务使用）',
  `email_config` json NOT NULL COMMENT '邮件配置(JSON格式)',
  `analyze_options` json NOT NULL COMMENT '图表数据(JSON格式)',
  `status` enum('pending','running','completed','failed','cancelled') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT '任务状态',
  `remark` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '备注说明',
  `created_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '创建人',
  `updated_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '更新人',
  `created_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `executed_time` timestamp NULL DEFAULT NULL COMMENT '执行时间',
  `error_message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '错误信息',
  `retry_count` int NOT NULL DEFAULT '0' COMMENT '重试次数',
  `max_retries` int NOT NULL DEFAULT '3' COMMENT '最大重试次数',
  PRIMARY KEY (`id`),
  KEY `idx_schedule_time` (`schedule_time`),
  KEY `idx_status` (`status`),
  KEY `idx_created_time` (`created_time`),
  KEY `idx_task_type` (`task_type`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_next_execution_time` (`next_execution_time`),
  KEY `idx_recurring_active` (`task_type`,`is_active`,`next_execution_time`),
  KEY `idx_task_name` (`task_name`),
  KEY `idx_status_schedule_time` (`status`,`schedule_time`),
  CONSTRAINT `chk_scheduled_task` CHECK ((((`task_type` = _utf8mb4'scheduled') and (`schedule_time` is not null)) or ((`task_type` = _utf8mb4'recurring') and (`recurring_days` is not null) and (`recurring_time` is not null))))
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务表（支持定时任务和重复任务）';

-- Records of scheduled_email_tasks
-- ----------------------------
BEGIN;
-- 1. 一次性定时任务示例（未来时间，pending，可被调度器加载）
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(1, '【示例】一次性销售报表（5 分钟后触发）', '2025-12-18 16:40:00', 'scheduled', NULL, NULL, 1, '2025-12-18 16:40:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"一次性销售报表\", \"additionalContent\": \"这是一次性触发的示例任务\"}',
 '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}',
 'pending', '用于测试一次性定时任务（scheduled）是否被正常调度并发送邮件', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 2. 每日重复任务（柱状图），每天早上 9 点，周一到周日
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(2, '【示例】每日销售数据日报（柱状图）', NULL, 'recurring', '[0,1,2,3,4,5,6]', '09:00:00', 1, '2025-12-19 09:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日销售数据日报\", \"additionalContent\": \"每天早上 9 点发送销售数据柱状图\"}',
 '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}',
 'pending', '用于测试 recurring 类型任务（bar 图表）是否按天调度', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 3. 每日重复任务（折线图），每天 15:00，周一到周五
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(3, '【示例】工作日气温数据报告（折线图）', NULL, 'recurring', '[1,2,3,4,5]', '15:00:00', 1, '2025-12-19 15:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"工作日气温数据报告\", \"additionalContent\": \"工作日 15:00 发送气温折线图\"}',
 '{\"filename\": \"城市-月份-气温（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市-月份-气温（折线图）\"}',
 'pending', '用于测试 recurring 类型任务（line 图表）在工作日定时执行', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 4. 每日重复任务（饼图），每天早上 8 点，周一到周日
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(4, '【示例】用户注册渠道分析（饼图）', NULL, 'recurring', '[0,1,2,3,4,5,6]', '08:00:00', 1, '2025-12-19 08:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"用户注册渠道分析\", \"additionalContent\": \"每天 8 点发送用户注册渠道饼图\"}',
 '{\"filename\": \"用户注册渠道分析（饼状图）\", \"analyzeId\": 4, \"chartType\": \"pie\", \"analyzeName\": \"用户注册渠道分析（饼状图）\"}',
 'pending', '用于测试 recurring 类型任务（pie 图表）每天早上执行', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 5. 日频任务示例（每天 10:00 执行一次，折线图）
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(5, '【示例】日频任务 - 10:00 销售趋势快照（折线图）', NULL, 'recurring', '[0,1,2,3,4,5,6]', '10:00:00', 1, '2025-12-19 10:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日销售趋势快照\", \"additionalContent\": \"每天 10:00 发送一次，用于常规链路验证\"}',
 '{\"filename\": \"城市-月份-气温（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市-月份-气温（折线图）\"}',
 'pending', '日频验证（10:00）', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 6. 日频任务示例（每天 11:00，柱状图，用于并发验证）
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(6, '【示例】日频任务 - 11:00 并发验证（柱状图）', NULL, 'recurring', '[0,1,2,3,4,5,6]', '11:00:00', 1, '2025-12-19 11:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日并发验证（柱状图）\", \"additionalContent\": \"每天 11:00 发送一次，用于常规并发验证\"}',
 '{\"filename\": \"城市-月份-降雨量（柱状图）\", \"analyzeId\": 2, \"chartType\": \"bar\", \"analyzeName\": \"城市-月份-降雨量（柱状图）\"}',
 'pending', '日频验证（11:00）', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 7. 日频任务（每天 12:00，销售数据看板 - 柱状图，覆盖 analyzeId=1）
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(7, '【示例】日频任务 - 销售数据看板（12:00 柱状图）', NULL, 'recurring', '[0,1,2,3,4,5,6]', '12:00:00', 1, '2025-12-19 12:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日销售数据看板\", \"additionalContent\": \"每天 12:00 发送一次销售数据柱状图\"}',
 '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}',
 'pending', '日频验证（12:00）覆盖 analyzeId=1', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

-- 8. 日频任务（每天 13:00，用户注册渠道 - 饼图，覆盖 analyzeId=4）
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES
(8, '【示例】日频任务 - 用户注册渠道（13:00 饼图）', NULL, 'recurring', '[0,1,2,3,4,5,6]', '13:00:00', 1, '2025-12-19 13:00:00',
 '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日用户注册渠道分析\", \"additionalContent\": \"每天 13:00 发送一次用户渠道饼图\"}',
 '{\"filename\": \"用户注册渠道分析（饼状图）\", \"analyzeId\": 4, \"chartType\": \"pie\", \"analyzeName\": \"用户注册渠道分析（饼状图）\"}',
 'pending', '日频验证（13:00）覆盖 analyzeId=4', 'admin', 'admin',
 '2025-12-18 16:30:00', '2025-12-18 16:30:00', NULL, NULL, 0, 3);

COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
