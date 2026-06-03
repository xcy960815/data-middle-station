-- 数据集基础种子数据
-- 作用：为数据集页面预置几份可直接查看和预览的数据集。
-- 前置条件：
-- 1. 已导入 sql/data_middle_station.sql 中的数据源/数据集表结构。
-- 2. 业务库 kanban_data 中已存在 operation_analysis、inventory_turnover、campaign_conversion、city_temperature。
-- 3. 本脚本在主业务库 data_middle_station 中执行。

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 内置业务数据源。若已存在 id=1，则不覆盖连接配置。
INSERT INTO `data_source`
  (`id`, `source_name`, `source_desc`, `source_type`, `host`, `port`, `database_name`, `username`, `status`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`)
VALUES
  (1, '业务数据源', '内置业务分析库，对应 kanban_data。', 'mysql', 'mysql-data', 3306, 'kanban_data', 'root', 'enabled', NOW(), 'system', NOW(), 'system', 0)
ON DUPLICATE KEY UPDATE
  `is_deleted` = 0;

-- 表元数据。用于数据源页面展示和后续创建数据集时选择物理表。
INSERT INTO `data_source_table`
  (`data_source_id`, `table_name`, `table_comment`, `table_rows`, `last_sync_time`, `is_deleted`)
VALUES
  (1, 'operation_analysis', '运营分析统计表', 100, NOW(), 0),
  (1, 'inventory_turnover', '库存周转数据', 9, NOW(), 0),
  (1, 'campaign_conversion', '营销活动转化数据', 9, NOW(), 0),
  (1, 'city_temperature', '城市月度气温表', 24, NOW(), 0)
ON DUPLICATE KEY UPDATE
  `table_comment` = VALUES(`table_comment`),
  `table_rows` = VALUES(`table_rows`),
  `last_sync_time` = VALUES(`last_sync_time`),
  `is_deleted` = 0;

-- 字段元数据。
INSERT INTO `data_source_column`
  (`data_source_id`, `table_name`, `column_name`, `column_type`, `column_comment`, `nullable`, `ordinal_position`, `is_deleted`)
VALUES
  (1, 'operation_analysis', 'id', 'bigint', '主键ID', 'NO', 1, 0),
  (1, 'operation_analysis', 'date', 'date', '统计日期', 'NO', 2, 0),
  (1, 'operation_analysis', 'region', 'varchar(20)', '地区', 'NO', 3, 0),
  (1, 'operation_analysis', 'platform', 'varchar(20)', '平台', 'NO', 4, 0),
  (1, 'operation_analysis', 'product_category', 'varchar(20)', '产品类别', 'NO', 5, 0),
  (1, 'operation_analysis', 'new_users', 'int', '新增用户数', 'NO', 6, 0),
  (1, 'operation_analysis', 'active_users', 'int', '活跃用户数', 'NO', 7, 0),
  (1, 'operation_analysis', 'total_users', 'int', '累计用户数', 'NO', 8, 0),
  (1, 'operation_analysis', 'retention_rate', 'decimal(5,2)', '次日留存率(%)', 'NO', 9, 0),
  (1, 'operation_analysis', 'conversion_rate', 'decimal(5,2)', '转化率(%)', 'NO', 10, 0),
  (1, 'operation_analysis', 'avg_online_time', 'int', '平均在线时长(分钟)', 'NO', 11, 0),
  (1, 'operation_analysis', 'pv', 'int', '页面访问量', 'NO', 12, 0),
  (1, 'operation_analysis', 'uv', 'int', '独立访客数', 'NO', 13, 0),
  (1, 'operation_analysis', 'bounce_rate', 'decimal(5,2)', '跳出率(%)', 'NO', 14, 0),
  (1, 'operation_analysis', 'revenue', 'decimal(10,2)', '收入(元)', 'NO', 15, 0),
  (1, 'operation_analysis', 'cost', 'decimal(10,2)', '成本(元)', 'NO', 16, 0),
  (1, 'operation_analysis', 'roi', 'decimal(5,2)', '投资回报率(%)', 'NO', 17, 0),

  (1, 'inventory_turnover', 'id', 'bigint unsigned', '主键ID', 'NO', 1, 0),
  (1, 'inventory_turnover', 'warehouse', 'varchar(50)', '仓库', 'NO', 2, 0),
  (1, 'inventory_turnover', 'category', 'varchar(50)', '品类', 'NO', 3, 0),
  (1, 'inventory_turnover', 'stock_qty', 'int', '库存数量', 'NO', 4, 0),
  (1, 'inventory_turnover', 'sold_qty', 'int', '售出数量', 'NO', 5, 0),
  (1, 'inventory_turnover', 'turnover_days', 'decimal(10,2)', '周转天数', 'NO', 6, 0),
  (1, 'inventory_turnover', 'stat_month', 'varchar(20)', '统计月份', 'NO', 7, 0),

  (1, 'campaign_conversion', 'id', 'bigint unsigned', '主键ID', 'NO', 1, 0),
  (1, 'campaign_conversion', 'campaign_name', 'varchar(100)', '活动名称', 'NO', 2, 0),
  (1, 'campaign_conversion', 'channel', 'varchar(50)', '渠道', 'NO', 3, 0),
  (1, 'campaign_conversion', 'impressions', 'int', '曝光数', 'NO', 4, 0),
  (1, 'campaign_conversion', 'clicks', 'int', '点击数', 'NO', 5, 0),
  (1, 'campaign_conversion', 'conversions', 'int', '转化数', 'NO', 6, 0),
  (1, 'campaign_conversion', 'cost', 'decimal(12,2)', '投放成本', 'NO', 7, 0),
  (1, 'campaign_conversion', 'conversion_rate', 'decimal(8,4)', '转化率', 'NO', 8, 0),

  (1, 'city_temperature', 'id', 'int', '主键ID', 'NO', 1, 0),
  (1, 'city_temperature', 'month', 'varchar(3)', '月份', 'NO', 2, 0),
  (1, 'city_temperature', 'city', 'varchar(32)', '城市名称', 'NO', 3, 0),
  (1, 'city_temperature', 'temperature', 'decimal(4,1)', '月均气温', 'NO', 4, 0)
ON DUPLICATE KEY UPDATE
  `column_type` = VALUES(`column_type`),
  `column_comment` = VALUES(`column_comment`),
  `nullable` = VALUES(`nullable`),
  `ordinal_position` = VALUES(`ordinal_position`),
  `is_deleted` = 0;

-- 数据集基础信息。
INSERT INTO `dataset`
  (`id`, `dataset_name`, `dataset_desc`, `data_source_id`, `base_table`, `status`, `current_config_id`, `create_time`, `created_by`, `update_time`, `updated_by`, `is_deleted`)
VALUES
  (9001, '运营分析数据集', '按日期、地区、平台和产品类别分析用户、流量、收入和转化指标。', 1, 'operation_analysis', 'enabled', 9001, NOW(), 'system', NOW(), 'system', 0),
  (9002, '库存周转数据集', '按仓库、品类和月份查看库存数量、售出数量与周转天数。', 1, 'inventory_turnover', 'enabled', 9002, NOW(), 'system', NOW(), 'system', 0),
  (9003, '营销转化数据集', '按活动和渠道查看曝光、点击、转化、成本和转化率。', 1, 'campaign_conversion', 'enabled', 9003, NOW(), 'system', NOW(), 'system', 0),
  (9004, '城市气温数据集', '按月份和城市查看月均气温。', 1, 'city_temperature', 'enabled', 9004, NOW(), 'system', NOW(), 'system', 0)
ON DUPLICATE KEY UPDATE
  `dataset_name` = VALUES(`dataset_name`),
  `dataset_desc` = VALUES(`dataset_desc`),
  `data_source_id` = VALUES(`data_source_id`),
  `base_table` = VALUES(`base_table`),
  `status` = VALUES(`status`),
  `current_config_id` = VALUES(`current_config_id`),
  `update_time` = NOW(),
  `updated_by` = 'system',
  `is_deleted` = 0;

-- 数据集字段配置。字段标识保持英文，用 display_name 表达业务语义。
INSERT INTO `dataset_config`
  (`id`, `dataset_id`, `version_no`, `fields_config`, `change_note`, `create_time`, `created_by`, `update_time`, `is_deleted`)
VALUES
  (
    9001,
    9001,
    1,
    JSON_ARRAY(
      JSON_OBJECT('sourceColumnName', 'id', 'fieldName', 'id', 'displayName', '主键ID', 'fieldType', 'dimension', 'dataType', 'bigint', 'aggregationType', NULL, 'expression', '', 'visible', false, 'sortOrder', 1),
      JSON_OBJECT('sourceColumnName', 'date', 'fieldName', 'date', 'displayName', '统计日期', 'fieldType', 'dimension', 'dataType', 'date', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 2),
      JSON_OBJECT('sourceColumnName', 'region', 'fieldName', 'region', 'displayName', '地区', 'fieldType', 'dimension', 'dataType', 'varchar(20)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 3),
      JSON_OBJECT('sourceColumnName', 'platform', 'fieldName', 'platform', 'displayName', '平台', 'fieldType', 'dimension', 'dataType', 'varchar(20)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 4),
      JSON_OBJECT('sourceColumnName', 'product_category', 'fieldName', 'product_category', 'displayName', '产品类别', 'fieldType', 'dimension', 'dataType', 'varchar(20)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 5),
      JSON_OBJECT('sourceColumnName', 'new_users', 'fieldName', 'new_users', 'displayName', '新增用户数', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 6),
      JSON_OBJECT('sourceColumnName', 'active_users', 'fieldName', 'active_users', 'displayName', '活跃用户数', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 7),
      JSON_OBJECT('sourceColumnName', 'retention_rate', 'fieldName', 'retention_rate', 'displayName', '次日留存率(%)', 'fieldType', 'metric', 'dataType', 'decimal(5,2)', 'aggregationType', 'avg', 'expression', '', 'visible', true, 'sortOrder', 8),
      JSON_OBJECT('sourceColumnName', 'conversion_rate', 'fieldName', 'conversion_rate', 'displayName', '转化率(%)', 'fieldType', 'metric', 'dataType', 'decimal(5,2)', 'aggregationType', 'avg', 'expression', '', 'visible', true, 'sortOrder', 9),
      JSON_OBJECT('sourceColumnName', 'revenue', 'fieldName', 'revenue', 'displayName', '收入(元)', 'fieldType', 'metric', 'dataType', 'decimal(10,2)', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 10),
      JSON_OBJECT('sourceColumnName', 'cost', 'fieldName', 'cost', 'displayName', '成本(元)', 'fieldType', 'metric', 'dataType', 'decimal(10,2)', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 11),
      JSON_OBJECT('sourceColumnName', 'roi', 'fieldName', 'roi', 'displayName', '投资回报率(%)', 'fieldType', 'metric', 'dataType', 'decimal(5,2)', 'aggregationType', 'avg', 'expression', '', 'visible', true, 'sortOrder', 12)
    ),
    '初始化运营分析字段配置',
    NOW(),
    'system',
    NOW(),
    0
  ),
  (
    9002,
    9002,
    1,
    JSON_ARRAY(
      JSON_OBJECT('sourceColumnName', 'id', 'fieldName', 'id', 'displayName', '主键ID', 'fieldType', 'dimension', 'dataType', 'bigint unsigned', 'aggregationType', NULL, 'expression', '', 'visible', false, 'sortOrder', 1),
      JSON_OBJECT('sourceColumnName', 'warehouse', 'fieldName', 'warehouse', 'displayName', '仓库', 'fieldType', 'dimension', 'dataType', 'varchar(50)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 2),
      JSON_OBJECT('sourceColumnName', 'category', 'fieldName', 'category', 'displayName', '品类', 'fieldType', 'dimension', 'dataType', 'varchar(50)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 3),
      JSON_OBJECT('sourceColumnName', 'stat_month', 'fieldName', 'stat_month', 'displayName', '统计月份', 'fieldType', 'dimension', 'dataType', 'varchar(20)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 4),
      JSON_OBJECT('sourceColumnName', 'stock_qty', 'fieldName', 'stock_qty', 'displayName', '库存数量', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 5),
      JSON_OBJECT('sourceColumnName', 'sold_qty', 'fieldName', 'sold_qty', 'displayName', '售出数量', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 6),
      JSON_OBJECT('sourceColumnName', 'turnover_days', 'fieldName', 'turnover_days', 'displayName', '周转天数', 'fieldType', 'metric', 'dataType', 'decimal(10,2)', 'aggregationType', 'avg', 'expression', '', 'visible', true, 'sortOrder', 7)
    ),
    '初始化库存周转字段配置',
    NOW(),
    'system',
    NOW(),
    0
  ),
  (
    9003,
    9003,
    1,
    JSON_ARRAY(
      JSON_OBJECT('sourceColumnName', 'id', 'fieldName', 'id', 'displayName', '主键ID', 'fieldType', 'dimension', 'dataType', 'bigint unsigned', 'aggregationType', NULL, 'expression', '', 'visible', false, 'sortOrder', 1),
      JSON_OBJECT('sourceColumnName', 'campaign_name', 'fieldName', 'campaign_name', 'displayName', '活动名称', 'fieldType', 'dimension', 'dataType', 'varchar(100)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 2),
      JSON_OBJECT('sourceColumnName', 'channel', 'fieldName', 'channel', 'displayName', '渠道', 'fieldType', 'dimension', 'dataType', 'varchar(50)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 3),
      JSON_OBJECT('sourceColumnName', 'impressions', 'fieldName', 'impressions', 'displayName', '曝光数', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 4),
      JSON_OBJECT('sourceColumnName', 'clicks', 'fieldName', 'clicks', 'displayName', '点击数', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 5),
      JSON_OBJECT('sourceColumnName', 'conversions', 'fieldName', 'conversions', 'displayName', '转化数', 'fieldType', 'metric', 'dataType', 'int', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 6),
      JSON_OBJECT('sourceColumnName', 'cost', 'fieldName', 'cost', 'displayName', '投放成本', 'fieldType', 'metric', 'dataType', 'decimal(12,2)', 'aggregationType', 'sum', 'expression', '', 'visible', true, 'sortOrder', 7),
      JSON_OBJECT('sourceColumnName', 'conversion_rate', 'fieldName', 'conversion_rate', 'displayName', '转化率', 'fieldType', 'metric', 'dataType', 'decimal(8,4)', 'aggregationType', 'avg', 'expression', '', 'visible', true, 'sortOrder', 8)
    ),
    '初始化营销转化字段配置',
    NOW(),
    'system',
    NOW(),
    0
  ),
  (
    9004,
    9004,
    1,
    JSON_ARRAY(
      JSON_OBJECT('sourceColumnName', 'id', 'fieldName', 'id', 'displayName', '主键ID', 'fieldType', 'dimension', 'dataType', 'int', 'aggregationType', NULL, 'expression', '', 'visible', false, 'sortOrder', 1),
      JSON_OBJECT('sourceColumnName', 'month', 'fieldName', 'month', 'displayName', '月份', 'fieldType', 'dimension', 'dataType', 'varchar(3)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 2),
      JSON_OBJECT('sourceColumnName', 'city', 'fieldName', 'city', 'displayName', '城市名称', 'fieldType', 'dimension', 'dataType', 'varchar(32)', 'aggregationType', NULL, 'expression', '', 'visible', true, 'sortOrder', 3),
      JSON_OBJECT('sourceColumnName', 'temperature', 'fieldName', 'temperature', 'displayName', '月均气温', 'fieldType', 'metric', 'dataType', 'decimal(4,1)', 'aggregationType', 'avg', 'expression', '', 'visible', true, 'sortOrder', 4)
    ),
    '初始化城市气温字段配置',
    NOW(),
    'system',
    NOW(),
    0
  )
ON DUPLICATE KEY UPDATE
  `fields_config` = VALUES(`fields_config`),
  `change_note` = VALUES(`change_note`),
  `update_time` = NOW(),
  `is_deleted` = 0;

SET FOREIGN_KEY_CHECKS = 1;
