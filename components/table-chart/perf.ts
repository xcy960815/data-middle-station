import { reactive } from 'vue'

export const TABLE_PERF_CORE_METRICS = [
  'firstRender',
  'handleTableData',
  'refreshTable',
  'refreshHeader',
  'refreshBody',
  'refreshSummary',
  'refreshScrollbar'
] as const

export const TABLE_PERF_INTERACTION_METRICS = [
  'applyFilter',
  'applySort',
  'resizeColumn',
  'reorderColumn',
  'editCell',
  'windowResize'
] as const

export const TABLE_PERF_SCROLL_METRICS = ['verticalScroll', 'horizontalScroll'] as const

export const TABLE_PERF_METRIC_ORDER = [
  ...TABLE_PERF_CORE_METRICS,
  ...TABLE_PERF_INTERACTION_METRICS,
  ...TABLE_PERF_SCROLL_METRICS
] as const

export type TablePerfMetricKey = (typeof TABLE_PERF_METRIC_ORDER)[number]

export const TABLE_PERF_METRIC_SECTIONS: Array<{
  key: string
  title: string
  metrics: readonly TablePerfMetricKey[]
}> = [
  { key: 'core', title: '渲染核心', metrics: TABLE_PERF_CORE_METRICS },
  { key: 'interaction', title: '交互操作', metrics: TABLE_PERF_INTERACTION_METRICS },
  { key: 'scroll', title: '滚动', metrics: TABLE_PERF_SCROLL_METRICS }
]

export interface TablePerfMetricStat {
  label: string
  count: number
  last: number
  avg: number
  max: number
  p95: number
  over16: number
  over33: number
  recent: number[]
}

export interface TablePerfSnapshot {
  sourceRows: number
  processedRows: number
  groupColumnCount: number
  dimensionColumnCount: number
  columnCount: number
  visibleRows: number
  bufferRows: number
  stageWidth: number
  stageHeight: number
  scrollX: number
  scrollY: number
  lastUpdatedAt: number
}

const RECENT_SAMPLE_LIMIT = 60
const FRAME_BUDGET_MS = 16.7
const JANK_BUDGET_MS = 33.3

const PERF_METRIC_LABELS: Record<TablePerfMetricKey, string> = {
  firstRender: '首屏渲染',
  handleTableData: '数据处理',
  refreshTable: '整表刷新',
  refreshHeader: '表头刷新',
  refreshBody: '主体刷新',
  refreshSummary: '汇总刷新',
  refreshScrollbar: '滚动条刷新',
  applyFilter: '应用过滤',
  applySort: '应用排序',
  resizeColumn: '调整列宽',
  reorderColumn: '调整列序',
  editCell: '编辑单元格',
  windowResize: '窗口缩放',
  verticalScroll: '纵向滚动',
  horizontalScroll: '横向滚动'
}

const createMetricStat = (key: TablePerfMetricKey): TablePerfMetricStat => ({
  label: PERF_METRIC_LABELS[key],
  count: 0,
  last: 0,
  avg: 0,
  max: 0,
  p95: 0,
  over16: 0,
  over33: 0,
  recent: []
})

const createMetrics = (): Record<TablePerfMetricKey, TablePerfMetricStat> =>
  TABLE_PERF_METRIC_ORDER.reduce(
    (metrics, key) => {
      metrics[key] = createMetricStat(key)
      return metrics
    },
    {} as Record<TablePerfMetricKey, TablePerfMetricStat>
  )

const createSnapshot = (): TablePerfSnapshot => ({
  sourceRows: 0,
  processedRows: 0,
  groupColumnCount: 0,
  dimensionColumnCount: 0,
  columnCount: 0,
  visibleRows: 0,
  bufferRows: 0,
  stageWidth: 0,
  stageHeight: 0,
  scrollX: 0,
  scrollY: 0,
  lastUpdatedAt: 0
})

export const tablePerfState = reactive({
  metrics: createMetrics(),
  snapshot: createSnapshot()
})

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now())

const getP95 = (recent: number[]) => {
  if (recent.length === 0) return 0
  const sorted = [...recent].sort((left, right) => left - right)
  const index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1)
  return sorted[index]
}

export const formatPerfMs = (value: number) => `${Number(value || 0).toFixed(2)} ms`

export const getPerfBudgetUsage = (p95: number, budgetMs: number = JANK_BUDGET_MS) =>
  Math.min(100, Number((((p95 || 0) / budgetMs) * 100).toFixed(2)))

/**
 * @desc 记录表格渲染性能指标。
 */
export const recordTablePerfMetric = (key: TablePerfMetricKey, durationMs: number) => {
  const metric = tablePerfState.metrics[key]
  const duration = Number(durationMs.toFixed(2))

  metric.count += 1
  metric.last = duration
  metric.max = Math.max(metric.max, duration)
  metric.avg = Number(((metric.avg * (metric.count - 1) + duration) / metric.count).toFixed(2))
  if (duration > FRAME_BUDGET_MS) {
    metric.over16 += 1
  }
  if (duration > JANK_BUDGET_MS) {
    metric.over33 += 1
  }
  metric.recent.push(duration)
  if (metric.recent.length > RECENT_SAMPLE_LIMIT) {
    metric.recent.shift()
  }
  metric.p95 = Number(getP95(metric.recent).toFixed(2))
}

/**
 * @desc 测量指定表格操作的执行耗时。
 */
export const measureTablePerf = <T>(key: TablePerfMetricKey, callback: () => T): T => {
  const startAt = now()
  const result = callback()
  recordTablePerfMetric(key, now() - startAt)
  return result
}

/**
 * @desc 更新表格性能快照。
 */
export const updateTablePerfSnapshot = (nextSnapshot: Partial<TablePerfSnapshot>) => {
  Object.assign(tablePerfState.snapshot, nextSnapshot, { lastUpdatedAt: Date.now() })
}

/**
 * @desc 重置表格性能统计状态。
 */
export const resetTablePerfState = () => {
  tablePerfState.metrics = createMetrics()
  tablePerfState.snapshot = createSnapshot()
}

export interface TableScrollStressOptions {
  verticalSteps?: number
  horizontalSteps?: number
  verticalDelta?: number
  horizontalDelta?: number
  yieldEvery?: number
}

export interface TableScrollStressResult {
  verticalSteps: number
  horizontalSteps: number
  verticalP95: number
  horizontalP95: number
}

/**
 * @desc 连续触发滚动操作，用于压测并汇总 p95。
 */
export const runTableScrollStressTest = async (
  handlers: {
    verticalScroll?: (delta: number) => void
    horizontalScroll?: (delta: number) => void
  },
  options: TableScrollStressOptions = {}
): Promise<TableScrollStressResult> => {
  const {
    verticalSteps = 200,
    horizontalSteps = 100,
    verticalDelta = 32,
    horizontalDelta = 48,
    yieldEvery = 20
  } = options

  const verticalBefore = tablePerfState.metrics.verticalScroll.count
  const horizontalBefore = tablePerfState.metrics.horizontalScroll.count

  for (let index = 0; index < verticalSteps; index += 1) {
    handlers.verticalScroll?.(verticalDelta)
    if (index > 0 && index % yieldEvery === 0) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
    }
  }

  for (let index = 0; index < horizontalSteps; index += 1) {
    handlers.horizontalScroll?.(horizontalDelta)
    if (index > 0 && index % yieldEvery === 0) {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })
    }
  }

  const verticalRecorded = tablePerfState.metrics.verticalScroll.count - verticalBefore
  const horizontalRecorded = tablePerfState.metrics.horizontalScroll.count - horizontalBefore

  return {
    verticalSteps: verticalRecorded,
    horizontalSteps: horizontalRecorded,
    verticalP95: tablePerfState.metrics.verticalScroll.p95,
    horizontalP95: tablePerfState.metrics.horizontalScroll.p95
  }
}
