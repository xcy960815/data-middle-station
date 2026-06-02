-- Demo analyze records for dashboard examples.
-- Apply to the data_middle_station database.

SET NAMES utf8mb4;

INSERT INTO `chart_config` (
  `id`,
  `data_source`,
  `columns`,
  `dimensions`,
  `filters`,
  `groups`,
  `orders`,
  `common_chart_config`,
  `private_chart_config`,
  `chart_type`,
  `create_time`,
  `created_by`,
  `update_time`,
  `updated_by`,
  `is_deleted`
) VALUES
(
  101,
  'sales_funnel_daily',
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'stat_date', 'columnType', 'date', 'displayName', '统计日期', 'columnComment', '统计日期'),
    JSON_OBJECT('columnName', 'channel', 'columnType', 'string', 'displayName', '渠道', 'columnComment', '渠道'),
    JSON_OBJECT('columnName', 'visitors', 'columnType', 'number', 'displayName', '访问人数', 'columnComment', '访问人数'),
    JSON_OBJECT('columnName', 'leads', 'columnType', 'number', 'displayName', '线索数', 'columnComment', '线索数'),
    JSON_OBJECT('columnName', 'orders', 'columnType', 'number', 'displayName', '订单数', 'columnComment', '订单数'),
    JSON_OBJECT('columnName', 'revenue', 'columnType', 'number', 'displayName', '收入', 'columnComment', '收入')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'visitors', 'columnType', 'number', 'displayName', '访问人数', 'columnComment', '访问人数'),
    JSON_OBJECT('columnName', 'leads', 'columnType', 'number', 'displayName', '线索数', 'columnComment', '线索数'),
    JSON_OBJECT('columnName', 'orders', 'columnType', 'number', 'displayName', '订单数', 'columnComment', '订单数'),
    JSON_OBJECT('columnName', 'channel', 'columnType', 'string', 'displayName', '渠道', 'columnComment', '渠道')
  ),
  JSON_ARRAY(),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'stat_date', 'columnType', 'date', 'displayName', '统计日期', 'columnComment', '统计日期')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'visitors', 'columnType', 'number', 'displayName', '访问人数', 'columnComment', '访问人数', 'orderType', 'desc', 'aggregationType', 'sum')
  ),
  JSON_OBJECT('limit', 1000, 'analyzeDesc', '', 'shareStrategy', ''),
  JSON_OBJECT(
    'interval', JSON_OBJECT('showLabel', true, 'displayMode', 'levelDisplay', 'horizontalBar', false, 'showPercentage', false, 'horizontalDisplay', false),
    'line', JSON_OBJECT('smooth', true, 'showLabel', false, 'showPoint', true, 'autoDualAxis', false, 'horizontalBar', false),
    'pie', JSON_OBJECT('showLabel', true, 'chartType', 'pie'),
    'table', JSON_OBJECT('bufferRows', 5, 'enableSummary', true, 'headerRowHeight', 30, 'bodyRowHeight', 30, 'summaryRowHeight', 30, 'scrollbarSize', 12, 'minAutoColWidth', 80, 'headerBackground', '#fafafa', 'headerTextColor', '#374151', 'headerFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'headerFontSize', 14, 'bodyBackgroundOdd', '#ffffff', 'bodyBackgroundEven', '#fafafa', 'bodyTextColor', '#374151', 'bodyFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'bodyFontSize', 14, 'summaryBackground', '#f9fafb', 'summaryTextColor', '#374151', 'summaryFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'summaryFontSize', 14, 'highlightCellBackground', '#f5f7fa', 'highlightRowBackground', 'rgba(24, 144, 255, 0.1)', 'highlightColBackground', 'rgba(24, 144, 255, 0.1)', 'enableRowHoverHighlight', false, 'enableColHoverHighlight', false, 'sortActiveColor', '#6b7280', 'conditions', JSON_ARRAY(), 'scrollbarBackground', '#f3f4f6', 'scrollbarThumbBackground', '#d1d5db', 'scrollbarThumbHoverBackground', '#9ca3af', 'borderColor', '#e5e7eb')
  ),
  'interval',
  NOW(),
  'admin',
  NOW(),
  'admin',
  0
),
(
  102,
  'inventory_turnover',
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'warehouse', 'columnType', 'string', 'displayName', '仓库', 'columnComment', '仓库'),
    JSON_OBJECT('columnName', 'category', 'columnType', 'string', 'displayName', '品类', 'columnComment', '品类'),
    JSON_OBJECT('columnName', 'stock_qty', 'columnType', 'number', 'displayName', '库存数量', 'columnComment', '库存数量'),
    JSON_OBJECT('columnName', 'sold_qty', 'columnType', 'number', 'displayName', '售出数量', 'columnComment', '售出数量'),
    JSON_OBJECT('columnName', 'turnover_days', 'columnType', 'number', 'displayName', '周转天数', 'columnComment', '周转天数'),
    JSON_OBJECT('columnName', 'stat_month', 'columnType', 'string', 'displayName', '统计月份', 'columnComment', '统计月份')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'turnover_days', 'columnType', 'number', 'displayName', '周转天数', 'columnComment', '周转天数'),
    JSON_OBJECT('columnName', 'warehouse', 'columnType', 'string', 'displayName', '仓库', 'columnComment', '仓库')
  ),
  JSON_ARRAY(),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'category', 'columnType', 'string', 'displayName', '品类', 'columnComment', '品类')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'turnover_days', 'columnType', 'number', 'displayName', '周转天数', 'columnComment', '周转天数', 'orderType', 'asc', 'aggregationType', 'avg')
  ),
  JSON_OBJECT('limit', 1000, 'analyzeDesc', '', 'shareStrategy', ''),
  JSON_OBJECT(
    'interval', JSON_OBJECT('showLabel', true, 'displayMode', 'levelDisplay', 'horizontalBar', false, 'showPercentage', false, 'horizontalDisplay', false),
    'line', JSON_OBJECT('smooth', true, 'showLabel', true, 'showPoint', true, 'autoDualAxis', false, 'horizontalBar', false),
    'pie', JSON_OBJECT('showLabel', true, 'chartType', 'pie'),
    'table', JSON_OBJECT('bufferRows', 5, 'enableSummary', true, 'headerRowHeight', 30, 'bodyRowHeight', 30, 'summaryRowHeight', 30, 'scrollbarSize', 12, 'minAutoColWidth', 80, 'headerBackground', '#fafafa', 'headerTextColor', '#374151', 'headerFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'headerFontSize', 14, 'bodyBackgroundOdd', '#ffffff', 'bodyBackgroundEven', '#fafafa', 'bodyTextColor', '#374151', 'bodyFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'bodyFontSize', 14, 'summaryBackground', '#f9fafb', 'summaryTextColor', '#374151', 'summaryFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'summaryFontSize', 14, 'highlightCellBackground', '#f5f7fa', 'highlightRowBackground', 'rgba(24, 144, 255, 0.1)', 'highlightColBackground', 'rgba(24, 144, 255, 0.1)', 'enableRowHoverHighlight', false, 'enableColHoverHighlight', false, 'sortActiveColor', '#6b7280', 'conditions', JSON_ARRAY(), 'scrollbarBackground', '#f3f4f6', 'scrollbarThumbBackground', '#d1d5db', 'scrollbarThumbHoverBackground', '#9ca3af', 'borderColor', '#e5e7eb')
  ),
  'line',
  NOW(),
  'admin',
  NOW(),
  'admin',
  0
),
(
  103,
  'support_ticket_daily',
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'stat_date', 'columnType', 'date', 'displayName', '统计日期', 'columnComment', '统计日期'),
    JSON_OBJECT('columnName', 'team', 'columnType', 'string', 'displayName', '团队', 'columnComment', '团队'),
    JSON_OBJECT('columnName', 'priority', 'columnType', 'string', 'displayName', '优先级', 'columnComment', '优先级'),
    JSON_OBJECT('columnName', 'ticket_count', 'columnType', 'number', 'displayName', '工单数', 'columnComment', '工单数'),
    JSON_OBJECT('columnName', 'resolved_count', 'columnType', 'number', 'displayName', '已解决数', 'columnComment', '已解决数'),
    JSON_OBJECT('columnName', 'avg_response_minutes', 'columnType', 'number', 'displayName', '平均响应分钟', 'columnComment', '平均响应分钟'),
    JSON_OBJECT('columnName', 'satisfaction_score', 'columnType', 'number', 'displayName', '满意度', 'columnComment', '满意度')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'ticket_count', 'columnType', 'number', 'displayName', '工单数', 'columnComment', '工单数')
  ),
  JSON_ARRAY(),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'team', 'columnType', 'string', 'displayName', '团队', 'columnComment', '团队')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'ticket_count', 'columnType', 'number', 'displayName', '工单数', 'columnComment', '工单数', 'orderType', 'desc', 'aggregationType', 'sum')
  ),
  JSON_OBJECT('limit', 1000, 'analyzeDesc', '', 'shareStrategy', ''),
  JSON_OBJECT(
    'interval', JSON_OBJECT('showLabel', true, 'displayMode', 'levelDisplay', 'horizontalBar', false, 'showPercentage', false, 'horizontalDisplay', false),
    'line', JSON_OBJECT('smooth', true, 'showLabel', true, 'showPoint', true, 'autoDualAxis', false, 'horizontalBar', false),
    'pie', JSON_OBJECT('showLabel', true, 'chartType', 'pie'),
    'table', JSON_OBJECT('bufferRows', 5, 'enableSummary', true, 'headerRowHeight', 30, 'bodyRowHeight', 30, 'summaryRowHeight', 30, 'scrollbarSize', 12, 'minAutoColWidth', 80, 'headerBackground', '#fafafa', 'headerTextColor', '#374151', 'headerFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'headerFontSize', 14, 'bodyBackgroundOdd', '#ffffff', 'bodyBackgroundEven', '#fafafa', 'bodyTextColor', '#374151', 'bodyFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'bodyFontSize', 14, 'summaryBackground', '#f9fafb', 'summaryTextColor', '#374151', 'summaryFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'summaryFontSize', 14, 'highlightCellBackground', '#f5f7fa', 'highlightRowBackground', 'rgba(24, 144, 255, 0.1)', 'highlightColBackground', 'rgba(24, 144, 255, 0.1)', 'enableRowHoverHighlight', false, 'enableColHoverHighlight', false, 'sortActiveColor', '#6b7280', 'conditions', JSON_ARRAY(), 'scrollbarBackground', '#f3f4f6', 'scrollbarThumbBackground', '#d1d5db', 'scrollbarThumbHoverBackground', '#9ca3af', 'borderColor', '#e5e7eb')
  ),
  'pie',
  NOW(),
  'admin',
  NOW(),
  'admin',
  0
),
(
  104,
  'campaign_conversion',
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'campaign_name', 'columnType', 'string', 'displayName', '活动名称', 'columnComment', '活动名称'),
    JSON_OBJECT('columnName', 'channel', 'columnType', 'string', 'displayName', '渠道', 'columnComment', '渠道'),
    JSON_OBJECT('columnName', 'impressions', 'columnType', 'number', 'displayName', '曝光数', 'columnComment', '曝光数'),
    JSON_OBJECT('columnName', 'clicks', 'columnType', 'number', 'displayName', '点击数', 'columnComment', '点击数'),
    JSON_OBJECT('columnName', 'conversions', 'columnType', 'number', 'displayName', '转化数', 'columnComment', '转化数'),
    JSON_OBJECT('columnName', 'cost', 'columnType', 'number', 'displayName', '投放成本', 'columnComment', '投放成本'),
    JSON_OBJECT('columnName', 'conversion_rate', 'columnType', 'number', 'displayName', '转化率', 'columnComment', '转化率')
  ),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'campaign_name', 'columnType', 'string', 'displayName', '活动名称', 'columnComment', '活动名称'),
    JSON_OBJECT('columnName', 'channel', 'columnType', 'string', 'displayName', '渠道', 'columnComment', '渠道'),
    JSON_OBJECT('columnName', 'impressions', 'columnType', 'number', 'displayName', '曝光数', 'columnComment', '曝光数'),
    JSON_OBJECT('columnName', 'clicks', 'columnType', 'number', 'displayName', '点击数', 'columnComment', '点击数'),
    JSON_OBJECT('columnName', 'conversions', 'columnType', 'number', 'displayName', '转化数', 'columnComment', '转化数'),
    JSON_OBJECT('columnName', 'conversion_rate', 'columnType', 'number', 'displayName', '转化率', 'columnComment', '转化率')
  ),
  JSON_ARRAY(),
  JSON_ARRAY(),
  JSON_ARRAY(
    JSON_OBJECT('columnName', 'conversions', 'columnType', 'number', 'displayName', '转化数', 'columnComment', '转化数', 'orderType', 'desc', 'aggregationType', 'raw')
  ),
  JSON_OBJECT('limit', 1000, 'analyzeDesc', '', 'shareStrategy', ''),
  JSON_OBJECT(
    'interval', JSON_OBJECT('showLabel', true, 'displayMode', 'levelDisplay', 'horizontalBar', false, 'showPercentage', false, 'horizontalDisplay', false),
    'line', JSON_OBJECT('smooth', true, 'showLabel', true, 'showPoint', true, 'autoDualAxis', false, 'horizontalBar', false),
    'pie', JSON_OBJECT('showLabel', true, 'chartType', 'pie'),
    'table', JSON_OBJECT('bufferRows', 8, 'enableSummary', true, 'headerRowHeight', 32, 'bodyRowHeight', 30, 'summaryRowHeight', 32, 'scrollbarSize', 12, 'minAutoColWidth', 92, 'headerBackground', '#f8fafc', 'headerTextColor', '#1f2937', 'headerFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'headerFontSize', 13, 'bodyBackgroundOdd', '#ffffff', 'bodyBackgroundEven', '#f8fafc', 'bodyTextColor', '#374151', 'bodyFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'bodyFontSize', 13, 'summaryBackground', '#eef2ff', 'summaryTextColor', '#312e81', 'summaryFontFamily', 'system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif', 'summaryFontSize', 13, 'highlightCellBackground', '#eff6ff', 'highlightRowBackground', 'rgba(37, 99, 235, 0.10)', 'highlightColBackground', 'rgba(37, 99, 235, 0.08)', 'enableRowHoverHighlight', true, 'enableColHoverHighlight', true, 'sortActiveColor', '#2563eb', 'conditions', JSON_ARRAY(), 'scrollbarBackground', '#e5e7eb', 'scrollbarThumbBackground', '#94a3b8', 'scrollbarThumbHoverBackground', '#64748b', 'borderColor', '#dbeafe')
  ),
  'table',
  NOW(),
  'admin',
  NOW(),
  'admin',
  0
)
ON DUPLICATE KEY UPDATE
  `data_source` = VALUES(`data_source`),
  `columns` = VALUES(`columns`),
  `dimensions` = VALUES(`dimensions`),
  `filters` = VALUES(`filters`),
  `groups` = VALUES(`groups`),
  `orders` = VALUES(`orders`),
  `common_chart_config` = VALUES(`common_chart_config`),
  `private_chart_config` = VALUES(`private_chart_config`),
  `chart_type` = VALUES(`chart_type`),
  `update_time` = NOW(),
  `updated_by` = 'admin',
  `is_deleted` = 0;

INSERT INTO `analyze` (
  `id`,
  `analyze_name`,
  `view_count`,
  `create_time`,
  `created_by`,
  `update_time`,
  `updated_by`,
  `chart_config_id`,
  `analyze_desc`,
  `is_deleted`
) VALUES
(101, '销售漏斗渠道表现（柱状图）', 0, NOW(), 'admin', NOW(), 'admin', 101, '按渠道查看访问、线索和订单规模', 0),
(102, '库存周转效率（折线图）', 0, NOW(), 'admin', NOW(), 'admin', 102, '按仓库和品类查看平均周转天数', 0),
(103, '客服工单团队占比（饼图）', 0, NOW(), 'admin', NOW(), 'admin', 103, '按团队查看工单量占比', 0),
(104, '营销活动转化明细（表格）', 0, NOW(), 'admin', NOW(), 'admin', 104, '活动曝光、点击、转化和转化率明细', 0)
ON DUPLICATE KEY UPDATE
  `analyze_name` = VALUES(`analyze_name`),
  `analyze_desc` = VALUES(`analyze_desc`),
  `chart_config_id` = VALUES(`chart_config_id`),
  `updated_by` = 'admin',
  `update_time` = NOW(),
  `is_deleted` = 0;
