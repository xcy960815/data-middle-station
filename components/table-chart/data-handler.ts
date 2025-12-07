import { ref } from 'vue'
import { staticParams, tableData } from './parameter'

/**
 * 排序列接口
 */
interface SortColumn {
  /**
   * 列名
   */
  columnName: string
  /**
   * 排序方向
   */
  order: 'asc' | 'desc'
}

/**
 * 过滤项接口
 */
interface FilterItem {
  columnName: string
  /** 选中的离散值集合 */
  values: Set<string>
}

/**
 * 原始数据存储 - 不被排序或过滤修改
 */
let originalData: Array<AnalyzeDataVo.AnalyzeData> = []

/**
 * 过滤状态（数组模型）：支持多列过滤；同列内为 OR，多列之间为 AND
 */
export const filterColumns = ref<FilterItem[]>([])

/**
 * 排序列
 */
export const sortColumns = ref<SortColumn[]>([])

/**
 * 处理表格数据
 * @returns {void}
 */
export const handleTableData = () => {
  // 保存原始数据
  originalData = staticParams.data.filter((row) => row && typeof row === 'object')

  // 开始处理数据
  let processedData = [...originalData]

  // 应用过滤（AND across columns, OR within column values）
  if (filterColumns.value.length) {
    const activeFilters = filterColumns.value.filter((f) => f.values && f.values.size > 0)
    if (activeFilters.length) {
      processedData = processedData.filter((row) => {
        for (const f of activeFilters) {
          const val = row[f.columnName]
          if (!f.values.has(String(val ?? ''))) return false
        }
        return true
      })
    }
  }

  // 应用排序
  if (sortColumns.value.length) {
    const toNum = (v: string | number | null | undefined) => {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }
    const getVal = (row: AnalyzeDataVo.AnalyzeData, key: string): string | number | undefined => {
      const val = row[key]
      if (typeof val === 'string' || typeof val === 'number') return val
      return undefined
    }
    processedData.sort((a, b) => {
      for (const s of sortColumns.value) {
        const key = s.columnName
        const av = getVal(a, key)
        const bv = getVal(b, key)
        const an = toNum(av)
        const bn = toNum(bv)
        let cmp = 0
        if (an !== null && bn !== null) cmp = an - bn
        else cmp = String(av ?? '').localeCompare(String(bv ?? ''))
        if (cmp !== 0) return s.order === 'asc' ? cmp : -cmp
      }
      return 0
    })
  }
  tableData.value = processedData
}

/**
 * 获取列的排序状态
 * @param {string} columnName - 列名
 * @returns {'asc' | 'desc' | null} 排序状态
 */
export const getColumnSortStatus = (columnName: string): 'asc' | 'desc' | null => {
  const sortColumn = sortColumns.value.find((col) => col.columnName === columnName)
  return sortColumn ? sortColumn.order : null
}

/**
 * 处理多列排序
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列配置
 * @param {'asc' | 'desc'} order - 排序方向
 */
export const handleMultiColumnSort = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  order: 'asc' | 'desc'
) => {
  const columnName = columnOption.columnName
  const existingIndex = sortColumns.value.findIndex((col) => col.columnName === columnName)

  if (existingIndex !== -1) {
    // 如果列已存在，更新排序方向或移除
    if (sortColumns.value[existingIndex].order === order) {
      // 如果点击的是相同方向，移除排序
      sortColumns.value.splice(existingIndex, 1)
    } else {
      // 更新排序方向
      sortColumns.value[existingIndex].order = order
    }
  } else {
    // 添加新的排序列
    sortColumns.value.push({ columnName, order })
  }
}
