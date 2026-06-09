/**
 * @desc 表格列 UI 配置：与查询字段（measure/dimension）分离，保存在 privateChartConfig.table.columns
 */

export type AnalyzeTableColumnRole = 'dimension' | 'measure'

export const ANALYZE_TABLE_COLUMN_UI_KEYS = [
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
  'colIndex'
] as const

export type AnalyzeTableColumnUiKey = (typeof ANALYZE_TABLE_COLUMN_UI_KEYS)[number]

const buildAnalyzeTableColumnSettingKey = (role: AnalyzeTableColumnRole, columnName: string) => `${role}:${columnName}`

const inferAnalyzeTableColumnRoleFromField = (field: Record<string, unknown>): AnalyzeTableColumnRole => {
  return 'measureRule' in field ? 'measure' : 'dimension'
}

export type AnalyzeTableColumnSetting = {
  /**
   * 列名
   */
  columnName: string
  /**
   * 维度还是分组
   */
  role: AnalyzeTableColumnRole
  /**
   * 固定方式
   */
  fixed?: 'left' | 'right' | null
  /**
   * 横向排布方式
   */
  align?: 'left' | 'right' | 'center' | null
  /**
   * 纵向排布方式
   */
  verticalAlign?: 'top' | 'middle' | 'bottom' | null
  /**
   * 宽度
   */
  width?: number | null
  /**
   * 是否显示 tooltip
   */
  showOverflowTooltip?: boolean
  /**
   * 是否开启过滤
   */
  filterable?: boolean
  /**
   * 是否开启排序
   */
  sortable?: boolean
  /**
   * 是否可编辑
   */
  editable?: boolean
  /**
   * 编辑组件类型
   */
  editType?: 'input' | 'select' | 'date' | 'datetime'
  /**
   * 编辑组件下拉选选项
   */
  editOptions?: Array<{
    label: string
    value: string | number
  }>
  /**
   * 是否可以拖拽调整列宽
   */
  resizable?: boolean
  /**
   * 是否可以拖拽调整列顺序
   */
  draggable?: boolean
  /**
   * 列下标
   */
  colIndex?: number
}

/**
 * 默认的表格样式配置
 * @returns
 */
export const createDefaultAnalyzeTableColumnUi = (): Omit<AnalyzeTableColumnSetting, 'columnName' | 'role'> => ({
  fixed: null,
  align: null,
  width: null,
  showOverflowTooltip: false,
  filterable: false,
  sortable: false
})

const pickAnalyzeTableColumnUiFromField = (field: Record<string, unknown>): Partial<AnalyzeTableColumnSetting> => {
  const picked: Partial<AnalyzeTableColumnSetting> = {}
  for (const key of ANALYZE_TABLE_COLUMN_UI_KEYS) {
    if (!(key in field)) continue
    ;(picked as Record<string, unknown>)[key] = field[key]
  }
  return picked
}

export const stripAnalyzeTableColumnUiFromField = <T extends Record<string, unknown>>(field: T): T => {
  const cleaned = { ...field }
  for (const key of ANALYZE_TABLE_COLUMN_UI_KEYS) {
    delete cleaned[key]
  }
  return cleaned as T
}

const hasLegacyAnalyzeTableColumnUi = (field: Record<string, unknown>) =>
  ANALYZE_TABLE_COLUMN_UI_KEYS.some((key) => key in field)

/**
 * 构建 canvas table 所需要的列配置
 * @param field
 * @param columns
 * @returns
 */
export const mergeAnalyzeFieldWithTableColumn = <T extends { columnName: string }>(
  field: T,
  columns: AnalyzeTableColumnSetting[] | undefined
): T & Partial<AnalyzeTableColumnSetting> => {
  const role = inferAnalyzeTableColumnRoleFromField(field as Record<string, unknown>)
  const columnSetting = columns?.find(
    (item) =>
      buildAnalyzeTableColumnSettingKey(item.role, item.columnName) ===
      buildAnalyzeTableColumnSettingKey(role, field.columnName)
  )
  return {
    ...createDefaultAnalyzeTableColumnUi(),
    ...field,
    ...columnSetting
  }
}

export const buildAnalyzeTableColumnsFromFields = (
  dimensions: Array<{ columnName: string } & Record<string, unknown>>,
  measures: Array<{ columnName: string } & Record<string, unknown>>,
  existing: AnalyzeTableColumnSetting[] = []
): AnalyzeTableColumnSetting[] => {
  const existingMap = new Map(
    existing.map((item) => [buildAnalyzeTableColumnSettingKey(item.role, item.columnName), item] as const)
  )
  const columns: AnalyzeTableColumnSetting[] = []

  for (const dimension of dimensions) {
    const columnName = dimension.columnName
    const key = buildAnalyzeTableColumnSettingKey('dimension', columnName)
    const previous = existingMap.get(key)
    columns.push({
      columnName,
      role: 'dimension',
      ...createDefaultAnalyzeTableColumnUi(),
      ...pickAnalyzeTableColumnUiFromField(dimension),
      ...previous
    })
    existingMap.delete(key)
  }

  for (const measure of measures) {
    const columnName = measure.columnName
    const key = buildAnalyzeTableColumnSettingKey('measure', columnName)
    const previous = existingMap.get(key)
    columns.push({
      columnName,
      role: 'measure',
      ...createDefaultAnalyzeTableColumnUi(),
      ...pickAnalyzeTableColumnUiFromField(measure),
      ...previous
    })
    existingMap.delete(key)
  }

  return columns
}

export const migrateAnalyzeTableColumnUiFromFields = <
  TPrivateChartConfig extends { table?: AnalyzeConfigDao.TableChartConfig }
>(
  dimensions: Array<{ columnName: string } & Record<string, unknown>>,
  measures: Array<{ columnName: string } & Record<string, unknown>>,
  privateChartConfig?: TPrivateChartConfig | null,
  options: { forceColumns?: boolean } = {}
): {
  dimensions: Array<Record<string, unknown>>
  measures: Array<Record<string, unknown>>
  privateChartConfig?: TPrivateChartConfig
} => {
  const hasLegacyUi = [...dimensions, ...measures].some(hasLegacyAnalyzeTableColumnUi)
  const table = privateChartConfig?.table
  const hasExistingColumns = Boolean(table?.columns?.length)
  const shouldWriteColumns = hasLegacyUi || hasExistingColumns || options.forceColumns
  const columns = buildAnalyzeTableColumnsFromFields(dimensions, measures, table?.columns || [])
  const nextPrivateChartConfig =
    privateChartConfig || hasLegacyUi || options.forceColumns
      ? {
          ...(privateChartConfig || ({} as TPrivateChartConfig)),
          table: {
            ...(table || ({ conditions: [] } as unknown as AnalyzeConfigDao.TableChartConfig)),
            ...(shouldWriteColumns ? { columns } : {})
          }
        }
      : privateChartConfig || undefined

  return {
    dimensions: dimensions.map(stripAnalyzeTableColumnUiFromField),
    measures: measures.map(stripAnalyzeTableColumnUiFromField),
    privateChartConfig: nextPrivateChartConfig
  }
}
