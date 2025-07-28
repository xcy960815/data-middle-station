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
  `month` varchar(10) NOT NULL COMMENT '月份',
  `rainfall` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '月均降雨量',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_name_month` (`name`, `month`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='城市月均降雨量统计表';

-- ----------------------------
-- Records of rainfall_data
-- ----------------------------
BEGIN;
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Jan.', 18.9, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Feb.', 28.8, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Mar.', 39.3, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Apr.', 81.4, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'May', 47.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Jun.', 20.3, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Jul.', 24.0, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('London', 'Aug.', 35.6, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Jan.', 12.4, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Feb.', 23.2, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Mar.', 34.5, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Apr.', 99.7, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'May', 52.6, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Jun.', 35.5, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Jul.', 37.4, NOW(), NOW());
INSERT INTO `rainfall_data` (`name`, `month`, `rainfall`, `create_time`, `update_time`) VALUES ('Berlin', 'Aug.', 42.4, NOW(), NOW());
COMMIT;

SET FOREIGN_KEY_CHECKS = 1; 