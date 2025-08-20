/*
 降雨量数据表

 包含伦敦和柏林的月均降雨量数据
 File Encoding         : 65001

 Date: 03/06/2025 22:31:53
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for rainfall_data
-- ----------------------------
DROP TABLE IF EXISTS `rainfall_data`;
CREATE TABLE `rainfall_data` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` varchar(50) NOT NULL COMMENT '城市名称',
  `country` varchar(50) NOT NULL COMMENT '国家',
  `region` varchar(50) NOT NULL COMMENT '区域',
  `month` varchar(10) NOT NULL COMMENT '月份',
  `rainfall` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '月均降雨量 (mm)',
  `temperature_c` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '月均气温 (°C)',
  `humidity` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '平均相对湿度 (%)',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name_month` (`name`, `month`),
  KEY `idx_country_month` (`country`, `month`),
  KEY `idx_region_month` (`region`, `month`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='城市月度气象统计表（支持多指标与多分组）';

-- ----------------------------
-- Records of rainfall_data
-- ----------------------------
BEGIN;
-- London
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Jan.', 18.9, 5.0, 85.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Feb.', 28.8, 6.0, 80.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Mar.', 39.3, 8.0, 77.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Apr.', 81.4, 11.0, 75.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'May', 47.0, 15.0, 73.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Jun.', 20.3, 18.0, 70.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Jul.', 24.0, 20.0, 68.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Aug.', 35.6, 20.0, 70.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Sep.', 42.4, 17.0, 75.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Oct.', 42.4, 13.0, 80.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Nov.', 42.4, 9.0, 85.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('London', 'UK', 'Western Europe', 'Dec.', 42.4, 6.0, 87.0, NOW(), NOW());

-- Berlin
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Jan.', 12.4, 0.0, 86.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Feb.', 23.2, 1.0, 83.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Mar.', 34.5, 5.0, 80.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Apr.', 99.7, 9.0, 78.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'May', 52.6, 14.0, 76.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Jun.', 35.5, 17.0, 75.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Jul.', 37.4, 19.0, 74.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Aug.', 42.4, 19.0, 76.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Sep.', 42.4, 15.0, 78.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Oct.', 42.4, 10.0, 82.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Nov.', 42.4, 5.0, 85.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `country`, `region`, `month`, `rainfall`, `temperature_c`, `humidity`, `create_time`, `update_time`) VALUES ('Berlin', 'Germany', 'Central Europe', 'Dec.', 42.4, 2.0, 87.0, NOW(), NOW());
COMMIT;

SET FOREIGN_KEY_CHECKS = 1;
