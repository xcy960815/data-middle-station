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

 Date: 09/06/2026 21:13:53
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
) ENGINE=InnoDB AUTO_INCREMENT=107 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='图表信息表';

-- ----------------------------
-- Table structure for analyze_config
-- ----------------------------
DROP TABLE IF EXISTS `analyze_config`;
CREATE TABLE `analyze_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `analyze_id` bigint unsigned NOT NULL COMMENT '分析ID',
  `version_no` int unsigned NOT NULL COMMENT '版本号',
  `data_source` varchar(100) DEFAULT NULL COMMENT '数据源表名',
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
  KEY `idx_analyze_config_create_time` (`create_time`)
) ENGINE=InnoDB AUTO_INCREMENT=114 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='分析配置历史版本表';

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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='看板信息表';

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
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源字段元数据';

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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据源表元数据';

-- ----------------------------
-- Table structure for dataset
-- ----------------------------
DROP TABLE IF EXISTS `dataset`;
CREATE TABLE `dataset` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dataset_name` varchar(100) NOT NULL COMMENT '数据集名称',
  `dataset_desc` varchar(500) DEFAULT NULL COMMENT '数据集描述',
  `data_source_id` bigint unsigned NOT NULL COMMENT '数据源ID',
  `base_table` varchar(128) NOT NULL COMMENT '基础表名',
  `status` varchar(20) NOT NULL DEFAULT 'enabled' COMMENT '状态：enabled/disabled',
  `current_config_id` bigint unsigned DEFAULT NULL COMMENT '当前配置版本ID',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `created_by` varchar(100) DEFAULT NULL COMMENT '创建人',
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `updated_by` varchar(100) DEFAULT NULL COMMENT '更新人',
  `is_deleted` tinyint(1) DEFAULT '0' COMMENT '是否删除：0-未删除，1-已删除',
  PRIMARY KEY (`id`),
  KEY `idx_dataset_name` (`dataset_name`),
  KEY `idx_dataset_data_source` (`data_source_id`),
  KEY `idx_dataset_update_time` (`update_time`),
  CONSTRAINT `fk_dataset_data_source_id` FOREIGN KEY (`data_source_id`) REFERENCES `data_source` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据集表';

-- ----------------------------
-- Table structure for dataset_config
-- ----------------------------
DROP TABLE IF EXISTS `dataset_config`;
CREATE TABLE `dataset_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `dataset_id` bigint unsigned NOT NULL COMMENT '数据集ID',
  `version_no` int unsigned NOT NULL COMMENT '版本号',
  `fields_config` json DEFAULT NULL COMMENT '字段配置快照',
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
) ENGINE=InnoDB AUTO_INCREMENT=9005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='数据集配置历史版本表';

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
) ENGINE=InnoDB AUTO_INCREMENT=1490 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='定时邮件任务执行日志表';

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
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户登录日志表';

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

SET FOREIGN_KEY_CHECKS = 1;
