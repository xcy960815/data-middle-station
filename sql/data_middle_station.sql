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

 Date: 30/05/2025 19:59:21
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
INSERT INTO `chart` (`id`, `chart_name`, `chart_type`, `view_count`, `create_time`, `created_by`, `update_time`, `updated_by`, `chart_config_id`) VALUES (1, '销售数据看板', 'line', 186, '2025-05-30 02:19:10', 'Alice', '2025-05-30 10:51:04', 'Alice', NULL);
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
  `name` varchar(100) NOT NULL COMMENT '图表名称',
  `type` varchar(50) NOT NULL COMMENT '图表类型',
  `data_source` varchar(100) NOT NULL COMMENT '数据源表名',
  `column` json NOT NULL COMMENT '列配置(JSON格式)',
  `dimension` json NOT NULL COMMENT '维度配置(JSON格式)',
  `filter` json DEFAULT NULL COMMENT '过滤条件(JSON格式)',
  `group` json DEFAULT NULL COMMENT '分组配置(JSON格式)',
  `order` json DEFAULT NULL COMMENT '排序配置(JSON格式)',
  `description` varchar(500) DEFAULT NULL COMMENT '图表描述',
  `status` tinyint NOT NULL DEFAULT '1' COMMENT '状态(1:启用 0:禁用)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name` (`name`),
  KEY `idx_type` (`type`),
  KEY `idx_data_source` (`data_source`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表配置表';

-- ----------------------------
-- Records of chart_config
-- ----------------------------
BEGIN;
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
