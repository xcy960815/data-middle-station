export type TableQueryMode = 'detail' | 'aggregate'

/**
 * 表格模式只由分组字段决定：无分组为明细表格，有分组为聚合表格。
 */
export const getTableQueryMode = (groups: unknown[] = [], _dimensions: unknown[] = []): TableQueryMode => {
  return (groups?.length ?? 0) > 0 ? 'aggregate' : 'detail'
}

export const getTableQueryModeLabel = (mode: TableQueryMode) => {
  return mode === 'aggregate' ? '聚合表格' : '明细表格'
}
