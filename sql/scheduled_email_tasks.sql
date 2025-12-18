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

 Date: 06/12/2025 23:16:07
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
  `recurring_time` time DEFAULT NULL COMMENT '每日执行时间 HH:mm',
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

-- ----------------------------
-- Records of scheduled_email_tasks
-- ----------------------------
BEGIN;
-- INSERT id 1 removed: chartType = 'table'
-- INSERT id 2 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (3, '销售数据日报 - 每日早8点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '08:00:00', 1, '2025-11-12 08:00:00', '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日销售数据报告\", \"additionalContent\": \"请查收今日销售数据分析报告\"}', '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}', 'completed', '每天早上8点自动发送销售数据日报', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-12 08:00:14', '2025-11-12 08:00:14', NULL, 0, 3);
-- INSERT id 4 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (5, '数据日报汇总 - 每日下午6点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '18:00:00', 1, '2025-11-12 18:00:00', '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日数据汇总报告\", \"additionalContent\": \"今日数据汇总分析\"}', '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}', 'completed', '每天下午6点发送数据日报汇总', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-25 15:37:34', '2025-11-15 01:26:29', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (6, '工作日数据报告 - 周一至周五早9点', NULL, 'recurring', '[1, 2, 3, 4, 5]', '09:00:00', 1, '2025-11-12 09:00:00', '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"工作日数据报告\", \"additionalContent\": \"工作日数据分析\"}', '{\"filename\": \"城市-月份-降雨量（柱状图）\", \"analyzeId\": 2, \"chartType\": \"bar\", \"analyzeName\": \"城市-月份-降雨量（柱状图）\"}', 'completed', '工作日（周一至周五）早上9点发送', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-25 15:37:39', '2025-11-12 09:12:29', NULL, 0, 3);
-- INSERT id 7 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (8, '周数据报告 - 每周一早10点', NULL, 'recurring', '[0,1,2,3,4,5,6]', '*/1', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每周数据报告\", \"additionalContent\": \"上周数据汇总分析\"}', '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}', 'pending', '每周一早上10点发送周报（高频）', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-17 10:00:00', '2025-11-17 10:00:00', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (9, '用户注册渠道分析 - 每日早7点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '07:00:00', 1, '2025-11-12 07:00:00', '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日用户注册渠道分析\", \"additionalContent\": \"昨日用户注册渠道数据\"}', '{\"filename\": \"用户注册渠道分析（饼状图）\", \"analyzeId\": 4, \"chartType\": \"pie\", \"analyzeName\": \"用户注册渠道分析（饼状图）\"}', 'completed', '每天早上7点发送用户注册渠道分析', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-12 07:00:00', '2025-11-12 07:00:00', NULL, 0, 3);
-- INSERT id 10 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (11, '气温数据报告 - 每日下午3点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '15:00:00', 1, '2025-11-12 15:00:00', '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日气温数据报告\", \"additionalContent\": \"城市气温数据分析\"}', '{\"filename\": \"城市-月份-气温（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市-月份-气温（折线图）\"}', 'completed', '每天下午3点发送气温数据报告', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-16 15:00:00', '2025-11-16 15:00:00', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (12, '降雨量数据报告 - 每日下午4点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '16:00:00', 1, '2025-11-12 16:00:00', '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日降雨量数据报告\", \"additionalContent\": \"城市降雨量数据分析\"}', '{\"filename\": \"城市-月份-降雨量（柱状图）\", \"analyzeId\": 2, \"chartType\": \"bar\", \"analyzeName\": \"城市-月份-降雨量（柱状图）\"}', 'completed', '每天下午4点发送降雨量数据报告', 'admin', 'admin', '2025-11-11 23:37:20', '2025-11-16 16:00:00', '2025-11-16 16:00:00', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (13, '销售数据日报 - 每日早8点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '08:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日销售数据报告\", \"additionalContent\": \"请查收今日销售数据分析报告\"}', '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}', 'completed', '每天早上8点自动发送销售数据日报', 'admin', 'admin', '2025-11-11 23:41:07', '2025-11-12 08:00:14', '2025-11-12 08:00:14', NULL, 0, 3);
-- INSERT id 14 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (15, '数据日报汇总 - 每日下午6点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '18:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日数据汇总报告\", \"additionalContent\": \"今日数据汇总分析\"}', '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}', 'completed', '每天下午6点发送数据日报汇总', 'admin', 'system', '2025-11-11 23:41:07', '2025-11-15 18:11:04', '2025-11-15 18:11:04', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (16, '工作日数据报告 - 周一至周五早9点', NULL, 'recurring', '[1, 2, 3, 4, 5]', '09:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"工作日数据报告\", \"additionalContent\": \"工作日数据分析\"}', '{\"filename\": \"城市-月份-降雨量（柱状图）\", \"analyzeId\": 2, \"chartType\": \"bar\", \"analyzeName\": \"城市-月份-降雨量（柱状图）\"}', 'completed', '工作日（周一至周五）早上9点发送', 'admin', 'admin', '2025-11-11 23:41:07', '2025-11-12 09:12:29', '2025-11-12 09:12:29', NULL, 0, 3);
-- INSERT id 17 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (18, '周数据报告 - 每周一早10点', NULL, 'recurring', '[1]', '10:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每周数据报告\", \"additionalContent\": \"上周数据汇总分析\"}', '{\"filename\": \"销售数据看板\", \"analyzeId\": 1, \"chartType\": \"bar\", \"analyzeName\": \"销售数据看板\"}', 'completed', '每周一早上10点发送周报', 'admin', 'admin', '2025-11-11 23:41:07', '2025-11-24 10:00:00', '2025-11-24 10:00:00', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (19, '用户注册渠道分析 - 每日早7点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '07:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日用户注册渠道分析\", \"additionalContent\": \"昨日用户注册渠道数据\"}', '{\"filename\": \"用户注册渠道分析（饼状图）\", \"analyzeId\": 4, \"chartType\": \"pie\", \"analyzeName\": \"用户注册渠道分析（饼状图）\"}', 'completed', '每天早上7点发送用户注册渠道分析', 'admin', 'admin', '2025-11-11 23:41:07', '2025-11-12 07:00:00', '2025-11-12 07:00:00', NULL, 0, 3);
-- INSERT id 20 removed: chartType = 'table'
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (21, '气温数据报告 - 每日下午3点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '15:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日气温数据报告\", \"additionalContent\": \"城市气温数据分析\"}', '{\"filename\": \"城市-月份-气温（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市-月份-气温（折线图）\"}', 'completed', '每天下午3点发送气温数据报告', 'admin', 'admin', '2025-11-11 23:41:07', '2025-11-16 15:00:00', '2025-11-16 15:00:00', NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (22, '降雨量数据报告 - 每日下午4点', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '16:00:00', 1, NULL, '{\"to\": \"xinxin87v5@icloud.com\", \"subject\": \"每日降雨量数据报告\", \"additionalContent\": \"城市降雨量数据分析\"}', '{\"filename\": \"城市-月份-降雨量（柱状图）\", \"analyzeId\": 2, \"chartType\": \"bar\", \"analyzeName\": \"城市-月份-降雨量（柱状图）\"}', 'completed', '每天下午4点发送降雨量数据报告', 'admin', 'admin', '2025-11-11 23:41:07', '2025-11-16 16:00:00', '2025-11-16 16:00:00', NULL, 0, 3);
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
