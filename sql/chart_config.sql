-- 图表配置表
CREATE TABLE `chart_config` (
    `id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name` varchar(100) NOT NULL COMMENT '图表名称',
    `type` varchar(50) NOT NULL COMMENT '图表类型',
    `data_source` varchar(100) NOT NULL COMMENT '数据源表名',
    `column` json NOT NULL COMMENT '列配置(JSON格式)',
    `dimension` json NOT NULL COMMENT '维度配置(JSON格式)',
    `filter` json DEFAULT NULL COMMENT '过滤条件(JSON格式)',
    `group` json DEFAULT NULL COMMENT '分组配置(JSON格式)',
    `order` json DEFAULT NULL COMMENT '排序配置(JSON格式)',
    `description` varchar(500) DEFAULT NULL COMMENT '图表描述',
    `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '状态(1:启用 0:禁用)',
    `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_name` (`name`),
    KEY `idx_type` (`type`),
    KEY `idx_data_source` (`data_source`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='图表配置表';

-- 插入示例数据
INSERT INTO `chart_config` 
(`name`, `type`, `data_source`, `column`, `dimension`, `filter`, `group`, `order`, `description`) 
VALUES
('用户增长趋势', 'line', 'operation_analysis',
'["date", "new_users", "active_users", "total_users"]',
'["date"]',
'{"date": {"start": "2023-01-01", "end": "2023-04-10"}}',
'["date"]',
'{"date": "asc"}',
'用户增长趋势分析图表'),

('用户留存分析', 'bar', 'operation_analysis',
'["date", "retention_rate"]',
'["date"]',
'{"date": {"start": "2023-01-01", "end": "2023-04-10"}}',
'["date"]',
'{"date": "asc"}',
'用户留存率分析图表'),

('流量分析', 'line', 'operation_analysis',
'["date", "pv", "uv"]',
'["date"]',
'{"date": {"start": "2023-01-01", "end": "2023-04-10"}}',
'["date"]',
'{"date": "asc"}',
'流量分析图表'),

('收入成本分析', 'line', 'operation_analysis',
'["date", "revenue", "cost", "roi"]',
'["date"]',
'{"date": {"start": "2023-01-01", "end": "2023-04-10"}}',
'["date"]',
'{"date": "asc"}',
'收入成本分析图表'),

('转化率分析', 'line', 'operation_analysis',
'["date", "conversion_rate", "bounce_rate"]',
'["date"]',
'{"date": {"start": "2023-01-01", "end": "2023-04-10"}}',
'["date"]',
'{"date": "asc"}',
'转化率和跳出率分析图表'); 