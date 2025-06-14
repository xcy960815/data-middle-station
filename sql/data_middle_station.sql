/*
 Navicat Premium Data Transfer

 Source Server         : study-java-docker-container
 Source Server Type    : MySQL
 Source Server Version : 80402 (8.4.2)
 Source Host           : 192.168.100.1:3308
 Source Schema         : data_middle_station

 Target Server Type    : MySQL
 Target Server Version : 80402 (8.4.2)
 File Encoding         : 65001

 Date: 03/06/2025 22:31:41
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for analyse
-- ----------------------------
DROP TABLE IF EXISTS `analyse`;
CREATE TABLE `analyse` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `analyse_name` varchar(255) DEFAULT NULL COMMENT '分析名称',
  `view_count` int unsigned DEFAULT '0' COMMENT '访问次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `chart_config_id` bigint DEFAULT NULL COMMENT '图表配置ID',
  `analyse_desc` varchar(255) DEFAULT NULL COMMENT '分析描述',
  `is_deleted` tinyint(1) DEFAULT '1' COMMENT '是否删除：0-已删除，1-未删除',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表信息表';

-- ----------------------------
-- Records of analyse
-- ----------------------------
BEGIN;
INSERT INTO `analyse` (`id`, `analyse_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`, `analyse_desc`, `is_deleted`) VALUES (1, '销售数据看板', 445, '2025-05-30 02:19:10', 'Alice', '2025-06-03 14:31:14', 'system', 5, '销售数据看板的描述', 1);
INSERT INTO `analyse` (`id`, `analyse_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`, `analyse_desc`, `is_deleted`) VALUES (2, '运营分析图表', 230, '2025-05-30 02:19:10', 'Bob', '2025-05-30 02:19:37', 'Bob', NULL, NULL, 1);
INSERT INTO `analyse` (`id`, `analyse_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`, `analyse_desc`, `is_deleted`) VALUES (3, '用户行为统计', 95, '2025-05-30 02:19:10', 'Charlie', '2025-05-30 02:19:40', 'Charlie', NULL, NULL, 1);
INSERT INTO `analyse` (`id`, `analyse_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`, `analyse_desc`, `is_deleted`) VALUES (4, '库存监控图表', 45, '2025-05-30 02:19:10', 'David', '2025-05-30 02:19:43', 'David', NULL, NULL, 1);
INSERT INTO `analyse` (`id`, `analyse_name`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`, `analyse_desc`, `is_deleted`) VALUES (5, '收入趋势图表', 320, '2025-05-30 02:19:10', 'Eve', '2025-05-30 02:19:46', 'Eve', NULL, NULL, 1);
COMMIT;

-- ----------------------------
-- Table structure for chart_config
-- ----------------------------
DROP TABLE IF EXISTS `chart_config`;
CREATE TABLE `chart_config` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `data_source` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL COMMENT '数据源表名',
  `column` json DEFAULT NULL COMMENT '列配置(JSON格式)',
  `dimension` json DEFAULT NULL COMMENT '维度配置(JSON格式)',
  `filter` json DEFAULT NULL COMMENT '过滤条件(JSON格式)',
  `group` json DEFAULT NULL COMMENT '分组配置(JSON格式)',
  `order` json DEFAULT NULL COMMENT '排序配置(JSON格式)',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `limit` bigint DEFAULT NULL COMMENT 'sql limit条数',
  `chart_type` varchar(50) DEFAULT NULL COMMENT '图标类型',
  PRIMARY KEY (`id`),
  KEY `idx_data_source` (`data_source`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表配置表';

-- ----------------------------
-- Records of chart_config
-- ----------------------------
BEGIN;
INSERT INTO `chart_config` (`id`, `data_source`, `column`, `dimension`, `filter`, `group`, `order`, `create_time`, `update_time`, `limit`, `chart_type`) VALUES (5, 'operationAnalysis', '[{\"alias\": \"主键ID\", \"columnName\": \"id\", \"columnType\": \"number\", \"displayName\": \"主键ID\", \"columnComment\": \"主键ID\"}, {\"alias\": \"统计日期\", \"columnName\": \"date\", \"columnType\": \"date\", \"displayName\": \"统计日期\", \"columnComment\": \"统计日期\"}, {\"alias\": \"地区\", \"columnName\": \"region\", \"columnType\": \"string\", \"displayName\": \"地区\", \"columnComment\": \"地区\"}, {\"alias\": \"平台\", \"columnName\": \"platform\", \"columnType\": \"string\", \"displayName\": \"平台\", \"columnComment\": \"平台\"}, {\"alias\": \"产品类别\", \"columnName\": \"product_category\", \"columnType\": \"string\", \"displayName\": \"产品类别\", \"columnComment\": \"产品类别\"}, {\"alias\": \"新增用户数\", \"columnName\": \"new_users\", \"columnType\": \"number\", \"displayName\": \"新增用户数\", \"columnComment\": \"新增用户数\"}, {\"alias\": \"活跃用户数\", \"columnName\": \"active_users\", \"columnType\": \"number\", \"displayName\": \"活跃用户数\", \"columnComment\": \"活跃用户数\"}, {\"alias\": \"累计用户数\", \"columnName\": \"total_users\", \"columnType\": \"number\", \"displayName\": \"累计用户数\", \"columnComment\": \"累计用户数\"}, {\"alias\": \"次日留存率(%)\", \"columnName\": \"retention_rate\", \"columnType\": \"number\", \"displayName\": \"次日留存率(%)\", \"columnComment\": \"次日留存率(%)\"}, {\"alias\": \"转化率(%)\", \"columnName\": \"conversion_rate\", \"columnType\": \"number\", \"displayName\": \"转化率(%)\", \"columnComment\": \"转化率(%)\"}, {\"alias\": \"平均在线时长(分钟)\", \"columnName\": \"avg_online_time\", \"columnType\": \"number\", \"displayName\": \"平均在线时长(分钟)\", \"columnComment\": \"平均在线时长(分钟)\"}, {\"alias\": \"页面访问量\", \"columnName\": \"pv\", \"columnType\": \"number\", \"displayName\": \"页面访问量\", \"columnComment\": \"页面访问量\"}, {\"alias\": \"独立访客数\", \"columnName\": \"uv\", \"columnType\": \"number\", \"displayName\": \"独立访客数\", \"columnComment\": \"独立访客数\"}, {\"alias\": \"跳出率(%)\", \"columnName\": \"bounce_rate\", \"columnType\": \"number\", \"displayName\": \"跳出率(%)\", \"columnComment\": \"跳出率(%)\"}, {\"alias\": \"收入(元)\", \"columnName\": \"revenue\", \"columnType\": \"number\", \"displayName\": \"收入(元)\", \"columnComment\": \"收入(元)\"}, {\"alias\": \"成本(元)\", \"columnName\": \"cost\", \"columnType\": \"number\", \"displayName\": \"成本(元)\", \"columnComment\": \"成本(元)\"}, {\"alias\": \"投资回报率(%)\", \"columnName\": \"roi\", \"columnType\": \"number\", \"displayName\": \"投资回报率(%)\", \"columnComment\": \"投资回报率(%)\"}, {\"alias\": \"创建时间\", \"columnName\": \"create_time\", \"columnType\": \"date\", \"displayName\": \"创建时间\", \"columnComment\": \"创建时间\"}, {\"alias\": \"更新时间\", \"columnName\": \"update_time\", \"columnType\": \"date\", \"displayName\": \"更新时间\", \"columnComment\": \"更新时间\"}]', '[{\"alias\": \"新增用户数\", \"__invalid\": false, \"columnName\": \"new_users\", \"columnType\": \"number\", \"displayName\": \"新增用户数\", \"columnComment\": \"新增用户数\"}, {\"alias\": \"活跃用户数\", \"__invalid\": false, \"columnName\": \"active_users\", \"columnType\": \"number\", \"displayName\": \"活跃用户数\", \"columnComment\": \"活跃用户数\"}]', '[]', '[{\"alias\": \"地区\", \"columnName\": \"region\", \"columnType\": \"string\", \"displayName\": \"地区\", \"columnComment\": \"地区\"}]', '[]', '2025-05-30 14:29:11', '2025-06-03 22:31:09', 1000, 'interval');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
