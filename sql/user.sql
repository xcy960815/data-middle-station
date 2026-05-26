/*
  User authentication tables for data-middle-station.

  Password storage recommendation:
  - Store only strong one-way hashes in password_hash.
  - Use bcrypt/argon2id in application code.
  - Never store plaintext passwords or reversible encrypted passwords.
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `user_login_log`;
DROP TABLE IF EXISTS `analyze_role_permission`;
DROP TABLE IF EXISTS `user_role`;
DROP TABLE IF EXISTS `role`;
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统用户表';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户登录日志表';

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色表';

CREATE TABLE `user_role` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `user_id` bigint unsigned NOT NULL COMMENT '用户ID',
  `role_id` bigint unsigned NOT NULL COMMENT '角色ID',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_role` (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_user_role_user_id` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `fk_user_role_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户角色关系表';

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
  UNIQUE KEY `uk_analyze_role_permission` (`analyze_id`, `role_id`),
  KEY `idx_analyze_id` (`analyze_id`),
  KEY `idx_role_id` (`role_id`),
  KEY `idx_permission_type` (`permission_type`),
  CONSTRAINT `fk_analyze_role_permission_analyze_id` FOREIGN KEY (`analyze_id`) REFERENCES `analyze` (`id`),
  CONSTRAINT `fk_analyze_role_permission_role_id` FOREIGN KEY (`role_id`) REFERENCES `role` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分析角色资源权限表';

/*
  Example admin seed.
  Replace password_hash with a bcrypt/argon2id hash generated by the application.
*/
INSERT INTO `user` (
  `user_name`,
  `display_name`,
  `password_hash`,
  `role_code`,
  `status`,
  `created_by`,
  `updated_by`
) VALUES
(
  'admin',
  '系统管理员',
  'scrypt$25be2879d4ade92af7cf0c69970acfa6$34d92ddfe0c0181558d81a4d87a4ff539ae735d6873ca974567efcc92970c3ddad4cbd7f28fc9397489b6c185cf732be267143ce68581a70294d98f43775b04c',
  'admin',
  1,
  'system',
  'system'
),
(
  'analyst',
  '分析师',
  'scrypt$25be2879d4ade92af7cf0c69970acfa6$34d92ddfe0c0181558d81a4d87a4ff539ae735d6873ca974567efcc92970c3ddad4cbd7f28fc9397489b6c185cf732be267143ce68581a70294d98f43775b04c',
  'analyst',
  1,
  'system',
  'system'
),
(
  'viewer',
  '只读用户',
  'scrypt$25be2879d4ade92af7cf0c69970acfa6$34d92ddfe0c0181558d81a4d87a4ff539ae735d6873ca974567efcc92970c3ddad4cbd7f28fc9397489b6c185cf732be267143ce68581a70294d98f43775b04c',
  'viewer',
  1,
  'system',
  'system'
);

INSERT INTO `role` (`role_code`, `role_name`, `role_desc`, `created_by`, `updated_by`) VALUES
('admin', '管理员', '拥有全部分析管理权限', 'system', 'system'),
('analyst', '分析师', '可编辑授权范围内的分析', 'system', 'system'),
('viewer', '只读用户', '仅可查看授权范围内的分析', 'system', 'system');

INSERT INTO `user_role` (`user_id`, `role_id`, `created_by`)
SELECT u.id, r.id, 'system'
FROM `user` u
JOIN `role` r ON r.role_code = u.role_code
WHERE u.user_name IN ('admin', 'analyst', 'viewer');

INSERT INTO `analyze_role_permission` (
  `analyze_id`,
  `role_id`,
  `permission_type`,
  `created_by`,
  `updated_by`
)
SELECT a.id, r.id, 'edit', 'system', 'system'
FROM `analyze` a
JOIN `role` r ON r.role_code = 'analyst'
WHERE a.analyze_name IN ('销售数据看板', '城市-月份-降雨量（柱状图）');

SET FOREIGN_KEY_CHECKS = 1;
