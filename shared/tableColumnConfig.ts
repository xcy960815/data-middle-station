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
  'colIndex'
] as const

export type TableColumnUiKey = (typeof TABLE_COLUMN_UI_KEYS)[number]

const buildTableColumnSettingKey = (role: TableColumnRole, columnName: string) => `${role}:${columnName}`

const inferTableColumnRoleFromField = (field: Record<string, unknown>): TableColumnRole => {
  return 'measureRule' in field ? 'measure' : 'dimension'
}

export type TableColumnSetting = {
  /**
   * 列名
   */
  columnName: string
  /**
   * 维度还是分组
   */
  role: TableColumnRole
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

/**
 * 构建 canvas table 所需要的列配置
 * @param field
 * @param columns
 * @returns
 */
export const mergeFieldWithTableColumn = <T extends { columnName: string }>(
  field: T,
  columns: TableColumnSetting[] | undefined
): T & Partial<TableColumnSetting> => {
  const role = inferTableColumnRoleFromField(field as Record<string, unknown>)
  const columnSetting = columns?.find(
    (item) =>
      buildTableColumnSettingKey(item.role, item.columnName) === buildTableColumnSettingKey(role, field.columnName)
  )
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
  const existingMap = new Map(
    existing.map((item) => [buildTableColumnSettingKey(item.role, item.columnName), item] as const)
  )
  const columns: TableColumnSetting[] = []

  for (const dimension of dimensions) {
    const columnName = dimension.columnName
    const key = buildTableColumnSettingKey('dimension', columnName)
    const previous = existingMap.get(key)
    columns.push({
      columnName,
      role: 'dimension',
      ...defaultTableColumnUi(),
      ...pickDefinedTableColumnUi(dimension),
      ...previous
    })
    existingMap.delete(key)
  }

  for (const measure of measures) {
    const columnName = measure.columnName
    const key = buildTableColumnSettingKey('measure', columnName)
    const previous = existingMap.get(key)
    columns.push({
      columnName,
      role: 'measure',
      ...defaultTableColumnUi(),
      ...pickDefinedTableColumnUi(measure),
      ...previous
    })
    existingMap.delete(key)
  }

  return columns
}

export const migrateTableColumnUiFromFields = <
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
  const hasLegacyUi = [...dimensions, ...measures].some(hasLegacyTableColumnUi)
  const table = privateChartConfig?.table
  const hasExistingColumns = Boolean(table?.columns?.length)
  const shouldWriteColumns = hasLegacyUi || hasExistingColumns || options.forceColumns
  const columns = buildTableColumnsFromFields(dimensions, measures, table?.columns || [])
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
    dimensions: dimensions.map(stripTableColumnUi),
    measures: measures.map(stripTableColumnUi),
    privateChartConfig: nextPrivateChartConfig
  }
}
