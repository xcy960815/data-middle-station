/**
 * @desc 图表默认配置，供前后端复用
 */

/**
 * @desc 表格图默认配置
 * @returns {AnalyzeConfigVo.TableChartConfigItem}
 */
export const defaultAnalyzeTableChartConfig: AnalyzeConfigVo.TableChartConfigItem = {
  /** 是否在行 hover 时高亮整行 */
  enableRowHoverHighlight: false,
  /** 是否在列 hover 时高亮整列 */
  enableColHoverHighlight: false,
  /** 单元格 hover 高亮背景色 */
  highlightCellBackground: '#f5f7fa',
  /** 行 hover 高亮背景色 */
  highlightRowBackground: 'rgba(24, 144, 255, 0.1)',
  /** 列 hover 高亮背景色 */
  highlightColBackground: 'rgba(24, 144, 255, 0.1)',
  /** 表头行高 */
  headerRowHeight: 30,
  /** 汇总行高度 */
  summaryRowHeight: 30,
  /** 是否显示汇总信息 */
  enableSummary: false,
  /** 表体行高 */
  bodyRowHeight: 30,
  /** 滚动条粗细 */
  scrollbarSize: 12,
  /** 表头背景色 */
  headerBackground: '#fafafa',
  /** 表体奇数行背景色 */
  bodyBackgroundOdd: '#ffffff',
  /** 表体偶数行背景色 */
  bodyBackgroundEven: '#fafafa',
  /** 表格边框颜色 */
  borderColor: '#e5e7eb',
  /** 表头文字颜色 */
  headerTextColor: '#374151',
  /** 表体文字颜色 */
  bodyTextColor: '#374151',
  /** 表头字体 */
  headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  /** 表头字号 */
  headerFontSize: 14,
  /** 表体字体 */
  bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  /** 表体字号 */
  bodyFontSize: 14,
  /** 汇总行字体 */
  summaryFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
  /** 汇总行字号 */
  summaryFontSize: 14,
  /** 汇总区背景色 */
  summaryBackground: '#f9fafb',
  /** 汇总区文字颜色 */
  summaryTextColor: '#374151',
  /** 滚动条背景色 */
  scrollbarBackground: '#f3f4f6',
  /** 滚动条拇指颜色 */
  scrollbarThumbBackground: '#d1d5db',
  /** 滚动条拇指 hover 颜色 */
  scrollbarThumbHoverBackground: '#9ca3af',
  /** 预渲染缓冲行数 */
  bufferRows: 5,
  /** 自动列宽最小值 */
  minAutoColWidth: 80,
  /** 排序激活态颜色 */
  sortActiveColor: '#6b7280',
  /** 条件格式配置 */
  conditions: []
}

/**
 * @desc 饼图默认配置
 * @returns {AnalyzeConfigVo.PieChartConfigItem}
 */
export const defaultAnalyzePieChartConfig: AnalyzeConfigVo.PieChartConfigItem = {
  /** 是否展示标签 */
  showLabel: false,
  /** 饼图类型 */
  chartType: 'pie'
}

/**
 * @desc 柱状图默认配置
 * @returns {AnalyzeConfigVo.IntervalChartConfigItem}
 */
export const defaultAnalyzeIntervalChartConfig: AnalyzeConfigVo.IntervalChartConfigItem = {
  /** 展示方式：层级 / 平铺 */
  displayMode: 'levelDisplay',
  /** 是否展示百分比 */
  showPercentage: false,
  /** 是否显示标签 */
  showLabel: false,
  /** 是否横向展示 */
  horizontalDisplay: false,
  /** 是否渲染为横向条形图 */
  horizontalBar: false
}

/**
 * @desc 折线图默认配置
 * @returns {AnalyzeConfigVo.LineChartConfigItem}
 */
export const defaultAnalyzeLineChartConfig: AnalyzeConfigVo.LineChartConfigItem = {
  /** 折线节点是否展示 */
  showPoint: false,
  /** 是否显示标签 */
  showLabel: false,
  /** 是否启用平滑曲线 */
  smooth: false,
  /** 是否自动启用双 Y 轴 */
  autoDualAxis: false,
  /** 是否横向显示为条形图 */
  horizontalBar: false
}

/**
 * @desc 公共图表默认配置
 * @returns {AnalyzeConfigVo.CommonChartConfigItem}
 */
export const defaultAnalyzeCommonChartConfig: AnalyzeConfigVo.CommonChartConfigItem = {
  /** 查询数据量上限 */
  limit: 1000,
  /** 分析备注 */
  analyzeDesc: '',
  /** 分享策略描述 */
  shareStrategy: ''
}

/**
 * @desc 双轴组合图默认配置
 * @returns {AnalyzeConfigVo.ComboChartConfigItem}
 */
export const defaultAnalyzeComboChartConfig: AnalyzeConfigVo.ComboChartConfigItem = {
  /** 折线是否画圆点 */
  showPoint: true,
  /** 是否显示标签 */
  showLabel: false,
  /** 折线是否平滑 */
  smooth: false,
  /** 是否横向拖动条 */
  horizontalBar: false
}

/**
 * @desc 堆叠图默认配置
 * @returns {AnalyzeConfigVo.StackedChartConfigItem}
 */
export const defaultAnalyzeStackedChartConfig: AnalyzeConfigVo.StackedChartConfigItem = {
  /** 展示方式：堆叠柱状 */
  displayMode: 'stackBar',
  /** 是否百分比显示 */
  showPercentage: false,
  /** 是否显示标签 */
  showLabel: false,
  /** 堆叠面积图时是否平滑 */
  smooth: false,
  /** 是否横向拖动条 */
  horizontalBar: false
}

/**
 * @desc 面积图默认配置
 * @returns {AnalyzeConfigVo.AreaChartConfigItem}
 */
export const defaultAnalyzeAreaChartConfig: AnalyzeConfigVo.AreaChartConfigItem = {
  /** 是否画圆点 */
  showPoint: false,
  /** 是否显示标签 */
  showLabel: false,
  /** 是否平滑曲线 */
  smooth: true,
  /** 填充区域透明度 */
  opacity: 0.3,
  /** 是否横向拖动条 */
  horizontalBar: false
}

/**
 * @desc 漏斗图默认配置
 * @returns {AnalyzeConfigVo.FunnelChartConfigItem}
 */
export const defaultAnalyzeFunnelChartConfig: AnalyzeConfigVo.FunnelChartConfigItem = {
  /** 是否显示标签 */
  showLabel: true,
  /** 是否显示百分比 */
  showPercentage: true,
  /** 排序方式：降序 */
  sort: 'descending',
  /** 漏斗对齐：居中 */
  funnelAlign: 'center'
}

/**
 * @desc 散点图默认配置
 * @returns {AnalyzeConfigVo.ScatterChartConfigItem}
 */
export const defaultAnalyzeScatterChartConfig: AnalyzeConfigVo.ScatterChartConfigItem = {
  /** 是否显示标签 */
  showLabel: false,
  /** 散点大小 */
  symbolSize: 10,
  /** 是否显示趋势线 */
  showTrendLine: false
}

/**
 * @desc KPI 指标卡默认配置
 * @returns {AnalyzeConfigVo.KpiCardConfigItem}
 */
export const defaultAnalyzeKpiCardConfig: AnalyzeConfigVo.KpiCardConfigItem = {
  /** 是否显示对比指标 */
  showComparison: true,
  /** 是否显示迷你趋势线 */
  showSparkline: true,
  /** 对比类型：环比 */
  comparisonType: 'chain'
}
