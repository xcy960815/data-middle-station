/**
 * @desc 表格列 UI 配置：与查询字段（measure/dimension）分离，保存在 privateChartConfig.table.columns
 */

export type TableColumnRole = 'dimension' | 'measure'

export const TABLE_COLUMN_UI_KEYS = [
  'fixed',
  'align',
  'verticalAlign',
  'width',
  'showOverflowTooltip',
  'filterable',
  'sortable',
  'editable',
  'editType',
  'editOptions',
  'resizable',
  'draggable',
  'colIndex',
  'alias'
] as const

export type TableColumnUiKey = (typeof TABLE_COLUMN_UI_KEYS)[number]

export type TableColumnSetting = {
  columnName: string
  role: TableColumnRole
  fixed?: 'left' | 'right' | null
  align?: 'left' | 'right' | 'center' | null
  verticalAlign?: 'top' | 'middle' | 'bottom' | null
  width?: number | null
  showOverflowTooltip?: boolean
  filterable?: boolean
  sortable?: boolean
  editable?: boolean
  editType?: 'input' | 'select' | 'date' | 'datetime'
  editOptions?: Array<{
    label: string
    value: string | number
  }>
  resizable?: boolean
  draggable?: boolean
}

export type TableRenderColumn = ColumnsStore.ColumnOptions &
  Partial<TableColumnSetting> & {
    measureRule?: import('@/shared/analyzeFieldRules').MeasureRule
    dimensionRule?: import('@/shared/analyzeFieldRules').DimensionRule
  }

export const defaultTableColumnUi = (): Omit<TableColumnSetting, 'columnName' | 'role'> => ({
  fixed: null,
  align: null,
  width: null,
  showOverflowTooltip: false,
  filterable: false,
  sortable: false
})

const pickDefinedTableColumnUi = (field: Record<string, unknown>): Partial<TableColumnSetting> => {
  const picked: Partial<TableColumnSetting> = {}
  for (const key of TABLE_COLUMN_UI_KEYS) {
    if (!(key in field)) continue
    ;(picked as Record<string, unknown>)[key] = field[key]
  }
  return picked
}

export const stripTableColumnUi = <T extends Record<string, unknown>>(field: T): T => {
  const cleaned = { ...field }
  for (const key of TABLE_COLUMN_UI_KEYS) {
    delete cleaned[key]
  }
  return cleaned as T
}

const hasLegacyTableColumnUi = (field: Record<string, unknown>) => TABLE_COLUMN_UI_KEYS.some((key) => key in field)

export const mergeFieldWithTableColumn = <T extends { columnName: string }>(
  field: T,
  columns: TableColumnSetting[] | undefined
): TableRenderColumn => {
  const columnSetting = columns?.find((item) => item.columnName === field.columnName)
  return {
    ...defaultTableColumnUi(),
    ...field,
    ...columnSetting
  }
}

export const buildTableColumnsFromFields = (
  dimensions: Array<{ columnName: string } & Record<string, unknown>>,
  measures: Array<{ columnName: string } & Record<string, unknown>>,
  existing: TableColumnSetting[] = []
): TableColumnSetting[] => {
  const existingMap = new Map(existing.map((item) => [item.columnName, item]))
  const columns: TableColumnSetting[] = []

  for (const dimension of dimensions) {
    const columnName = dimension.columnName
    const previous = existingMap.get(columnName)
    columns.push({
      columnName,
      role: 'dimension',
      ...defaultTableColumnUi(),
      ...previous,
      ...pickDefinedTableColumnUi(dimension)
    })
    existingMap.delete(columnName)
  }

  for (const measure of measures) {
    const columnName = measure.columnName
    const previous = existingMap.get(columnName)
    columns.push({
      columnName,
      role: 'measure',
      ...defaultTableColumnUi(),
      ...previous,
      ...pickDefinedTableColumnUi(measure)
    })
    existingMap.delete(columnName)
  }

  return columns
}

export const migrateTableColumnUiFromFields = <
  TPrivateChartConfig extends { table?: AnalyzeConfigDao.TableChartConfig }
>(
  dimensions: Array<Record<string, unknown>>,
  measures: Array<Record<string, unknown>>,
  privateChartConfig?: TPrivateChartConfig | null
): {
  dimensions: Array<Record<string, unknown>>
  measures: Array<Record<string, unknown>>
  privateChartConfig: TPrivateChartConfig
} => {
  const table = privateChartConfig?.table || ({ conditions: [] } as AnalyzeConfigDao.TableChartConfig)
  const hasLegacyUi = [...dimensions, ...measures].some(hasLegacyTableColumnUi)
  const columns = buildTableColumnsFromFields(dimensions, measures, table.columns || [])
  const nextPrivateChartConfig = {
    ...(privateChartConfig || ({} as TPrivateChartConfig)),
    table: {
      ...table,
      columns: hasLegacyUi || !table.columns?.length ? columns : table.columns
    }
  }

  return {
    dimensions: dimensions.map(stripTableColumnUi),
    measures: measures.map(stripTableColumnUi),
    privateChartConfig: nextPrivateChartConfig
  }
}
