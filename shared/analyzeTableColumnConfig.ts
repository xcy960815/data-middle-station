/**
 * @desc 表格列 UI 配置：与查询字段（measure/dimension）分离，保存在 privateChartConfig.table.columns
 */

type AnalyzeTableColumnRole = 'dimension' | 'measure'

const ANALYZE_TABLE_COLUMN_UI_KEYS = [
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
 * 创建表格列 UI 默认值（不含 columnName 和 role）。
 * @returns {Omit<AnalyzeTableColumnSetting, 'columnName' | 'role'>} 所有 UI 属性的默认值。
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

/**
 * 从字段对象中剥离所有表格列 UI 属性，返回纯查询语义字段。
 * @param {T} field 可能混入 UI 属性的字段对象。
 * @returns {T} 剥离 UI 属性后的字段副本。
 */
export const stripAnalyzeTableColumnUiFromField = <T extends Record<string, unknown>>(field: T): T => {
  const cleaned = { ...field }
  for (const key of ANALYZE_TABLE_COLUMN_UI_KEYS) {
    delete cleaned[key]
  }
  return cleaned as T
}

/**
 * 将查询字段与已保存的表格列 UI 配置合并，生成 canvas table 所需的列配置。
 * @param {T} field 查询字段（含 columnName 和可选的 measureRule/dimensionRule）。
 * @param {AnalyzeTableColumnSetting[] | undefined} columns 已保存的表格列 UI 配置列表。
 * @returns {T & Partial<AnalyzeTableColumnSetting>} 合并后的字段对象，UI 属性来自列配置或默认值。
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

/**
 * 根据分组字段和值字段构建表格列 UI 配置列表。
 * @param {Array<{ columnName: string } & Record<string, unknown>>} dimensions 分组字段列表。
 * @param {Array<{ columnName: string } & Record<string, unknown>>} measures 值字段列表。
 * @param {AnalyzeTableColumnSetting[]} existing 已保存的列配置，优先级最高。
 * @returns {AnalyzeTableColumnSetting[]} 按字段顺序和角色对齐的表格列配置列表。
 */
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
