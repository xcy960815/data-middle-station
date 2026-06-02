-- Global resource permission schema and migration.
-- Apply this script to the data_middle_station database after role/user tables exist.

CREATE TABLE IF NOT EXISTS `resource_role_permission` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `resource_type` varchar(50) NOT NULL COMMENT '资源类型：analyze/dashboard/datasource/folder/scheduled_email',
  `resource_id` bigint unsigned NOT NULL COMMENT '资源ID',
  `role_id` bigint unsigned NOT NULL COMMENT '角色ID',
  `permission_type` varchar(20) NOT NULL DEFAULT 'view' COMMENT '权限类型：view/edit/manage',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_resource_role_permission` (`resource_type`, `resource_id`, `role_id`),
  KEY `idx_resource` (`resource_type`, `resource_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_type` (`permission_type`),
  CONSTRAINT `fk_resource_role_permission_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='通用资源角色权限表';

INSERT INTO `resource_role_permission` (
  `resource_type`,
  `resource_id`,
  `role_id`,
  `permission_type`,
  `created_by`,
  `updated_by`
)
SELECT
  'analyze',
  arp.analyze_id,
  arp.role_id,
  arp.permission_type,
  arp.created_by,
  arp.updated_by
FROM `analyze_role_permission` arp
ON DUPLICATE KEY UPDATE
  `permission_type` = VALUES(`permission_type`),
  `updated_by` = VALUES(`updated_by`),
  `update_time` = CURRENT_TIMESTAMP;
