DROP TABLE IF EXISTS `charts`;
CREATE TABLE `charts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `chart_name` varchar(255) DEFAULT NULL COMMENT '图表名称',
  `chart_type` varchar(100) DEFAULT NULL COMMENT '图表类型',
  `chart_config_id` bigint(20) NOT NULL COMMENT '图表配置ID',
  `view_count` int unsigned DEFAULT '0' COMMENT '访问次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`),
  KEY `idx_chart_config_id` (`chart_config_id`),
  CONSTRAINT `fk_chart_config` FOREIGN KEY (`chart_config_id`) REFERENCES `chart_config` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表信息表';

-- 添加chart_config_id字段
ALTER TABLE `charts` 
ADD COLUMN `chart_config_id` bigint(20) NOT NULL COMMENT '图表配置ID' AFTER `chart_type`,
ADD INDEX `idx_chart_config_id` (`chart_config_id`),
ADD CONSTRAINT `fk_chart_config` FOREIGN KEY (`chart_config_id`) REFERENCES `chart_config` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1; 