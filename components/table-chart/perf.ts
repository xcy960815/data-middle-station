import { reactive } from 'vue'

export const TABLE_PERF_METRIC_ORDER = [
  'firstRender',
  'handleTableData',
  'refreshTable',
  'refreshHeader',
  'refreshBody',
  'refreshSummary',
  'refreshScrollbar',
  'verticalScroll',
  'horizontalScroll'
] as const

export type TablePerfMetricKey = (typeof TABLE_PERF_METRIC_ORDER)[number]

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

interface TablePerfSnapshot {
  sourceRows: number
  processedRows: number
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

const PERF_METRIC_LABELS: Record<TablePerfMetricKey, string> = {
  firstRender: '首屏渲染',
  handleTableData: '数据处理',
  refreshTable: '整表刷新',
  refreshHeader: '表头刷新',
  refreshBody: '主体刷新',
  refreshSummary: '汇总刷新',
  refreshScrollbar: '滚动条刷新',
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
  if (duration > 16.7) {
    metric.over16 += 1
  }
  if (duration > 33.3) {
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
