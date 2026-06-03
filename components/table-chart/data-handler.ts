import {
  getSourceRowIndex,
  notifyCellValueChange,
  getTableParams,
  getProcessedRows,
  getRuntimeState
} from './parameter'
import { measureTablePerf, updateTablePerfSnapshot } from './perf'
import type { FilterItem } from './runtime-state'

/**
 * 重置表格运行时状态，避免重挂载后沿用旧的过滤、排序和缓存
 */
export const resetTableDataState = () => {
  const dataState = getRuntimeState().data
  dataState.uniqueColumnValuesCache.clear()
  dataState.lastRawDataRef = null
  dataState.lastRawDataLength = 0
  dataState.originalData = []
  dataState.filterColumns = []
  dataState.sortColumns = []
  getProcessedRows().value = []
}

/**
 * 统一格式化单元格值，便于过滤和下拉展示
 * @param value 原始值
 * @returns string
 */
const normalizeCellValue = (value: unknown): string => String(value ?? '')

/**
 * 清理唯一值缓存
 * @param columnName 指定列名，不传则清理全部
 */
export const invalidateUniqueColumnValues = (columnName?: string) => {
  const uniqueColumnValuesCache = getRuntimeState().data.uniqueColumnValuesCache
  if (columnName) {
    uniqueColumnValuesCache.delete(columnName)
    return
  }

  uniqueColumnValuesCache.clear()
}

/**
 * 获取列过滤项
 * @param columnName 列名
 * @returns FilterItem | undefined
 */
const getFilterItem = (columnName: string): FilterItem | undefined =>
  getRuntimeState().data.filterColumns.find((item) => item.columnName === columnName)

/**
 * 获取列当前过滤值
 * @param columnName 列名
 * @returns string[]
 */
export const getColumnFilterValues = (columnName: string): string[] => {
  const filterItem = getFilterItem(columnName)
  return filterItem ? Array.from(filterItem.values) : []
}

/**
 * 更新列过滤条件
 * @param columnName 列名
 * @param selectedValues 已选值
 */
export const updateColumnFilter = (columnName: string, selectedValues: string[]) => {
  const normalizedValues = selectedValues.map((value) => normalizeCellValue(value))
  const existingFilter = getFilterItem(columnName)

  if (normalizedValues.length === 0) {
    if (!existingFilter) return

    getRuntimeState().data.filterColumns = getRuntimeState().data.filterColumns.filter(
      (item) => item.columnName !== columnName
    )
    return
  }

  if (existingFilter) {
    existingFilter.values = new Set(normalizedValues)
    return
  }

  getRuntimeState().data.filterColumns.push({
    columnName,
    values: new Set(normalizedValues)
  })
}

/**
 * 获取列的唯一值列表
 * @param columnName 列名
 * @returns string[]
 */
export const getUniqueColumnValues = (columnName: string): string[] => {
  const dataState = getRuntimeState().data
  const uniqueColumnValuesCache = dataState.uniqueColumnValuesCache
  const cachedValues = uniqueColumnValuesCache.get(columnName)
  if (cachedValues) {
    return cachedValues
  }

  const uniqueValues = Array.from(
    new Set(dataState.originalData.map((row) => normalizeCellValue(row[columnName])))
  ).sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: 'base'
    })
  )
  uniqueColumnValuesCache.set(columnName, uniqueValues)
  return uniqueValues
}

/**
 * 提交单元格值变更
 * @param row 行对象
 * @param columnName 列名
 * @param nextValue 新值
 * @returns boolean
 */
export const commitCellValueChange = (
  row: AnalyzeDataVo.AnalyzeData | null | undefined,
  columnName: string,
  nextValue: string | number
): boolean => {
  if (!row || !columnName) return false

  row[columnName] = nextValue
  const rowIndex = getSourceRowIndex(row)
  notifyCellValueChange({ row, rowIndex, columnName, value: nextValue })
  invalidateUniqueColumnValues(columnName)
  handleTableData()
  return true
}

/**
 * 处理表格数据
 * @returns {void}
 */
export const handleTableData = () => {
  measureTablePerf('handleTableData', () => {
    const dataState = getRuntimeState().data
    if (
      dataState.lastRawDataRef !== getTableParams().data ||
      dataState.lastRawDataLength !== getTableParams().data.length
    ) {
      invalidateUniqueColumnValues()
      dataState.lastRawDataRef = getTableParams().data
      dataState.lastRawDataLength = getTableParams().data.length
    }

    // 保存原始数据
    dataState.originalData = getTableParams().data.filter((row) => row && typeof row === 'object')

    // 开始处理数据
    let processedData = [...dataState.originalData]

    // 应用过滤（AND across columns, OR within column values）
    if (dataState.filterColumns.length) {
      const activeFilters = dataState.filterColumns.filter(
        (filterItem) => filterItem.values && filterItem.values.size > 0
      )
      if (activeFilters.length) {
        processedData = processedData.filter((row) => {
          for (const filterItem of activeFilters) {
            const currentValue = row[filterItem.columnName]
            if (!filterItem.values.has(normalizeCellValue(currentValue))) return false
          }
          return true
        })
      }
    }

    // 应用排序
    if (dataState.sortColumns.length) {
      const toNum = (v: string | number | null | undefined) => {
        const n = Number(v)
        return Number.isFinite(n) ? n : null
      }
      const getVal = (row: AnalyzeDataVo.AnalyzeData, key: string): string | number | undefined => {
        const val = row[key]
        if (typeof val === 'string' || typeof val === 'number') return val
        return undefined
      }
      processedData.sort((leftRow, rightRow) => {
        for (const sortColumn of dataState.sortColumns) {
          const key = sortColumn.columnName
          const leftValue = getVal(leftRow, key)
          const rightValue = getVal(rightRow, key)
          const leftNumericValue = toNum(leftValue)
          const rightNumericValue = toNum(rightValue)
          let compareResult = 0
          if (leftNumericValue !== null && rightNumericValue !== null)
            compareResult = leftNumericValue - rightNumericValue
          else compareResult = String(leftValue ?? '').localeCompare(String(rightValue ?? ''))
          if (compareResult !== 0) return sortColumn.order === 'asc' ? compareResult : -compareResult
        }
        return 0
      })
    }
    getProcessedRows().value = processedData
    updateTablePerfSnapshot({
      sourceRows: getTableParams().data.length,
      processedRows: processedData.length,
      bufferRows: getTableParams().bufferRows
    })
  })
}

/**
 * 获取列的排序状态
 * @param {string} columnName - 列名
 * @returns {'asc' | 'desc' | null} 排序状态
 */
export const getColumnSortStatus = (columnName: string): 'asc' | 'desc' | null => {
  const sortColumn = getRuntimeState().data.sortColumns.find((col) => col.columnName === columnName)
  return sortColumn ? sortColumn.order : null
}

/**
 * 处理多列排序
 * @param {GroupStore.GroupOption | MeasureStore.MeasureOption} columnOption - 列配置
 * @param {'asc' | 'desc'} order - 排序方向
 */
export const handleMultiColumnSort = (
  columnOption: GroupStore.GroupOption | MeasureStore.MeasureOption,
  order: 'asc' | 'desc'
) => {
  const columnName = columnOption.columnName
  const sortColumns = getRuntimeState().data.sortColumns
  const existingIndex = sortColumns.findIndex((col) => col.columnName === columnName)

  if (existingIndex !== -1) {
    // 如果列已存在，更新排序方向或移除
    if (sortColumns[existingIndex].order === order) {
      // 如果点击的是相同方向，移除排序
      sortColumns.splice(existingIndex, 1)
    } else {
      // 更新排序方向
      sortColumns[existingIndex].order = order
    }
  } else {
    // 添加新的排序列
    sortColumns.push({ columnName, order })
  }
}
