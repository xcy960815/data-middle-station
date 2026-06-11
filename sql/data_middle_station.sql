/*
 Navicat Premium Dump SQL

 Source Server         : dms-mysql-main-container
 Source Server Type    : MySQL
 Source Server Version : 80402 (8.4.2)
 Source Host           : 100.116.149.47:3310
 Source Schema         : data_middle_station

 Target Server Type    : MySQL
 Target Server Version : 80402 (8.4.2)
 File Encoding         : 65001

 Date: 12/06/2026 00:52:22
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for analyze
-- ----------------------------
DROP TABLE IF EXISTS `analyze`;
CREATE TABLE `analyze` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `analyze_name` varchar(255) DEFAULT NULL COMMENT '分析名称',
  `view_count` int unsigned DEFAULT '0' COMMENT '访问次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `current_config_id` bigint unsigned DEFAULT NULL COMMENT '当前生效的分析配置版本ID',
  `analyze_desc` varchar(255) DEFAULT NULL COMMENT '分析描述',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表信息表';

-- ----------------------------
-- Records of analyze
-- ----------------------------
BEGIN;
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (1, '运营平台活跃用户与收入分析', 135, '2026-06-10 10:00:00', 'admin', '2026-06-12 00:48:36', 'admin', 212, '按平台维度查看活跃用户数和收入柱状图', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (3, '城市月度气温趋势（折线图）', 106, '2026-06-10 10:00:00', 'admin', '2026-06-12 00:18:18', 'admin', 210, '按月份查看各城市月均气温折线', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (102, '库存周转效率分析（折线图）', 60, '2026-06-10 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 203, '按品类查看各仓库周转天数折线', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (104, '营销活动转化明细（表格）', 45, '2026-06-10 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 204, '活动×渠道的曝光、点击、转化和转化率明细', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (105, 'API性能监控趋势（折线图）', 67, '2026-06-10 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 205, '按日期和接口查看API响应时间与错误率趋势', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (106, '部门收支对比分析（柱状图）', 53, '2026-06-10 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 206, '按月份和部门查看收入与支出对比柱状图', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (107, '电商品类销售与毛利分析（JOIN）', 112, '2026-06-10 10:00:00', 'admin', '2026-06-11 18:33:39', 'admin', 207, '订单关联商品目录，按品类分析销售额与毛利', 0);
INSERT INTO `analyze` (`id`, `analyze_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `current_config_id`, `analyze_desc`, `is_deleted`) VALUES (108, 'HR部门薪资绩效分析（JOIN）', 82, '2026-06-10 10:00:00', 'admin', '2026-06-11 23:38:14', 'admin', 208, '员工关联部门，按部门分析薪资分布与绩效评分', 0);
COMMIT;

-- ----------------------------
-- Table structure for analyze_alarm_logs
-- ----------------------------
DROP TABLE IF EXISTS `analyze_alarm_logs`;
CREATE TABLE `analyze_alarm_logs` (
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表报警执行日志表';

-- ----------------------------
-- Records of analyze_alarm_logs
-- ----------------------------
BEGIN;
INSERT INTO `analyze_alarm_logs` (`id`, `alarm_id`, `execute_time`, `is_triggered`, `trigger_detail`, `notify_status`, `error_message`) VALUES (1, 1, '2026-06-12 00:00:00', 1, '{\"date\": \"2026-06-11\", \"active_users\": 1050}', 'success', '');
INSERT INTO `analyze_alarm_logs` (`id`, `alarm_id`, `execute_time`, `is_triggered`, `trigger_detail`, `notify_status`, `error_message`) VALUES (2, 1, '2026-06-12 00:01:00', 0, NULL, 'skipped', '');
INSERT INTO `analyze_alarm_logs` (`id`, `alarm_id`, `execute_time`, `is_triggered`, `trigger_detail`, `notify_status`, `error_message`) VALUES (3, 2, '2026-06-12 00:00:00', 1, '{\"revenue\": 4500}', 'failed', 'Network Timeout when calling webhook');
INSERT INTO `analyze_alarm_logs` (`id`, `alarm_id`, `execute_time`, `is_triggered`, `trigger_detail`, `notify_status`, `error_message`) VALUES (4, 2, '2026-06-11 23:00:00', 0, NULL, 'skipped', '');
COMMIT;

-- ----------------------------
-- Table structure for analyze_alarms
-- ----------------------------
DROP TABLE IF EXISTS `analyze_alarms`;
CREATE TABLE `analyze_alarms` (
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='图表报警规则表';

-- ----------------------------
-- Records of analyze_alarms
-- ----------------------------
BEGIN;
INSERT INTO `analyze_alarms` (`id`, `analyze_id`, `alarm_name`, `is_active`, `cron_expression`, `conditions`, `notification_config`, `alarm_strategy`, `last_triggered_time`, `created_by`, `updated_by`, `created_time`, `updated_time`) VALUES (1, 1, '测试报警：活跃用户激增', 1, '* * * * *', '[{\"operator\": \">\", \"measureId\": \"active_users\", \"threshold\": 1000}]', '{\"emails\": [\"test@example.com\"], \"webhookUrl\": \"\"}', 'always', NULL, 'system', 'system', '2026-06-12 00:25:32', '2026-06-12 00:25:32');
INSERT INTO `analyze_alarms` (`id`, `analyze_id`, `alarm_name`, `is_active`, `cron_expression`, `conditions`, `notification_config`, `alarm_strategy`, `last_triggered_time`, `created_by`, `updated_by`, `created_time`, `updated_time`) VALUES (2, 1, '收入跌破预警', 1, '0 * * * *', '[{\"operator\": \"<\", \"measureId\": \"revenue\", \"threshold\": 5000}]', '{\"emails\": [\"manager@example.com\"], \"webhookUrl\": \"https://webhook.test/api\"}', 'once_per_day', NULL, 'admin', 'admin', '2026-06-12 00:25:32', '2026-06-12 00:25:32');
INSERT INTO `analyze_alarms` (`id`, `analyze_id`, `alarm_name`, `is_active`, `cron_expression`, `conditions`, `notification_config`, `alarm_strategy`, `last_triggered_time`, `created_by`, `updated_by`, `created_time`, `updated_time`) VALUES (3, 105, '异常错误率检测', 0, '0 9 * * *', '[{\"operator\": \">=\", \"measureId\": \"error_rate\", \"threshold\": 0.05}]', '{\"emails\": [\"devops@example.com\"], \"webhookUrl\": \"\"}', 'only_state_change', NULL, 'developer', 'developer', '2026-06-12 00:25:32', '2026-06-12 00:25:32');
COMMIT;

-- ----------------------------
-- Table structure for analyze_config
-- ----------------------------
DROP TABLE IF EXISTS `analyze_config`;
CREATE TABLE `analyze_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `analyze_id` bigint unsigned NOT NULL COMMENT '分析ID',
  `version_no` int unsigned NOT NULL COMMENT '版本号',
  `dataset_id` bigint unsigned DEFAULT NULL COMMENT '数据集ID',
  `measures` json DEFAULT NULL COMMENT '值/指标配置(JSON格式)',
  `filters` json DEFAULT NULL COMMENT '过滤条件(JSON格式)',
  `dimensions` json DEFAULT NULL COMMENT '分组/维度配置(JSON格式)',
  `orders` json DEFAULT NULL COMMENT '排序配置(JSON格式)',
  `chart_type` varchar(50) DEFAULT NULL COMMENT '图表类型',
  `common_chart_config` json DEFAULT NULL COMMENT '公共图表配置(JSON格式)',
  `private_chart_config` json DEFAULT NULL COMMENT '各图表类型配置(JSON格式)',
  `change_note` varchar(255) DEFAULT NULL COMMENT '版本说明',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_analyze_version` (`analyze_id`,`version_no`),
  KEY `idx_analyze_config_analyze_id` (`analyze_id`),
  KEY `idx_analyze_config_create_time` (`create_time`),
  KEY `idx_analyze_config_dataset_id` (`dataset_id`)
) ENGINE=InnoDB AUTO_INCREMENT=213 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分析配置历史版本表';

-- ----------------------------
-- Records of analyze_config
-- ----------------------------
BEGIN;
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (201, 1, 1, 9001, '[{\"columnName\": \"active_users\", \"columnType\": \"int\", \"displayName\": \"活跃用户数\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"活跃用户数\"}, {\"columnName\": \"revenue\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"收入(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"收入(元)\"}]', '[]', '[{\"columnName\": \"platform\", \"columnType\": \"varchar(20)\", \"displayName\": \"平台\", \"columnComment\": \"平台\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'interval', '{\"limit\": 1000, \"analyzeDesc\": \"按平台维度查看活跃用户数和收入柱状图\", \"datasetName\": \"运营分析数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"platform\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"active_users\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"revenue\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": true}}', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (202, 3, 1, 9004, '[{\"columnName\": \"temperature\", \"columnType\": \"decimal(4,1)\", \"displayName\": \"月均气温\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"月均气温\"}]', '[]', '[{\"columnName\": \"month\", \"columnType\": \"varchar(3)\", \"displayName\": \"月份\", \"columnComment\": \"月份\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"columnName\": \"city\", \"columnType\": \"varchar(32)\", \"displayName\": \"城市名称\", \"columnComment\": \"城市名称\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'line', '{\"limit\": 1000, \"analyzeDesc\": \"按月份查看各城市月均气温折线\", \"datasetName\": \"城市气温数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": true, \"showLabel\": true, \"showPoint\": true, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"month\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"city\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"temperature\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": false}}', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (203, 102, 1, 9002, '[{\"columnName\": \"turnover_days\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"周转天数\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"周转天数\"}]', '[]', '[{\"columnName\": \"stat_month\", \"columnType\": \"varchar(20)\", \"displayName\": \"统计月份\", \"columnComment\": \"统计月份\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"columnName\": \"warehouse\", \"columnType\": \"varchar(50)\", \"displayName\": \"仓库\", \"columnComment\": \"仓库\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'line', '{\"limit\": 1000, \"analyzeDesc\": \"按品类查看各仓库周转天数折线\", \"datasetName\": \"库存周转数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": true, \"showLabel\": true, \"showPoint\": true, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"stat_month\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"warehouse\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"turnover_days\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": false}}', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (204, 104, 1, 9003, '[{\"columnName\": \"impressions\", \"columnType\": \"int\", \"displayName\": \"曝光数\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"曝光数\"}, {\"columnName\": \"clicks\", \"columnType\": \"int\", \"displayName\": \"点击数\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"点击数\"}, {\"columnName\": \"conversions\", \"columnType\": \"int\", \"displayName\": \"转化数\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"转化数\"}, {\"columnName\": \"cost\", \"columnType\": \"decimal(12,2)\", \"displayName\": \"费用(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"费用(元)\"}, {\"columnName\": \"conversion_rate\", \"columnType\": \"decimal(8,4)\", \"displayName\": \"转化率\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"转化率\"}]', '[]', '[{\"columnName\": \"campaign_name\", \"columnType\": \"varchar(100)\", \"displayName\": \"活动名称\", \"columnComment\": \"活动名称\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"columnName\": \"channel\", \"columnType\": \"varchar(50)\", \"displayName\": \"渠道\", \"columnComment\": \"渠道\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'table', '{\"limit\": 1000, \"analyzeDesc\": \"活动×渠道的曝光、点击、转化和转化率明细\", \"datasetName\": \"营销转化数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"campaign_name\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"channel\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"impressions\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"clicks\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"conversions\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"cost\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"conversion_rate\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": false}}', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (205, 105, 1, 9005, '[{\"columnName\": \"response_time_ms\", \"columnType\": \"int\", \"displayName\": \"平均响应时间(ms)\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"平均响应时间(ms)\"}, {\"columnName\": \"error_rate\", \"columnType\": \"decimal(5,2)\", \"displayName\": \"错误率(%)\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"错误率(%)\"}]', '[]', '[{\"columnName\": \"stat_date\", \"columnType\": \"date\", \"displayName\": \"统计日期\", \"columnComment\": \"统计日期\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"columnName\": \"endpoint\", \"columnType\": \"varchar(100)\", \"displayName\": \"API接口\", \"columnComment\": \"API接口\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'line', '{\"limit\": 1000, \"analyzeDesc\": \"按日期和接口查看API响应时间与错误率趋势折线\", \"datasetName\": \"API性能监控数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": true, \"showLabel\": true, \"showPoint\": true, \"autoDualAxis\": true, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"stat_date\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"endpoint\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"response_time_ms\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"error_rate\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": false}}', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (206, 106, 1, 9006, '[{\"columnName\": \"income\", \"columnType\": \"decimal(12,2)\", \"displayName\": \"收入(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"收入(元)\"}, {\"columnName\": \"expense\", \"columnType\": \"decimal(12,2)\", \"displayName\": \"支出(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"支出(元)\"}, {\"columnName\": \"profit\", \"columnType\": \"decimal(12,2)\", \"displayName\": \"利润(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"利润(元)\"}]', '[]', '[{\"columnName\": \"stat_month\", \"columnType\": \"varchar(10)\", \"displayName\": \"统计月份\", \"columnComment\": \"统计月份\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"columnName\": \"department\", \"columnType\": \"varchar(50)\", \"displayName\": \"部门\", \"columnComment\": \"部门\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'interval', '{\"limit\": 1000, \"analyzeDesc\": \"按月份和部门查看收入与支出对比柱状图\", \"datasetName\": \"部门财务收支数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"stat_month\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"department\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"income\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"expense\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"profit\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"grouped\", \"chartType\": \"interval\", \"showLabel\": true}}', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (207, 107, 1, 9007, '[{\"columnName\": \"amount\", \"columnType\": \"decimal(12,2)\", \"displayName\": \"订单金额(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"订单金额(元)\"}, {\"columnName\": \"gross_profit\", \"columnType\": \"decimal(12,2)\", \"displayName\": \"毛利(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"毛利(元)\"}]', '[]', '[{\"columnName\": \"category\", \"columnType\": \"varchar(50)\", \"displayName\": \"商品品类\", \"columnComment\": \"商品品类\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'interval', '{\"limit\": 1000, \"analyzeDesc\": \"订单关联商品目录，按品类分析销售额与毛利\", \"datasetName\": \"电商订单关联数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"category\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"amount\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"gross_profit\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"grouped\", \"chartType\": \"interval\", \"showLabel\": true}}', '初始化版本-JOIN分析', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (208, 108, 1, 9008, '[{\"columnName\": \"salary\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"月薪(元)\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"月薪(元)\"}, {\"columnName\": \"performance_score\", \"columnType\": \"decimal(3,1)\", \"displayName\": \"绩效评分\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"绩效评分\"}]', '[]', '[{\"columnName\": \"dept_name\", \"columnType\": \"varchar(50)\", \"displayName\": \"部门名称\", \"columnComment\": \"部门名称\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'interval', '{\"limit\": 1000, \"analyzeDesc\": \"员工关联部门，按部门分析平均薪资与绩效评分\", \"datasetName\": \"HR员工关联数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": true, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"dept_name\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"salary\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"performance_score\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"grouped\", \"chartType\": \"interval\", \"showLabel\": true}}', '初始化版本-JOIN分析', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (209, 3, 2, 9004, '[{\"columnName\": \"temperature\", \"columnType\": \"decimal(4,1)\", \"displayName\": \"月均气温\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"月均气温\"}]', '[]', '[{\"columnName\": \"month\", \"columnType\": \"varchar(3)\", \"displayName\": \"月份\", \"columnComment\": \"月份\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"fieldRole\": \"dimension\", \"columnName\": \"city\", \"columnType\": \"varchar(32)\", \"displayName\": \"城市名称\", \"columnComment\": \"城市名称\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": true}}}]', '[]', 'interval', '{\"limit\": 1000, \"analyzeDesc\": \"按月份查看各城市月均气温折线\", \"datasetName\": \"城市气温数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"line\": {\"smooth\": true, \"showLabel\": true, \"showPoint\": true, \"autoDualAxis\": false, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"month\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"city\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"temperature\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": false}}', NULL, '2026-06-11 18:39:06', 'admin', '2026-06-11 18:39:06', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (210, 3, 3, 9004, '[{\"columnName\": \"temperature\", \"columnType\": \"decimal(4,1)\", \"displayName\": \"月均气温\", \"measureRule\": {\"aggregation\": \"avg\"}, \"columnComment\": \"月均气温\"}]', '[]', '[{\"columnName\": \"month\", \"columnType\": \"varchar(3)\", \"displayName\": \"月份\", \"columnComment\": \"月份\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}, {\"fieldRole\": \"dimension\", \"columnName\": \"city\", \"columnType\": \"varchar(32)\", \"displayName\": \"城市名称\", \"columnComment\": \"城市名称\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": true}}}]', '[]', 'line', '{\"limit\": 1000, \"analyzeDesc\": \"按月份查看各城市月均气温折线\", \"datasetName\": \"城市气温数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"area\": {\"smooth\": true, \"opacity\": 0.3, \"showLabel\": false, \"showPoint\": false, \"horizontalBar\": false}, \"line\": {\"smooth\": true, \"showLabel\": true, \"showPoint\": true, \"autoDualAxis\": false, \"horizontalBar\": false}, \"combo\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": true, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"month\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"city\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"temperature\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"funnel\": {\"sort\": \"descending\", \"showLabel\": true, \"funnelAlign\": \"center\", \"showPercentage\": true}, \"kpiCard\": {\"showSparkline\": true, \"comparisonType\": \"chain\", \"showComparison\": true}, \"scatter\": {\"showLabel\": false, \"symbolSize\": 10, \"showTrendLine\": false}, \"stacked\": {\"smooth\": false, \"showLabel\": false, \"displayMode\": \"stackBar\", \"horizontalBar\": false, \"showPercentage\": false}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": false}}', NULL, '2026-06-11 23:48:45', 'admin', '2026-06-11 23:48:45', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (211, 1, 2, 9001, '[{\"columnName\": \"active_users\", \"columnType\": \"int\", \"displayName\": \"活跃用户数\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"活跃用户数\"}, {\"columnName\": \"revenue\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"收入(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"收入(元)\"}]', '[]', '[{\"columnName\": \"platform\", \"columnType\": \"varchar(20)\", \"displayName\": \"平台\", \"columnComment\": \"平台\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'line', '{\"limit\": 1000, \"analyzeDesc\": \"按平台维度查看活跃用户数和收入柱状图\", \"datasetName\": \"运营分析数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"area\": {\"smooth\": true, \"opacity\": 0.3, \"showLabel\": false, \"showPoint\": false, \"horizontalBar\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": false, \"horizontalBar\": false}, \"combo\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": true, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"platform\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"active_users\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"revenue\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"funnel\": {\"sort\": \"descending\", \"showLabel\": true, \"funnelAlign\": \"center\", \"showPercentage\": true}, \"kpiCard\": {\"showSparkline\": true, \"comparisonType\": \"chain\", \"showComparison\": true}, \"scatter\": {\"showLabel\": false, \"symbolSize\": 10, \"showTrendLine\": false}, \"stacked\": {\"smooth\": false, \"showLabel\": false, \"displayMode\": \"stackBar\", \"horizontalBar\": false, \"showPercentage\": false}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": true}}', NULL, '2026-06-12 00:40:56', 'admin', '2026-06-12 00:40:56', 0);
INSERT INTO `analyze_config` (`id`, `analyze_id`, `version_no`, `dataset_id`, `measures`, `filters`, `dimensions`, `orders`, `chart_type`, `common_chart_config`, `private_chart_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (212, 1, 3, 9001, '[{\"columnName\": \"active_users\", \"columnType\": \"int\", \"displayName\": \"活跃用户数\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"活跃用户数\"}, {\"columnName\": \"revenue\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"收入(元)\", \"measureRule\": {\"aggregation\": \"sum\"}, \"columnComment\": \"收入(元)\"}]', '[]', '[{\"columnName\": \"platform\", \"columnType\": \"varchar(20)\", \"displayName\": \"平台\", \"columnComment\": \"平台\", \"dimensionRule\": {\"drill\": {\"role\": \"level\", \"enabled\": false}}}]', '[]', 'interval', '{\"limit\": 1000, \"analyzeDesc\": \"按平台维度查看活跃用户数和收入柱状图\", \"datasetName\": \"运营分析数据集\", \"shareStrategy\": \"\"}', '{\"pie\": {\"showLabel\": false}, \"area\": {\"smooth\": true, \"opacity\": 0.3, \"showLabel\": false, \"showPoint\": false, \"horizontalBar\": false}, \"line\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": false, \"autoDualAxis\": false, \"horizontalBar\": false}, \"combo\": {\"smooth\": false, \"showLabel\": false, \"showPoint\": true, \"horizontalBar\": false}, \"table\": {\"columns\": [{\"role\": \"dimension\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"platform\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"active_users\", \"filterable\": false, \"showOverflowTooltip\": false}, {\"role\": \"measure\", \"align\": null, \"fixed\": null, \"width\": null, \"sortable\": false, \"columnName\": \"revenue\", \"filterable\": false, \"showOverflowTooltip\": false}], \"bufferRows\": 5, \"borderColor\": \"#e5e7eb\", \"bodyFontSize\": 14, \"bodyRowHeight\": 30, \"bodyTextColor\": \"#374151\", \"enableSummary\": false, \"scrollbarSize\": 12, \"bodyFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"headerFontSize\": 14, \"headerRowHeight\": 30, \"headerTextColor\": \"#374151\", \"headerBackground\": \"#fafafa\", \"headerFontFamily\": \"system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif\", \"bodyBackgroundOdd\": \"#ffffff\", \"bodyBackgroundEven\": \"#fafafa\", \"scrollbarBackground\": \"#f3f4f6\"}, \"funnel\": {\"sort\": \"descending\", \"showLabel\": true, \"funnelAlign\": \"center\", \"showPercentage\": true}, \"kpiCard\": {\"showSparkline\": true, \"comparisonType\": \"chain\", \"showComparison\": true}, \"scatter\": {\"showLabel\": false, \"symbolSize\": 10, \"showTrendLine\": false}, \"stacked\": {\"smooth\": false, \"showLabel\": false, \"displayMode\": \"stackBar\", \"horizontalBar\": false, \"showPercentage\": false}, \"interval\": {\"stacking\": \"none\", \"chartType\": \"interval\", \"showLabel\": true}}', NULL, '2026-06-12 00:41:04', 'admin', '2026-06-12 00:41:04', 0);
COMMIT;

-- ----------------------------
-- Table structure for analyze_role_permission
-- ----------------------------
DROP TABLE IF EXISTS `analyze_role_permission`;
CREATE TABLE `analyze_role_permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `analyze_id` bigint unsigned NOT NULL COMMENT '分析ID',
  `role_id` bigint unsigned NOT NULL COMMENT '角色ID',
  `permission_type` varchar(20) NOT NULL DEFAULT 'view' COMMENT '权限类型：view/edit/manage',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_analyze_role_permission` (`analyze_id`,`role_id`),
  KEY `idx_analyze_id` (`analyze_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_type` (`permission_type`),
  CONSTRAINT `fk_analyze_role_permission_analyze_id` FOREIGN KEY (`analyze_id`) REFERENCES `analyze` (`id`),
  CONSTRAINT `fk_analyze_role_permission_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分析角色资源权限表';

-- ----------------------------
-- Records of analyze_role_permission
-- ----------------------------
BEGIN;
INSERT INTO `analyze_role_permission` (`id`, `analyze_id`, `role_id`, `permission_type`, `create_time`, `created_by`, `update_time`, `updated_by`) VALUES (1, 1, 2, 'edit', '2026-06-11 10:00:00', 'system', '2026-06-11 10:00:00', 'system');
COMMIT;

-- ----------------------------
-- Table structure for dashboard
-- ----------------------------
DROP TABLE IF EXISTS `dashboard`;
CREATE TABLE `dashboard` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dashboard_name` varchar(255) NOT NULL COMMENT '看板名称',
  `dashboard_desc` varchar(500) DEFAULT NULL COMMENT '看板描述',
  `current_config_id` bigint unsigned DEFAULT NULL COMMENT '当前生效的看板配置版本ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_dashboard_name` (`dashboard_name`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_update_time` (`update_time`),
  KEY `idx_created_by` (`created_by`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='看板信息表';

-- ----------------------------
-- Records of dashboard
-- ----------------------------
BEGIN;
INSERT INTO `dashboard` (`id`, `dashboard_name`, `dashboard_desc`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (1, '运营综合看板', '涵盖运营、库存、营销、气温、API性能、财务六大场景的综合数据看板', 1, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dashboard` (`id`, `dashboard_name`, `dashboard_desc`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (2, '数据监控看板', 'API性能监控与城市气温趋势的综合数据监控看板', 2, '2026-06-11 12:00:00', 'admin', '2026-06-11 12:00:00', 'admin', 0);
INSERT INTO `dashboard` (`id`, `dashboard_name`, `dashboard_desc`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (3, '财务分析看板', '部门收支对比与营销转化明细的财务分析看板', 3, '2026-06-11 12:00:00', 'admin', '2026-06-11 12:00:00', 'admin', 0);
INSERT INTO `dashboard` (`id`, `dashboard_name`, `dashboard_desc`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (4, '业务关联分析看板', '电商订单与HR人力的JOIN关联分析看板', 4, '2026-06-11 14:00:00', 'admin', '2026-06-11 14:00:00', 'admin', 0);
COMMIT;

-- ----------------------------
-- Table structure for dashboard_config
-- ----------------------------
DROP TABLE IF EXISTS `dashboard_config`;
CREATE TABLE `dashboard_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dashboard_id` bigint unsigned NOT NULL COMMENT '看板ID',
  `version_no` int unsigned NOT NULL COMMENT '版本号',
  `layout_config` json DEFAULT NULL COMMENT '看板布局配置',
  `widgets_config` json DEFAULT NULL COMMENT '看板组件配置快照',
  `change_note` varchar(255) DEFAULT NULL COMMENT '版本说明',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dashboard_version` (`dashboard_id`,`version_no`),
  KEY `idx_dashboard_config_dashboard_id` (`dashboard_id`),
  KEY `idx_dashboard_config_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='看板配置历史版本表';

-- ----------------------------
-- Records of dashboard_config
-- ----------------------------
BEGIN;
INSERT INTO `dashboard_config` (`id`, `dashboard_id`, `version_no`, `layout_config`, `widgets_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (1, 1, 1, '{\"rowHeight\": 60, \"columnCount\": 24}', '[{\"h\": 8, \"w\": 12, \"x\": 0, \"y\": 0, \"analyzeId\": 1, \"chartType\": \"interval\", \"widgetTitle\": \"运营平台活跃用户与收入分析\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 12, \"x\": 12, \"y\": 0, \"analyzeId\": 102, \"chartType\": \"line\", \"widgetTitle\": \"库存周转效率分析（折线图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 24, \"x\": 0, \"y\": 8, \"analyzeId\": 104, \"chartType\": \"table\", \"widgetTitle\": \"营销活动转化明细（表格）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 24, \"x\": 0, \"y\": 16, \"analyzeId\": 3, \"chartType\": \"line\", \"widgetTitle\": \"城市月度气温趋势（折线图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 12, \"x\": 0, \"y\": 24, \"analyzeId\": 105, \"chartType\": \"line\", \"widgetTitle\": \"API性能监控趋势（折线图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 12, \"x\": 12, \"y\": 24, \"analyzeId\": 106, \"chartType\": \"interval\", \"widgetTitle\": \"部门收支对比分析（柱状图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dashboard_config` (`id`, `dashboard_id`, `version_no`, `layout_config`, `widgets_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (2, 2, 1, '{\"rowHeight\": 60, \"columnCount\": 24}', '[{\"h\": 8, \"w\": 12, \"x\": 0, \"y\": 0, \"analyzeId\": 105, \"chartType\": \"line\", \"widgetTitle\": \"API性能监控趋势（折线图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 12, \"x\": 12, \"y\": 0, \"analyzeId\": 3, \"chartType\": \"line\", \"widgetTitle\": \"城市月度气温趋势（折线图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dashboard_config` (`id`, `dashboard_id`, `version_no`, `layout_config`, `widgets_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (3, 3, 1, '{\"rowHeight\": 60, \"columnCount\": 24}', '[{\"h\": 8, \"w\": 24, \"x\": 0, \"y\": 0, \"analyzeId\": 106, \"chartType\": \"interval\", \"widgetTitle\": \"部门收支对比分析（柱状图）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 24, \"x\": 0, \"y\": 8, \"analyzeId\": 104, \"chartType\": \"table\", \"widgetTitle\": \"营销活动转化明细（表格）\", \"widgetConfig\": {}, \"refreshInterval\": 0}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dashboard_config` (`id`, `dashboard_id`, `version_no`, `layout_config`, `widgets_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (4, 4, 1, '{\"rowHeight\": 60, \"columnCount\": 24}', '[{\"h\": 8, \"w\": 12, \"x\": 0, \"y\": 0, \"analyzeId\": 107, \"chartType\": \"interval\", \"widgetTitle\": \"电商品类销售与毛利分析（JOIN）\", \"widgetConfig\": {}, \"refreshInterval\": 0}, {\"h\": 8, \"w\": 12, \"x\": 12, \"y\": 0, \"analyzeId\": 108, \"chartType\": \"interval\", \"widgetTitle\": \"HR部门薪资绩效分析（JOIN）\", \"widgetConfig\": {}, \"refreshInterval\": 0}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
COMMIT;

-- ----------------------------
-- Table structure for data_source
-- ----------------------------
DROP TABLE IF EXISTS `data_source`;
CREATE TABLE `data_source` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `source_name` varchar(100) NOT NULL COMMENT '数据源名称',
  `source_desc` varchar(500) DEFAULT NULL COMMENT '数据源描述',
  `source_type` varchar(30) NOT NULL DEFAULT 'mysql' COMMENT '数据源类型',
  `host` varchar(255) NOT NULL COMMENT '主机地址',
  `port` int unsigned NOT NULL COMMENT '端口',
  `database_name` varchar(100) NOT NULL COMMENT '数据库名称',
  `username` varchar(100) NOT NULL COMMENT '用户名',
  `status` varchar(20) NOT NULL DEFAULT 'enabled' COMMENT '状态：enabled/disabled',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_data_source_name` (`source_name`),
  KEY `idx_data_source_status` (`status`),
  KEY `idx_data_source_update_time` (`update_time`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源表';

-- ----------------------------
-- Records of data_source
-- ----------------------------
BEGIN;
INSERT INTO `data_source` (`id`, `source_name`, `source_desc`, `source_type`, `host`, `port`, `database_name`, `username`, `status`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (1, '业务数据源', '内置业务分析库，对应 kanban_data。', 'mysql', 'mysql-data', 3306, 'kanban_data', 'root', 'enabled', '2026-06-03 16:31:27', 'system', '2026-06-03 16:36:48', 'admin', 0);
COMMIT;

-- ----------------------------
-- Table structure for data_source_column
-- ----------------------------
DROP TABLE IF EXISTS `data_source_column`;
CREATE TABLE `data_source_column` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `data_source_id` bigint unsigned NOT NULL COMMENT '数据源ID',
  `table_name` varchar(128) NOT NULL COMMENT '表名',
  `column_name` varchar(128) NOT NULL COMMENT '字段名',
  `column_type` varchar(100) NOT NULL COMMENT '字段类型',
  `column_comment` varchar(500) DEFAULT NULL COMMENT '字段备注',
  `nullable` varchar(10) DEFAULT NULL COMMENT '是否允许为空',
  `ordinal_position` int unsigned DEFAULT '0' COMMENT '字段顺序',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_data_source_column` (`data_source_id`,`table_name`,`column_name`),
  KEY `idx_data_source_column_table` (`data_source_id`,`table_name`),
  CONSTRAINT `fk_data_source_column_source_id` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=81 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源字段元数据';

-- ----------------------------
-- Records of data_source_column
-- ----------------------------
BEGIN;
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (1, 1, 'operation_analysis', 'id', 'bigint', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (2, 1, 'operation_analysis', 'date', 'date', '统计日期', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (3, 1, 'operation_analysis', 'region', 'varchar(20)', '地区', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (4, 1, 'operation_analysis', 'platform', 'varchar(20)', '平台', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (5, 1, 'operation_analysis', 'product_category', 'varchar(20)', '产品类别', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (6, 1, 'operation_analysis', 'new_users', 'int', '新增用户数', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (7, 1, 'operation_analysis', 'active_users', 'int', '活跃用户数', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (8, 1, 'operation_analysis', 'total_users', 'int', '累计用户数', 'NO', 8, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (9, 1, 'operation_analysis', 'retention_rate', 'decimal(5,2)', '次日留存率(%)', 'NO', 9, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (10, 1, 'operation_analysis', 'conversion_rate', 'decimal(5,2)', '转化率(%)', 'NO', 10, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (11, 1, 'operation_analysis', 'avg_online_time', 'int', '平均在线时长(分钟)', 'NO', 11, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (12, 1, 'operation_analysis', 'pv', 'int', '页面访问量', 'NO', 12, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (13, 1, 'operation_analysis', 'uv', 'int', '独立访客数', 'NO', 13, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (14, 1, 'operation_analysis', 'bounce_rate', 'decimal(5,2)', '跳出率(%)', 'NO', 14, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (15, 1, 'operation_analysis', 'revenue', 'decimal(10,2)', '收入(元)', 'NO', 15, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (16, 1, 'operation_analysis', 'cost', 'decimal(10,2)', '成本(元)', 'NO', 16, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (17, 1, 'operation_analysis', 'roi', 'decimal(5,2)', '投资回报率(%)', 'NO', 17, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (18, 1, 'inventory_turnover', 'id', 'bigint unsigned', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (19, 1, 'inventory_turnover', 'warehouse', 'varchar(50)', '仓库', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (20, 1, 'inventory_turnover', 'category', 'varchar(50)', '品类', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (21, 1, 'inventory_turnover', 'stock_qty', 'int', '库存数量', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (22, 1, 'inventory_turnover', 'sold_qty', 'int', '销售数量', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (23, 1, 'inventory_turnover', 'turnover_days', 'decimal(10,2)', '周转天数', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (24, 1, 'inventory_turnover', 'stat_month', 'varchar(20)', '统计月份', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (25, 1, 'campaign_conversion', 'id', 'bigint unsigned', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (26, 1, 'campaign_conversion', 'campaign_name', 'varchar(100)', '活动名称', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (27, 1, 'campaign_conversion', 'channel', 'varchar(50)', '渠道', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (28, 1, 'campaign_conversion', 'impressions', 'int', '曝光数', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (29, 1, 'campaign_conversion', 'clicks', 'int', '点击数', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (30, 1, 'campaign_conversion', 'conversions', 'int', '转化数', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (31, 1, 'campaign_conversion', 'cost', 'decimal(12,2)', '费用(元)', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (32, 1, 'campaign_conversion', 'conversion_rate', 'decimal(8,4)', '转化率', 'NO', 8, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (33, 1, 'city_temperature', 'id', 'int', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (34, 1, 'city_temperature', 'month', 'varchar(3)', '月份', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (35, 1, 'city_temperature', 'city', 'varchar(32)', '城市名称', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (36, 1, 'city_temperature', 'temperature', 'decimal(4,1)', '月均气温', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (37, 1, 'performance_daily', 'id', 'bigint unsigned', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (38, 1, 'performance_daily', 'stat_date', 'date', '统计日期', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (39, 1, 'performance_daily', 'endpoint', 'varchar(100)', 'API接口路径', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (40, 1, 'performance_daily', 'response_time_ms', 'int', '平均响应时间(ms)', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (41, 1, 'performance_daily', 'request_count', 'int', '请求总数', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (42, 1, 'performance_daily', 'error_count', 'int', '错误请求数', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (43, 1, 'performance_daily', 'error_rate', 'decimal(5,2)', '错误率(%)', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (44, 1, 'performance_daily', 'p95_ms', 'int', 'P95响应时间(ms)', 'NO', 8, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (45, 1, 'performance_daily', 'p99_ms', 'int', 'P99响应时间(ms)', 'NO', 9, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (46, 1, 'finance_summary', 'id', 'bigint unsigned', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (47, 1, 'finance_summary', 'stat_month', 'varchar(10)', '统计月份', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (48, 1, 'finance_summary', 'department', 'varchar(50)', '部门', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (49, 1, 'finance_summary', 'income', 'decimal(12,2)', '收入(元)', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (50, 1, 'finance_summary', 'expense', 'decimal(12,2)', '支出(元)', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (51, 1, 'finance_summary', 'profit', 'decimal(12,2)', '利润(元)', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (52, 1, 'finance_summary', 'profit_rate', 'decimal(5,2)', '利润率(%)', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (53, 1, 'product_catalog', 'id', 'int', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (54, 1, 'product_catalog', 'product_name', 'varchar(100)', '商品名称', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (55, 1, 'product_catalog', 'category', 'varchar(50)', '商品品类', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (56, 1, 'product_catalog', 'brand', 'varchar(50)', '品牌', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (57, 1, 'product_catalog', 'unit_price', 'decimal(10,2)', '单价(元)', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (58, 1, 'product_catalog', 'cost_price', 'decimal(10,2)', '成本价(元)', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (59, 1, 'order_detail', 'id', 'bigint unsigned', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (60, 1, 'order_detail', 'order_no', 'varchar(32)', '订单编号', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (61, 1, 'order_detail', 'order_date', 'date', '订单日期', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (62, 1, 'order_detail', 'product_id', 'int', '商品ID', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (63, 1, 'order_detail', 'quantity', 'int', '购买数量', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (64, 1, 'order_detail', 'amount', 'decimal(12,2)', '订单金额(元)', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (65, 1, 'order_detail', 'customer_region', 'varchar(20)', '客户地区', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (66, 1, 'order_detail', 'payment_method', 'varchar(20)', '支付方式', 'NO', 8, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (67, 1, 'department', 'id', 'int', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (68, 1, 'department', 'dept_name', 'varchar(50)', '部门名称', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (69, 1, 'department', 'dept_code', 'varchar(20)', '部门编码', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (70, 1, 'department', 'manager_name', 'varchar(50)', '部门负责人', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (71, 1, 'department', 'budget', 'decimal(12,2)', '年度预算(元)', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (72, 1, 'employee', 'id', 'int', '主键ID', 'NO', 1, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (73, 1, 'employee', 'emp_name', 'varchar(50)', '员工姓名', 'NO', 2, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (74, 1, 'employee', 'gender', 'varchar(4)', '性别', 'NO', 3, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (75, 1, 'employee', 'age', 'int', '年龄', 'NO', 4, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (76, 1, 'employee', 'department_id', 'int', '部门ID', 'NO', 5, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (77, 1, 'employee', 'position', 'varchar(50)', '职位', 'NO', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (78, 1, 'employee', 'salary', 'decimal(10,2)', '月薪(元)', 'NO', 7, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (79, 1, 'employee', 'hire_date', 'date', '入职日期', 'NO', 8, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_column` (`id`, `data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `create_time`, `update_time`, `is_deleted`) VALUES (80, 1, 'employee', 'performance_score', 'decimal(3,1)', '绩效评分', 'NO', 9, '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
COMMIT;

-- ----------------------------
-- Table structure for data_source_table
-- ----------------------------
DROP TABLE IF EXISTS `data_source_table`;
CREATE TABLE `data_source_table` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `data_source_id` bigint unsigned NOT NULL COMMENT '数据源ID',
  `table_name` varchar(128) NOT NULL COMMENT '表名',
  `table_comment` varchar(500) DEFAULT NULL COMMENT '表备注',
  `table_rows` bigint unsigned DEFAULT '0' COMMENT '表行数',
  `last_sync_time` datetime DEFAULT NULL COMMENT '最近同步时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_data_source_table` (`data_source_id`,`table_name`),
  KEY `idx_data_source_table_name` (`table_name`),
  CONSTRAINT `fk_data_source_table_source_id` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源表元数据';

-- ----------------------------
-- Records of data_source_table
-- ----------------------------
BEGIN;
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (1, 1, 'operation_analysis', '运营分析统计表', 92, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (2, 1, 'inventory_turnover', '库存周转数据', 24, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (3, 1, 'campaign_conversion', '营销活动转化数据', 24, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (4, 1, 'city_temperature', '城市月度气温表', 48, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (5, 1, 'performance_daily', 'API性能监控日报表', 35, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (6, 1, 'finance_summary', '部门财务收支汇总表', 30, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (7, 1, 'product_catalog', '商品目录表', 25, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (8, 1, 'order_detail', '订单明细表', 60, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (9, 1, 'department', '部门信息表', 6, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
INSERT INTO `data_source_table` (`id`, `data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `create_time`, `update_time`, `is_deleted`) VALUES (10, 1, 'employee', '员工信息表', 30, '2026-06-11 10:00:00', '2026-06-11 10:00:00', '2026-06-11 10:00:00', 0);
COMMIT;

-- ----------------------------
-- Table structure for dataset
-- ----------------------------
DROP TABLE IF EXISTS `dataset`;
CREATE TABLE `dataset` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dataset_name` varchar(100) NOT NULL COMMENT '数据集名称',
  `dataset_desc` varchar(500) DEFAULT NULL COMMENT '数据集描述',
  `status` varchar(20) NOT NULL DEFAULT 'enabled' COMMENT '状态：enabled/disabled',
  `current_config_id` bigint unsigned DEFAULT NULL COMMENT '当前生效配置版本ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_dataset_name` (`dataset_name`),
  KEY `idx_dataset_update_time` (`update_time`)
) ENGINE=InnoDB AUTO_INCREMENT=9010 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据集表';

-- ----------------------------
-- Records of dataset
-- ----------------------------
BEGIN;
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9001, '运营分析数据集', '按日期、地区、平台和产品类别分析用户、流量、收入和转化指标。', 'enabled', 9001, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9002, '库存周转数据集', '按仓库和品类分析库存周转效率。', 'enabled', 9002, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9003, '营销转化数据集', '按活动和渠道分析曝光、点击、转化和费用。', 'enabled', 9003, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9004, '城市气温数据集', '按月份和城市分析气温变化趋势。', 'enabled', 9004, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9005, 'API性能监控数据集', '按日期和接口分析API响应时间、请求量和错误率。', 'enabled', 9005, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9006, '部门财务收支数据集', '按月份和部门分析收入、支出、利润及利润率。', 'enabled', 9006, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9007, '电商订单关联数据集', '订单明细关联商品目录，分析品类/品牌销售额和毛利。使用 JOIN 查询。', 'enabled', 9007, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
INSERT INTO `dataset` (`id`, `dataset_name`, `dataset_desc`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (9008, 'HR员工关联数据集', '员工信息关联部门表，分析各部门薪资分布和绩效表现。使用 JOIN 查询。', 'enabled', 9008, '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 'admin', 0);
COMMIT;

-- ----------------------------
-- Table structure for dataset_config
-- ----------------------------
DROP TABLE IF EXISTS `dataset_config`;
CREATE TABLE `dataset_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dataset_id` bigint unsigned NOT NULL COMMENT '数据集ID',
  `version_no` int unsigned NOT NULL COMMENT '版本号',
  `query_sql` mediumtext NOT NULL COMMENT '该版本SQL',
  `fields_config` json NOT NULL COMMENT '该版本字段配置快照',
  `change_note` varchar(255) DEFAULT NULL COMMENT '版本说明',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dataset_version` (`dataset_id`,`version_no`),
  KEY `idx_dataset_config_dataset_id` (`dataset_id`),
  KEY `idx_dataset_config_create_time` (`create_time`),
  CONSTRAINT `fk_dataset_config_dataset_id` FOREIGN KEY (`dataset_id`) REFERENCES `dataset` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9010 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据集配置历史版本表';

-- ----------------------------
-- Records of dataset_config
-- ----------------------------
BEGIN;
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9001, 9001, 1, 'SELECT\n  id,\n  date,\n  region,\n  platform,\n  product_category,\n  new_users,\n  active_users,\n  retention_rate,\n  conversion_rate,\n  revenue,\n  cost,\n  roi\nFROM operation_analysis', '[{\"visible\": false, \"dataType\": \"bigint\", \"fieldName\": \"id\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"主键ID\", \"aggregationType\": null, \"sourceColumnName\": \"id\"}, {\"visible\": true, \"dataType\": \"date\", \"fieldName\": \"date\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"统计日期\", \"aggregationType\": null, \"sourceColumnName\": \"date\"}, {\"visible\": true, \"dataType\": \"varchar(20)\", \"fieldName\": \"region\", \"fieldType\": \"dimension\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"地区\", \"aggregationType\": null, \"sourceColumnName\": \"region\"}, {\"visible\": true, \"dataType\": \"varchar(20)\", \"fieldName\": \"platform\", \"fieldType\": \"dimension\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"平台\", \"aggregationType\": null, \"sourceColumnName\": \"platform\"}, {\"visible\": true, \"dataType\": \"varchar(20)\", \"fieldName\": \"product_category\", \"fieldType\": \"dimension\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"产品类别\", \"aggregationType\": null, \"sourceColumnName\": \"product_category\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"new_users\", \"fieldType\": \"measure\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"新增用户数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"new_users\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"active_users\", \"fieldType\": \"measure\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"活跃用户数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"active_users\"}, {\"visible\": true, \"dataType\": \"decimal(5,2)\", \"fieldName\": \"retention_rate\", \"fieldType\": \"measure\", \"sortOrder\": 8, \"expression\": \"\", \"displayName\": \"次日留存率(%)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"retention_rate\"}, {\"visible\": true, \"dataType\": \"decimal(5,2)\", \"fieldName\": \"conversion_rate\", \"fieldType\": \"measure\", \"sortOrder\": 9, \"expression\": \"\", \"displayName\": \"转化率(%)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"conversion_rate\"}, {\"visible\": true, \"dataType\": \"decimal(10,2)\", \"fieldName\": \"revenue\", \"fieldType\": \"measure\", \"sortOrder\": 10, \"expression\": \"\", \"displayName\": \"收入(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"revenue\"}, {\"visible\": true, \"dataType\": \"decimal(10,2)\", \"fieldName\": \"cost\", \"fieldType\": \"measure\", \"sortOrder\": 11, \"expression\": \"\", \"displayName\": \"成本(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"cost\"}, {\"visible\": true, \"dataType\": \"decimal(5,2)\", \"fieldName\": \"roi\", \"fieldType\": \"measure\", \"sortOrder\": 12, \"expression\": \"\", \"displayName\": \"投资回报率(%)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"roi\"}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9002, 9002, 1, 'SELECT\n  id,\n  warehouse,\n  category,\n  stat_month,\n  stock_qty,\n  sold_qty,\n  turnover_days\nFROM inventory_turnover', '[{\"visible\": false, \"dataType\": \"bigint unsigned\", \"fieldName\": \"id\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"主键ID\", \"aggregationType\": null, \"sourceColumnName\": \"id\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"warehouse\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"仓库\", \"aggregationType\": null, \"sourceColumnName\": \"warehouse\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"category\", \"fieldType\": \"dimension\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"品类\", \"aggregationType\": null, \"sourceColumnName\": \"category\"}, {\"visible\": true, \"dataType\": \"varchar(20)\", \"fieldName\": \"stat_month\", \"fieldType\": \"dimension\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"统计月份\", \"aggregationType\": null, \"sourceColumnName\": \"stat_month\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"stock_qty\", \"fieldType\": \"measure\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"库存数量\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"stock_qty\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"sold_qty\", \"fieldType\": \"measure\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"销售数量\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"sold_qty\"}, {\"visible\": true, \"dataType\": \"decimal(10,2)\", \"fieldName\": \"turnover_days\", \"fieldType\": \"measure\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"周转天数\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"turnover_days\"}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9003, 9003, 1, 'SELECT\n  id,\n  campaign_name,\n  channel,\n  impressions,\n  clicks,\n  conversions,\n  cost,\n  conversion_rate\nFROM campaign_conversion', '[{\"visible\": false, \"dataType\": \"bigint unsigned\", \"fieldName\": \"id\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"主键ID\", \"aggregationType\": null, \"sourceColumnName\": \"id\"}, {\"visible\": true, \"dataType\": \"varchar(100)\", \"fieldName\": \"campaign_name\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"活动名称\", \"aggregationType\": null, \"sourceColumnName\": \"campaign_name\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"channel\", \"fieldType\": \"dimension\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"渠道\", \"aggregationType\": null, \"sourceColumnName\": \"channel\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"impressions\", \"fieldType\": \"measure\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"曝光数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"impressions\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"clicks\", \"fieldType\": \"measure\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"点击数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"clicks\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"conversions\", \"fieldType\": \"measure\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"转化数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"conversions\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"cost\", \"fieldType\": \"measure\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"费用(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"cost\"}, {\"visible\": true, \"dataType\": \"decimal(8,4)\", \"fieldName\": \"conversion_rate\", \"fieldType\": \"measure\", \"sortOrder\": 8, \"expression\": \"\", \"displayName\": \"转化率\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"conversion_rate\"}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9004, 9004, 1, 'SELECT\n  city,\n  month,\n  temperature\nFROM city_temperature\nORDER BY city, month', '[{\"visible\": true, \"dataType\": \"varchar(32)\", \"fieldName\": \"city\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"城市名称\", \"aggregationType\": null, \"sourceColumnName\": \"city\"}, {\"visible\": true, \"dataType\": \"varchar(3)\", \"fieldName\": \"month\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"月份\", \"aggregationType\": null, \"sourceColumnName\": \"month\"}, {\"visible\": true, \"dataType\": \"decimal(4,1)\", \"fieldName\": \"temperature\", \"fieldType\": \"measure\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"月均气温\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"temperature\"}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9005, 9005, 1, 'SELECT\n  id,\n  stat_date,\n  endpoint,\n  response_time_ms,\n  request_count,\n  error_count,\n  error_rate,\n  p95_ms,\n  p99_ms\nFROM performance_daily\nORDER BY stat_date, endpoint', '[{\"visible\": false, \"dataType\": \"bigint unsigned\", \"fieldName\": \"id\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"主键ID\", \"aggregationType\": null, \"sourceColumnName\": \"id\"}, {\"visible\": true, \"dataType\": \"date\", \"fieldName\": \"stat_date\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"统计日期\", \"aggregationType\": null, \"sourceColumnName\": \"stat_date\"}, {\"visible\": true, \"dataType\": \"varchar(100)\", \"fieldName\": \"endpoint\", \"fieldType\": \"dimension\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"API接口\", \"aggregationType\": null, \"sourceColumnName\": \"endpoint\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"response_time_ms\", \"fieldType\": \"measure\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"平均响应时间(ms)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"response_time_ms\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"request_count\", \"fieldType\": \"measure\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"请求总数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"request_count\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"error_count\", \"fieldType\": \"measure\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"错误请求数\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"error_count\"}, {\"visible\": true, \"dataType\": \"decimal(5,2)\", \"fieldName\": \"error_rate\", \"fieldType\": \"measure\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"错误率(%)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"error_rate\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"p95_ms\", \"fieldType\": \"measure\", \"sortOrder\": 8, \"expression\": \"\", \"displayName\": \"P95响应时间(ms)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"p95_ms\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"p99_ms\", \"fieldType\": \"measure\", \"sortOrder\": 9, \"expression\": \"\", \"displayName\": \"P99响应时间(ms)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"p99_ms\"}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9006, 9006, 1, 'SELECT\n  id,\n  stat_month,\n  department,\n  income,\n  expense,\n  profit,\n  profit_rate\nFROM finance_summary\nORDER BY stat_month, department', '[{\"visible\": false, \"dataType\": \"bigint unsigned\", \"fieldName\": \"id\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"主键ID\", \"aggregationType\": null, \"sourceColumnName\": \"id\"}, {\"visible\": true, \"dataType\": \"varchar(10)\", \"fieldName\": \"stat_month\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"统计月份\", \"aggregationType\": null, \"sourceColumnName\": \"stat_month\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"department\", \"fieldType\": \"dimension\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"部门\", \"aggregationType\": null, \"sourceColumnName\": \"department\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"income\", \"fieldType\": \"measure\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"收入(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"income\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"expense\", \"fieldType\": \"measure\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"支出(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"expense\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"profit\", \"fieldType\": \"measure\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"利润(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"profit\"}, {\"visible\": true, \"dataType\": \"decimal(5,2)\", \"fieldName\": \"profit_rate\", \"fieldType\": \"measure\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"利润率(%)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"profit_rate\"}]', '初始化版本', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9007, 9007, 1, 'SELECT\n  o.order_date,\n  o.order_no,\n  p.product_name,\n  p.category,\n  p.brand,\n  o.quantity,\n  o.amount,\n  o.customer_region,\n  o.payment_method,\n  p.unit_price,\n  p.cost_price,\n  (o.amount - p.cost_price * o.quantity) AS gross_profit\nFROM order_detail o\nJOIN product_catalog p ON o.product_id = p.id\nORDER BY o.order_date', '[{\"visible\": true, \"dataType\": \"date\", \"fieldName\": \"order_date\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"订单日期\", \"aggregationType\": null, \"sourceColumnName\": \"order_date\"}, {\"visible\": true, \"dataType\": \"varchar(100)\", \"fieldName\": \"product_name\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"商品名称\", \"aggregationType\": null, \"sourceColumnName\": \"product_name\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"category\", \"fieldType\": \"dimension\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"商品品类\", \"aggregationType\": null, \"sourceColumnName\": \"category\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"brand\", \"fieldType\": \"dimension\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"品牌\", \"aggregationType\": null, \"sourceColumnName\": \"brand\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"quantity\", \"fieldType\": \"measure\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"购买数量\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"quantity\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"amount\", \"fieldType\": \"measure\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"订单金额(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"amount\"}, {\"visible\": true, \"dataType\": \"varchar(20)\", \"fieldName\": \"customer_region\", \"fieldType\": \"dimension\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"客户地区\", \"aggregationType\": null, \"sourceColumnName\": \"customer_region\"}, {\"visible\": true, \"dataType\": \"varchar(20)\", \"fieldName\": \"payment_method\", \"fieldType\": \"dimension\", \"sortOrder\": 8, \"expression\": \"\", \"displayName\": \"支付方式\", \"aggregationType\": null, \"sourceColumnName\": \"payment_method\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"gross_profit\", \"fieldType\": \"measure\", \"sortOrder\": 9, \"expression\": \"\", \"displayName\": \"毛利(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"gross_profit\"}]', '初始化版本-JOIN查询', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
INSERT INTO `dataset_config` (`id`, `dataset_id`, `version_no`, `query_sql`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`) VALUES (9008, 9008, 1, 'SELECT\n  e.emp_name,\n  e.gender,\n  e.age,\n  e.position,\n  e.salary,\n  e.hire_date,\n  e.performance_score,\n  d.dept_name,\n  d.dept_code,\n  d.budget\nFROM employee e\nJOIN department d ON e.department_id = d.id\nORDER BY d.dept_name, e.salary DESC', '[{\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"emp_name\", \"fieldType\": \"dimension\", \"sortOrder\": 1, \"expression\": \"\", \"displayName\": \"员工姓名\", \"aggregationType\": null, \"sourceColumnName\": \"emp_name\"}, {\"visible\": true, \"dataType\": \"varchar(4)\", \"fieldName\": \"gender\", \"fieldType\": \"dimension\", \"sortOrder\": 2, \"expression\": \"\", \"displayName\": \"性别\", \"aggregationType\": null, \"sourceColumnName\": \"gender\"}, {\"visible\": true, \"dataType\": \"int\", \"fieldName\": \"age\", \"fieldType\": \"measure\", \"sortOrder\": 3, \"expression\": \"\", \"displayName\": \"年龄\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"age\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"position\", \"fieldType\": \"dimension\", \"sortOrder\": 4, \"expression\": \"\", \"displayName\": \"职位\", \"aggregationType\": null, \"sourceColumnName\": \"position\"}, {\"visible\": true, \"dataType\": \"decimal(10,2)\", \"fieldName\": \"salary\", \"fieldType\": \"measure\", \"sortOrder\": 5, \"expression\": \"\", \"displayName\": \"月薪(元)\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"salary\"}, {\"visible\": true, \"dataType\": \"date\", \"fieldName\": \"hire_date\", \"fieldType\": \"dimension\", \"sortOrder\": 6, \"expression\": \"\", \"displayName\": \"入职日期\", \"aggregationType\": null, \"sourceColumnName\": \"hire_date\"}, {\"visible\": true, \"dataType\": \"decimal(3,1)\", \"fieldName\": \"performance_score\", \"fieldType\": \"measure\", \"sortOrder\": 7, \"expression\": \"\", \"displayName\": \"绩效评分\", \"aggregationType\": \"avg\", \"sourceColumnName\": \"performance_score\"}, {\"visible\": true, \"dataType\": \"varchar(50)\", \"fieldName\": \"dept_name\", \"fieldType\": \"dimension\", \"sortOrder\": 8, \"expression\": \"\", \"displayName\": \"部门名称\", \"aggregationType\": null, \"sourceColumnName\": \"dept_name\"}, {\"visible\": true, \"dataType\": \"decimal(12,2)\", \"fieldName\": \"budget\", \"fieldType\": \"measure\", \"sortOrder\": 9, \"expression\": \"\", \"displayName\": \"部门年度预算(元)\", \"aggregationType\": \"sum\", \"sourceColumnName\": \"budget\"}]', '初始化版本-JOIN查询', '2026-06-11 10:00:00', 'admin', '2026-06-11 10:00:00', 0);
COMMIT;

-- ----------------------------
-- Table structure for resource_role_permission
-- ----------------------------
DROP TABLE IF EXISTS `resource_role_permission`;
CREATE TABLE `resource_role_permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT 'ä¸»é”®ID',
  `resource_type` varchar(50) NOT NULL COMMENT 'èµ„æºç±»åž‹ï¼šanalyze/dashboard/datasource/folder/scheduled_email',
  `resource_id` bigint unsigned NOT NULL COMMENT 'èµ„æºID',
  `role_id` bigint unsigned NOT NULL COMMENT 'è§’è‰²ID',
  `permission_type` varchar(20) NOT NULL DEFAULT 'view' COMMENT 'æƒé™ç±»åž‹ï¼šview/edit/manage',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'åˆ›å»ºæ—¶é—´',
  `created_by` varchar(100) DEFAULT NULL COMMENT 'åˆ›å»ºäºº',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'æ›´æ–°æ—¶é—´',
  `updated_by` varchar(100) DEFAULT NULL COMMENT 'æ›´æ–°äºº',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resource_role_permission` (`resource_type`,`resource_id`,`role_id`),
  KEY `idx_resource` (`resource_type`,`resource_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_type` (`permission_type`),
  CONSTRAINT `fk_resource_role_permission_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='é€šç”¨èµ„æºè§’è‰²æƒé™è¡¨';

-- ----------------------------
-- Records of resource_role_permission
-- ----------------------------
BEGIN;
INSERT INTO `resource_role_permission` (`id`, `resource_type`, `resource_id`, `role_id`, `permission_type`, `create_time`, `created_by`, `update_time`, `updated_by`) VALUES (1, 'analyze', 1, 2, 'edit', '2026-06-11 10:00:00', 'system', '2026-06-11 10:00:00', 'system');
COMMIT;

-- ----------------------------
-- Table structure for role
-- ----------------------------
DROP TABLE IF EXISTS `role`;
CREATE TABLE `role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `role_code` varchar(64) NOT NULL COMMENT '角色编码，系统内唯一',
  `role_name` varchar(100) NOT NULL COMMENT '角色名称',
  `role_desc` varchar(255) DEFAULT NULL COMMENT '角色描述',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：1=启用，0=禁用',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除：0=未删除，1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_code` (`role_code`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色表';

-- ----------------------------
-- Records of role
-- ----------------------------
BEGIN;
INSERT INTO `role` (`id`, `role_code`, `role_name`, `role_desc`, `status`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (1, 'admin', '管理员', '拥有全部分析管理权限', 1, '2026-05-26 18:03:16', 'system', '2026-05-26 18:03:16', 'system', 0);
INSERT INTO `role` (`id`, `role_code`, `role_name`, `role_desc`, `status`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (2, 'analyst', '分析师', '可编辑授权范围内的分析', 1, '2026-05-26 18:03:16', 'system', '2026-05-26 18:03:16', 'system', 0);
INSERT INTO `role` (`id`, `role_code`, `role_name`, `role_desc`, `status`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (3, 'viewer', '只读用户', '仅可查看授权范围内的分析', 1, '2026-05-26 18:03:16', 'system', '2026-05-26 18:03:16', 'system', 0);
COMMIT;

-- ----------------------------
-- Table structure for scheduled_email_logs
-- ----------------------------
DROP TABLE IF EXISTS `scheduled_email_logs`;
CREATE TABLE `scheduled_email_logs` (
  `id` int NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `task_id` int NOT NULL COMMENT '任务ID',
  `execution_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '执行时间',
  `execution_timezone` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '执行时区',
  `status` enum('success','failed') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '执行状态',
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '执行消息',
  `error_details` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '错误详情',
  `email_message_id` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮件消息ID',
  `sender_email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'system@unknown' COMMENT '发件人邮箱',
  `sender_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发件人名称',
  `recipient_to` json NOT NULL DEFAULT (json_array()) COMMENT '收件人列表',
  `recipient_cc` json DEFAULT NULL COMMENT '抄送列表',
  `recipient_bcc` json DEFAULT NULL COMMENT '密送列表',
  `reply_to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '回复邮箱',
  `email_subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '邮件主题',
  `attachment_count` int DEFAULT '0' COMMENT '附件数量',
  `attachment_names` json DEFAULT NULL COMMENT '附件名称集合',
  `email_channel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'smtp' COMMENT '发送通道',
  `provider` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '发送服务提供方',
  `provider_response` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '发送响应信息',
  `accepted_recipients` json DEFAULT NULL COMMENT '成功接收收件人',
  `rejected_recipients` json DEFAULT NULL COMMENT '拒收收件人',
  `retry_count` int DEFAULT '0' COMMENT '任务重试次数',
  `raw_request_payload` json DEFAULT NULL COMMENT '请求原始数据',
  `raw_response_payload` json DEFAULT NULL COMMENT '响应原始数据',
  `smtp_host` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'SMTP主机',
  `smtp_port` int DEFAULT NULL COMMENT 'SMTP端口',
  `execution_duration` int DEFAULT NULL COMMENT '执行耗时(毫秒)',
  `created_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'system' COMMENT '创建人',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_execution_time` (`execution_time`),
  KEY `idx_status` (`status`),
  KEY `idx_sender_email` (`sender_email`)
) ENGINE=InnoDB AUTO_INCREMENT=1517 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务执行日志表';

-- ----------------------------
-- Records of scheduled_email_logs
-- ----------------------------
BEGIN;
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1508, 1, '2026-06-11 09:00:00', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '每日运营数据日报', 1, '[\"运营平台活跃用户与收入分析\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 1, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"每日运营数据日报\", \"additionalContent\": \"每天早上 9 点发送运营数据柱状图\"}, \"analyzeOptions\": {\"filename\": \"运营平台活跃用户与收入分析\", \"analyzeId\": 1, \"chartType\": \"interval\", \"analyzeName\": \"运营平台活跃用户与收入分析\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 657, '2026-06-11 09:00:00', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1509, 1, '2026-06-11 09:05:00', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '每日运营数据日报', 1, '[\"运营平台活跃用户与收入分析\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 2, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"每日运营数据日报\", \"additionalContent\": \"每天早上 9 点发送运营数据柱状图\"}, \"analyzeOptions\": {\"filename\": \"运营平台活跃用户与收入分析\", \"analyzeId\": 1, \"chartType\": \"interval\", \"analyzeName\": \"运营平台活跃用户与收入分析\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 273, '2026-06-11 09:05:00', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1510, 1, '2026-06-11 09:10:00', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '每日运营数据日报', 1, '[\"运营平台活跃用户与收入分析\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 3, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"每日运营数据日报\", \"additionalContent\": \"每天早上 9 点发送运营数据柱状图\"}, \"analyzeOptions\": {\"filename\": \"运营平台活跃用户与收入分析\", \"analyzeId\": 1, \"chartType\": \"interval\", \"analyzeName\": \"运营平台活跃用户与收入分析\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 306, '2026-06-11 09:10:00', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1511, 4, '2026-06-11 10:00:00', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '每日API性能报告', 1, '[\"API性能监控趋势（折线图）\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 1, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"每日API性能报告\", \"additionalContent\": \"每天早上 10 点发送API性能折线图\"}, \"analyzeOptions\": {\"filename\": \"API性能监控趋势（折线图）\", \"analyzeId\": 105, \"chartType\": \"line\", \"analyzeName\": \"API性能监控趋势（折线图）\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 669, '2026-06-11 10:00:00', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1512, 4, '2026-06-11 10:05:02', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '每日API性能报告', 1, '[\"API性能监控趋势（折线图）\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 2, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"每日API性能报告\", \"additionalContent\": \"每天早上 10 点发送API性能折线图\"}, \"analyzeOptions\": {\"filename\": \"API性能监控趋势（折线图）\", \"analyzeId\": 105, \"chartType\": \"line\", \"analyzeName\": \"API性能监控趋势（折线图）\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 2021, '2026-06-11 10:05:02', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1513, 4, '2026-06-11 10:10:00', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '每日API性能报告', 1, '[\"API性能监控趋势（折线图）\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 3, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"每日API性能报告\", \"additionalContent\": \"每天早上 10 点发送API性能折线图\"}, \"analyzeOptions\": {\"filename\": \"API性能监控趋势（折线图）\", \"analyzeId\": 105, \"chartType\": \"line\", \"analyzeName\": \"API性能监控趋势（折线图）\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 497, '2026-06-11 10:10:00', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1514, 2, '2026-06-11 15:00:01', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '工作日气温数据报告', 1, '[\"城市月度气温趋势（折线图）\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 1, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"工作日气温数据报告\", \"additionalContent\": \"工作日 15:00 发送气温折线图\"}, \"analyzeOptions\": {\"filename\": \"城市月度气温趋势（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市月度气温趋势（折线图）\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 1802, '2026-06-11 15:00:01', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1515, 2, '2026-06-11 23:01:05', 'Asia/Shanghai', 'failed', '邮件发送失败', 'read ECONNRESET', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '工作日气温数据报告', 1, '[\"城市月度气温趋势（折线图）\"]', 'smtps', 'smtp.163.com', 'read ECONNRESET', NULL, NULL, 2, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"工作日气温数据报告\", \"additionalContent\": \"工作日 15:00 发送气温折线图\"}, \"analyzeOptions\": {\"filename\": \"城市月度气温趋势（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市月度气温趋势（折线图）\"}}', '{\"error\": \"read ECONNRESET\"}', 'smtp.163.com', 465, 183, '2026-06-11 23:01:05', 'system');
INSERT INTO `scheduled_email_logs` (`id`, `task_id`, `execution_time`, `execution_timezone`, `status`, `message`, `error_details`, `email_message_id`, `sender_email`, `sender_name`, `recipient_to`, `recipient_cc`, `recipient_bcc`, `reply_to`, `email_subject`, `attachment_count`, `attachment_names`, `email_channel`, `provider`, `provider_response`, `accepted_recipients`, `rejected_recipients`, `retry_count`, `raw_request_payload`, `raw_response_payload`, `smtp_host`, `smtp_port`, `execution_duration`, `created_time`, `created_by`) VALUES (1516, 2, '2026-06-11 15:05:00', 'UTC', 'failed', '邮件发送失败', 'Invalid login: 550 User has no permission', NULL, '18763006837@163.com', NULL, '[\"admin@example.com\"]', NULL, NULL, NULL, '工作日气温数据报告', 1, '[\"城市月度气温趋势（折线图）\"]', 'smtps', 'smtp.163.com', 'Invalid login: 550 User has no permission', NULL, NULL, 3, '{\"emailConfig\": {\"to\": \"admin@example.com\", \"subject\": \"工作日气温数据报告\", \"additionalContent\": \"工作日 15:00 发送气温折线图\"}, \"analyzeOptions\": {\"filename\": \"城市月度气温趋势（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市月度气温趋势（折线图）\"}}', '{\"error\": \"Invalid login: 550 User has no permission\"}', 'smtp.163.com', 465, 325, '2026-06-11 15:05:00', 'system');
COMMIT;

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

-- ----------------------------
-- Records of scheduled_email_tasks
-- ----------------------------
BEGIN;
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (1, '【示例】每日运营数据日报（柱状图）', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '09:00:00', 1, NULL, '{\"to\": \"admin@example.com\", \"subject\": \"每日运营数据日报\", \"additionalContent\": \"每天早上 9 点发送运营数据柱状图\"}', '{\"filename\": \"运营平台活跃用户与收入分析\", \"analyzeId\": 1, \"chartType\": \"interval\", \"analyzeName\": \"运营平台活跃用户与收入分析\"}', 'pending', '每日运营数据柱状图', 'admin', 'system', '2026-06-11 10:00:00', '2026-06-11 09:10:00', '2026-06-11 17:10:00', 'Invalid login: 550 User has no permission', 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (2, '【示例】工作日气温数据报告（折线图）', NULL, 'recurring', '[1, 2, 3, 4, 5]', '15:00:00', 1, NULL, '{\"to\": \"admin@example.com\", \"subject\": \"工作日气温数据报告\", \"additionalContent\": \"工作日 15:00 发送气温折线图\"}', '{\"filename\": \"城市月度气温趋势（折线图）\", \"analyzeId\": 3, \"chartType\": \"line\", \"analyzeName\": \"城市月度气温趋势（折线图）\"}', 'pending', '工作日气温折线图', 'admin', 'system', '2026-06-11 10:00:00', '2026-06-11 15:05:00', '2026-06-11 23:05:00', 'Invalid login: 550 User has no permission', 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (3, '【示例】营销转化明细周报（表格）', NULL, 'recurring', '[1]', '10:00:00', 1, NULL, '{\"to\": \"admin@example.com\", \"subject\": \"营销转化明细周报\", \"additionalContent\": \"每周一 10:00 发送营销转化表格\"}', '{\"filename\": \"营销活动转化明细（表格）\", \"analyzeId\": 104, \"chartType\": \"table\", \"analyzeName\": \"营销活动转化明细（表格）\"}', 'pending', '每周营销转化表格', 'admin', 'system', '2026-06-11 10:00:00', '2026-06-11 10:00:00', NULL, NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (4, '【示例】每日API性能日报（折线图）', NULL, 'recurring', '[0, 1, 2, 3, 4, 5, 6]', '10:00:00', 1, NULL, '{\"to\": \"admin@example.com\", \"subject\": \"每日API性能报告\", \"additionalContent\": \"每天早上 10 点发送API性能折线图\"}', '{\"filename\": \"API性能监控趋势（折线图）\", \"analyzeId\": 105, \"chartType\": \"line\", \"analyzeName\": \"API性能监控趋势（折线图）\"}', 'pending', '每日API性能折线图', 'admin', 'system', '2026-06-11 10:00:00', '2026-06-11 10:10:00', '2026-06-11 18:10:00', 'Invalid login: 550 User has no permission', 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (5, '【示例】月度财务收支报告（柱状图）', NULL, 'recurring', '[1]', '08:00:00', 1, NULL, '{\"to\": \"admin@example.com\", \"subject\": \"月度财务收支报告\", \"additionalContent\": \"每周一 8:00 发送部门收支柱状图\"}', '{\"filename\": \"部门收支对比分析（柱状图）\", \"analyzeId\": 106, \"chartType\": \"interval\", \"analyzeName\": \"部门收支对比分析（柱状图）\"}', 'pending', '每周财务收支柱状图', 'admin', 'system', '2026-06-11 10:00:00', '2026-06-11 10:00:00', NULL, NULL, 0, 3);
INSERT INTO `scheduled_email_tasks` (`id`, `task_name`, `schedule_time`, `task_type`, `recurring_days`, `recurring_time`, `is_active`, `next_execution_time`, `email_config`, `analyze_options`, `status`, `remark`, `created_by`, `updated_by`, `created_time`, `updated_time`, `executed_time`, `error_message`, `retry_count`, `max_retries`) VALUES (6, '【示例】电商销售毛利周报（JOIN）', NULL, 'recurring', '[1]', '09:00:00', 1, NULL, '{\"to\": \"admin@example.com\", \"subject\": \"电商销售毛利周报\", \"additionalContent\": \"每周一 9:00 发送品类销售与毛利柱状图\"}', '{\"filename\": \"电商品类销售与毛利分析（JOIN）\", \"analyzeId\": 107, \"chartType\": \"interval\", \"analyzeName\": \"电商品类销售与毛利分析（JOIN）\"}', 'pending', '每周电商毛利分析', 'admin', 'system', '2026-06-11 10:00:00', '2026-06-11 10:00:00', NULL, NULL, 0, 3);
COMMIT;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_name` varchar(64) NOT NULL COMMENT '登录账号，系统内唯一',
  `display_name` varchar(100) NOT NULL COMMENT '展示名称',
  `password_hash` varchar(255) NOT NULL COMMENT '密码哈希',
  `email` varchar(255) DEFAULT NULL COMMENT '邮箱',
  `mobile` varchar(32) DEFAULT NULL COMMENT '手机号',
  `avatar` varchar(500) DEFAULT NULL COMMENT '头像地址',
  `role_code` varchar(64) NOT NULL DEFAULT 'admin' COMMENT '角色编码',
  `status` tinyint unsigned NOT NULL DEFAULT '1' COMMENT '状态：1=启用，0=禁用',
  `last_login_time` datetime DEFAULT NULL COMMENT '最近登录时间',
  `last_login_ip` varchar(64) DEFAULT NULL COMMENT '最近登录IP',
  `password_updated_time` datetime DEFAULT NULL COMMENT '密码更新时间',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0' COMMENT '是否删除：0=未删除，1=已删除',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_name` (`user_name`),
  KEY `idx_status` (`status`),
  KEY `idx_role_code` (`role_code`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统用户表';

-- ----------------------------
-- Records of user
-- ----------------------------
BEGIN;
INSERT INTO `user` (`id`, `user_name`, `display_name`, `password_hash`, `email`, `mobile`, `avatar`, `role_code`, `status`, `last_login_time`, `last_login_ip`, `password_updated_time`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (1, 'admin', '系统管理员', 'scrypt$25be2879d4ade92af7cf0c69970acfa6$34d92ddfe0c0181558d81a4d87a4ff539ae735d6873ca974567efcc92970c3ddad4cbd7f28fc9397489b6c185cf732be267143ce68581a70294d98f43775b04c', NULL, NULL, NULL, 'admin', 1, '2026-06-11 18:32:18', '127.0.0.1', NULL, '2026-05-26 18:03:16', 'system', '2026-06-11 18:32:18', 'system', 0);
INSERT INTO `user` (`id`, `user_name`, `display_name`, `password_hash`, `email`, `mobile`, `avatar`, `role_code`, `status`, `last_login_time`, `last_login_ip`, `password_updated_time`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (2, 'analyst', '分析师', 'scrypt$25be2879d4ade92af7cf0c69970acfa6$34d92ddfe0c0181558d81a4d87a4ff539ae735d6873ca974567efcc92970c3ddad4cbd7f28fc9397489b6c185cf732be267143ce68581a70294d98f43775b04c', NULL, NULL, NULL, 'analyst', 1, '2026-06-02 13:52:02', '::1', NULL, '2026-05-26 18:03:16', 'system', '2026-06-02 13:52:02', 'system', 0);
INSERT INTO `user` (`id`, `user_name`, `display_name`, `password_hash`, `email`, `mobile`, `avatar`, `role_code`, `status`, `last_login_time`, `last_login_ip`, `password_updated_time`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`) VALUES (3, 'viewer', '只读用户', 'scrypt$25be2879d4ade92af7cf0c69970acfa6$34d92ddfe0c0181558d81a4d87a4ff539ae735d6873ca974567efcc92970c3ddad4cbd7f28fc9397489b6c185cf732be267143ce68581a70294d98f43775b04c', NULL, NULL, NULL, 'viewer', 1, NULL, NULL, NULL, '2026-05-26 18:03:16', 'system', '2026-05-26 18:03:16', 'system', 0);
COMMIT;

-- ----------------------------
-- Table structure for user_login_log
-- ----------------------------
DROP TABLE IF EXISTS `user_login_log`;
CREATE TABLE `user_login_log` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint unsigned DEFAULT NULL COMMENT '用户ID',
  `user_name` varchar(64) NOT NULL COMMENT '登录账号',
  `login_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '登录时间',
  `login_ip` varchar(64) DEFAULT NULL COMMENT '登录IP',
  `user_agent` varchar(500) DEFAULT NULL COMMENT '浏览器User-Agent',
  `status` varchar(20) NOT NULL COMMENT '登录结果：success/failed',
  `fail_reason` varchar(255) DEFAULT NULL COMMENT '失败原因',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_user_name` (`user_name`),
  KEY `idx_login_time` (`login_time`),
  CONSTRAINT `fk_user_login_log_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户登录日志表';

-- ----------------------------
-- Records of user_login_log
-- ----------------------------
BEGIN;
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (1, 2, 'analyst', '2026-05-26 18:03:49', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (2, 1, 'admin', '2026-05-31 01:42:36', '::1', 'curl/8.7.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (3, 1, 'admin', '2026-05-31 01:42:45', '::1', 'curl/8.7.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (4, 1, 'admin', '2026-05-31 01:43:38', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (5, 1, 'admin', '2026-05-31 01:46:44', '::1', 'curl/8.7.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (6, 1, 'admin', '2026-05-31 01:50:04', '::1', 'curl/8.7.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (7, 2, 'analyst', '2026-06-02 13:52:02', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (8, 1, 'admin', '2026-06-02 14:03:34', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (9, 1, 'admin', '2026-06-02 14:17:56', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (10, 1, 'admin', '2026-06-02 14:23:50', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (11, 1, 'admin', '2026-06-02 17:59:37', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (12, 1, 'admin', '2026-06-02 23:01:37', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (13, 1, 'admin', '2026-06-02 23:29:35', '172.20.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (14, 1, 'admin', '2026-06-02 23:40:52', '172.20.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (15, 1, 'admin', '2026-06-03 16:31:53', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'failed', '用户名或密码错误');
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (16, 1, 'admin', '2026-06-03 16:31:57', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (17, 1, 'admin', '2026-06-04 00:37:43', '172.20.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/148.0.7778.100 Mobile/15E148 Safari/604.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (18, 1, 'admin', '2026-06-04 09:27:07', '172.20.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (19, 1, 'admin', '2026-06-04 16:32:38', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (20, 1, 'admin', '2026-06-04 18:24:52', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (21, 1, 'admin', '2026-06-05 20:23:20', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (22, 1, 'admin', '2026-06-06 22:15:35', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (23, 1, 'admin', '2026-06-08 15:07:25', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (24, 1, 'admin', '2026-06-09 20:20:45', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (25, 1, 'admin', '2026-06-09 20:59:25', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (26, 1, 'admin', '2026-06-09 23:36:45', '172.20.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (27, 1, 'admin', '2026-06-09 23:48:51', '172.20.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.45 Mobile/15E148 Safari/604.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (28, 1, 'admin', '2026-06-10 07:49:54', '172.20.0.1', 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_3_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.45 Mobile/15E148 Safari/604.1', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (29, 1, 'admin', '2026-06-10 16:55:29', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (30, 1, 'admin', '2026-06-10 17:40:35', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (31, 1, 'admin', '2026-06-10 17:42:32', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
INSERT INTO `user_login_log` (`id`, `user_id`, `user_name`, `login_time`, `login_ip`, `user_agent`, `status`, `fail_reason`) VALUES (32, 1, 'admin', '2026-06-11 18:32:18', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'success', NULL);
COMMIT;

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role_id` bigint unsigned NOT NULL COMMENT '角色ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`,`role_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_user_role_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`),
  CONSTRAINT `fk_user_role_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户角色关系表';

-- ----------------------------
-- Records of user_role
-- ----------------------------
BEGIN;
INSERT INTO `user_role` (`id`, `user_id`, `role_id`, `create_time`, `created_by`) VALUES (1, 1, 1, '2026-05-26 18:03:16', 'system');
INSERT INTO `user_role` (`id`, `user_id`, `role_id`, `create_time`, `created_by`) VALUES (2, 2, 2, '2026-05-26 18:03:16', 'system');
INSERT INTO `user_role` (`id`, `user_id`, `role_id`, `create_time`, `created_by`) VALUES (3, 3, 3, '2026-05-26 18:03:16', 'system');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
