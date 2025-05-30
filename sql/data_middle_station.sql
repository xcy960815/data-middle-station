/*
 Navicat Premium Dump SQL

 Source Server         : study-java-container-docker
 Source Server Type    : MySQL
 Source Server Version : 80402 (8.4.2)
 Source Host           : localhost:3308
 Source Schema         : data_middle_station

 Target Server Type    : MySQL
 Target Server Version : 80402 (8.4.2)
 File Encoding         : 65001

 Date: 30/05/2025 22:59:13
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for chart
-- ----------------------------
DROP TABLE IF EXISTS `chart`;
CREATE TABLE `chart` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `chart_name` varchar(255) DEFAULT NULL COMMENT '图表名称',
  `chart_type` varchar(100) DEFAULT NULL COMMENT '图表类型',
  `view_count` int unsigned DEFAULT '0' COMMENT '访问次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `chart_config_id` bigint DEFAULT NULL COMMENT '图表配置ID',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表信息表';

-- ----------------------------
-- Records of chart
-- ----------------------------
BEGIN;
INSERT INTO `chart` (`id`, `chart_name`, `chart_type`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`) VALUES (1, '销售数据看板', 'table', 255, '2025-05-30 02:19:10', 'Alice', '2025-05-30 14:58:31', 'system', 5);
INSERT INTO `chart` (`id`, `chart_name`, `chart_type`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`) VALUES (2, '运营分析图表', 'bar', 230, '2025-05-30 02:19:10', 'Bob', '2025-05-30 02:19:37', 'Bob', NULL);
INSERT INTO `chart` (`id`, `chart_name`, `chart_type`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`) VALUES (3, '用户行为统计', 'pie', 95, '2025-05-30 02:19:10', 'Charlie', '2025-05-30 02:19:40', 'Charlie', NULL);
INSERT INTO `chart` (`id`, `chart_name`, `chart_type`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`) VALUES (4, '库存监控图表', 'table', 45, '2025-05-30 02:19:10', 'David', '2025-05-30 02:19:43', 'David', NULL);
INSERT INTO `chart` (`id`, `chart_name`, `chart_type`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`) VALUES (5, '收入趋势图表', 'line', 320, '2025-05-30 02:19:10', 'Eve', '2025-05-30 02:19:46', 'Eve', NULL);
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
  PRIMARY KEY (`id`),
  KEY `idx_data_source` (`data_source`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表配置表';

-- ----------------------------
-- Records of chart_config
-- ----------------------------
BEGIN;
INSERT INTO `chart_config` (`id`, `data_source`, `column`, `dimension`, `filter`, `group`, `order`, `create_time`, `update_time`) VALUES (5, 'operationAnalysis', '[{\"alias\": \"id\", \"columnName\": \"id\", \"columnType\": \"number\", \"displayName\": \"id\", \"columnComment\": \"主键ID\"}, {\"alias\": \"date\", \"columnName\": \"date\", \"columnType\": \"date\", \"displayName\": \"date\", \"columnComment\": \"统计日期\"}, {\"alias\": \"newUsers\", \"columnName\": \"newUsers\", \"columnType\": \"number\", \"displayName\": \"newUsers\", \"columnComment\": \"新增用户数\"}, {\"alias\": \"activeUsers\", \"columnName\": \"activeUsers\", \"columnType\": \"number\", \"displayName\": \"activeUsers\", \"columnComment\": \"活跃用户数\"}, {\"alias\": \"totalUsers\", \"columnName\": \"totalUsers\", \"columnType\": \"number\", \"displayName\": \"totalUsers\", \"columnComment\": \"累计用户数\"}, {\"alias\": \"retentionRate\", \"columnName\": \"retentionRate\", \"columnType\": \"decimal(5,2)\", \"displayName\": \"retentionRate\", \"columnComment\": \"次日留存率(%)\"}, {\"alias\": \"conversionRate\", \"columnName\": \"conversionRate\", \"columnType\": \"decimal(5,2)\", \"displayName\": \"conversionRate\", \"columnComment\": \"转化率(%)\"}, {\"alias\": \"avgOnlineTime\", \"columnName\": \"avgOnlineTime\", \"columnType\": \"number\", \"displayName\": \"avgOnlineTime\", \"columnComment\": \"平均在线时长(分钟)\"}, {\"alias\": \"pv\", \"__invalid\": true, \"columnName\": \"pv\", \"columnType\": \"number\", \"displayName\": \"pv\", \"columnComment\": \"页面访问量\"}, {\"alias\": \"uv\", \"columnName\": \"uv\", \"columnType\": \"number\", \"displayName\": \"uv\", \"columnComment\": \"独立访客数\"}, {\"alias\": \"bounceRate\", \"columnName\": \"bounceRate\", \"columnType\": \"decimal(5,2)\", \"displayName\": \"bounceRate\", \"columnComment\": \"跳出率(%)\"}, {\"alias\": \"revenue\", \"columnName\": \"revenue\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"revenue\", \"columnComment\": \"收入(元)\"}, {\"alias\": \"cost\", \"columnName\": \"cost\", \"columnType\": \"decimal(10,2)\", \"displayName\": \"cost\", \"columnComment\": \"成本(元)\"}, {\"alias\": \"roi\", \"columnName\": \"roi\", \"columnType\": \"decimal(5,2)\", \"displayName\": \"roi\", \"columnComment\": \"投资回报率(%)\"}, {\"alias\": \"createTime\", \"columnName\": \"createTime\", \"columnType\": \"date\", \"displayName\": \"createTime\", \"columnComment\": \"创建时间\"}, {\"alias\": \"updateTime\", \"columnName\": \"updateTime\", \"columnType\": \"date\", \"displayName\": \"updateTime\", \"columnComment\": \"更新时间\"}]', '[{\"alias\": \"pv\", \"__invalid\": true, \"columnName\": \"pv\", \"columnType\": \"number\", \"displayName\": \"pv\", \"columnComment\": \"页面访问量\"}]', '[]', '[{\"alias\": \"date\", \"columnName\": \"date\", \"columnType\": \"date\", \"displayName\": \"date\", \"columnComment\": \"统计日期\"}]', '[]', '2025-05-30 14:29:11', '2025-05-30 14:57:51');
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
