<template>
  <div id="container-table" class="container-table" :style="containerStyle"></div>

  <!-- 使用 Teleport 将下拉浮层挂到 body，避免与 Konva 容器冲突 -->
  <teleport to="body">
    <div ref="filterDropdownEl" v-if="filterDropdown.visible" class="dms-filter-dropdown" :style="filterDropdownStyle">
      <el-select
        v-model="filterDropdown.selectedValues"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        size="small"
        placeholder="选择过滤值"
        style="width: 180px"
        @change="handleSelectedFilter"
        @blur="closeFilterDropdown"
        @keydown.stop
      >
        <el-option v-for="opt in filterDropdown.options" :key="opt" :label="opt === '' ? '(空)' : opt" :value="opt" />
      </el-select>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import Konva from 'konva'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

/**
 * 获取容器元素
 * @returns {HTMLDivElement | null} 容器元素
 */
const getContainerEl = (): HTMLDivElement | null => {
  return document.getElementById('container-table') as HTMLDivElement | null
}

/**
 * 接收外部传入的数据与列配置及样式参数
 */
const props = withDefaults(
  defineProps<{
    /**
     * 数据
     */
    data: ChartDataDao.ChartData
    /**
     * 分组字段
     */
    xAxisFields: Array<GroupStore.GroupOption>
    /**
     * 维度字段
     */
    yAxisFields: Array<DimensionStore.DimensionOption>
    /**
     * 表格宽度
     */
    chartWidth?: number | string
    /**
     * 表格高度
     */
    chartHeight?: number | string
    /**
     * 表格边框
     */
    border?: boolean
    /**
     * 悬停填充颜色
     */
    hoverFill?: string
    /**
     * 表头高度
     */
    headerHeight?: number
    /**
     * 行高
     */
    rowHeight?: number
    /**
     * 滚动条大小
     */
    scrollbarSize?: number
    /**
     * 表格内边距
     */
    tablePadding?: number
    /**
     * 表头背景色
     */
    headerBg?: string
    /**
     * 表格奇数行背景色
     */
    bodyBgOdd?: string
    /**
     * 表格偶数行背景色
     */
    bodyBgEven?: string
    /**
     * 表格边框颜色
     */
    borderColor?: string
    /**
     * 表头文本颜色
     */
    headerTextColor?: string
    /**
     * 表格文本颜色
     */
    bodyTextColor?: string
    /**
     * 表头字体
     */
    headerFontFamily?: string
    /**
     * 表头字体大小
     */
    headerFontSize?: number
    /**
     * 表格内容字体
     */
    bodyFontFamily?: string
    /**
     * 表格内容字体大小
     */
    bodyFontSize?: number
    /**
     * 滚动条背景色
     */
    scrollbarBg?: string
    /**
     * 滚动条滑块颜色
     */
    scrollbarThumb?: string
    /**
     * 滚动条滑块悬停颜色
     */
    scrollbarThumbHover?: string
    /**
     * 上下缓冲行数
     */
    bufferRows?: number
    /**
     * 自动列最小宽度（当列未指定width时，均分剩余宽度，但不小于该值）
     */
    minAutoColWidth?: number
    /**
     * 滚动条拖拽容错阈值（像素），防止轻微鼠标移动意外触发滚动
     */
    scrollThreshold?: number
    /**
     * 参与排序的表头高亮背景色
     */
    headerSortActiveBg?: string
    /**
     * 是否启用行高亮
     */
    enableRowHoverHighlight?: boolean
    /**
     * 是否启用列高亮（含表头列）
     */
    enableColHoverHighlight?: boolean
    /**
     * 单元格合并方法：参考 Element Plus 的 span-method
     * 返回 [rowspan, colspan] 或 { rowspan, colspan }；返回 0/0 表示被合并覆盖
     */
    spanMethod?: (args: {
      row: ChartDataDao.ChartData[0]
      column: GroupStore.GroupOption | DimensionStore.DimensionOption
      rowIndex: number
      colIndex: number
    }) => { rowspan: number; colspan: number } | [number, number] | null | undefined
  }>(),
  {
    chartWidth: '100%',
    chartHeight: 460,
    border: false,
    hoverFill: 'rgba(24, 144, 255, 0.12)',
    headerHeight: 32,
    rowHeight: 32,
    scrollbarSize: 16,
    tablePadding: 0,
    headerBg: '#f7f7f9',
    bodyBgOdd: '#ffffff',
    bodyBgEven: '#fbfbfd',
    borderColor: '#dcdfe6',
    headerTextColor: '#303133',
    bodyTextColor: '#303133',
    headerFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
    headerFontSize: 14,
    bodyFontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif',
    bodyFontSize: 13,
    scrollbarBg: '#f1f1f1',
    scrollbarThumb: '#c1c1c1',
    scrollbarThumbHover: '#a8a8a8',
    bufferRows: 5,
    minAutoColWidth: 100,
    scrollThreshold: 10,
    headerSortActiveBg: '#ecf5ff',
    enableRowHoverHighlight: true,
    enableColHoverHighlight: true
  }
)

/**
 * 定义事件
 */
const emits = defineEmits<{
  (
    event: 'cell-click',
    payload: { rowIndex: number; colIndex: number; colKey: string; rowData: ChartDataDao.ChartData[0] }
  ): void
}>()

/**
 * 所有列
 * @returns {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>}
 */
const allColumns = computed(
  () => props.xAxisFields.concat(props.yAxisFields) as Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
)

/**
 * columnName -> alias 映射，便于过滤时兼容别名字段
 * @returns {Record<string, string>}
 */
const columnAliasMap = computed(() => {
  const map: Record<string, string> = {}
  allColumns.value.forEach((c: any) => {
    if (c && typeof c === 'object') {
      const colName = c.columnName as string
      const alias = c.alias as string | undefined
      if (colName && alias && alias !== colName) {
        map[colName] = alias
      }
    }
  })
  return map
})

/**
 * 表格数据
 * @returns {ChartDataDao.ChartData}
 */
const tableData = computed<ChartDataDao.ChartData>(() => props.data)

/**
 * 排序状态
 * @returns {Array<{ columnName: string; order: 'asc' | 'desc' }>}
 */
const sortState = reactive<{ columns: Array<{ columnName: string; order: 'asc' | 'desc' }> }>({
  columns: []
})

/**
 * 过滤状态：列名 -> 选中的离散值集合（使用 Set 便于判定）
 * @returns {Record<string, Set<string>>}
 */
const filterState = reactive<Record<string, Set<string>>>({})

/**
 * 应用排序后的数据视图
 * @returns {ChartDataDao.ChartData}
 */
const activeData = computed<ChartDataDao.ChartData>(() => {
  // 先按 filter 过滤
  let base = tableData.value
  const filterKeys = Object.keys(filterState).filter((k) => filterState[k] && filterState[k].size > 0)
  if (filterKeys.length) {
    const aliasMap = columnAliasMap.value
    base = base.filter((row) => {
      for (const k of filterKeys) {
        const set = filterState[k]
        const alias = aliasMap[k]
        const val = row[k] !== undefined ? row[k] : alias ? row[alias] : undefined
        if (!set.has(String(val ?? ''))) return false
      }
      return true
    })
  }
  /**
   * 如果未排序，则直接返回原始数据
   */
  if (!sortState.columns.length) return base
  const sorted = [...base]
  const toNum = (v: string | number) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const aliasMap2 = columnAliasMap.value
  const getVal = (row: any, key: string) =>
    row[key] !== undefined ? row[key] : aliasMap2[key] ? row[aliasMap2[key]] : undefined
  sorted.sort((a, b) => {
    for (const s of sortState.columns) {
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
  return sorted
})

/**
 * Stage 实例
 */
let stage: Konva.Stage | null = null

/**
 * 表头层（固定表头）
 */
let headerLayer: Konva.Layer | null = null

/**
 * 表格层（主体）
 */
let bodyLayer: Konva.Layer | null = null

/**
 * 固定列层（固定列）
 */
let fixedLayer: Konva.Layer | null = null

/**
 * 固定表头层（固定表头）
 */
let fixedHeaderLayer: Konva.Layer | null = null

/**
 * 滚动条层（滚动条）
 */
let scrollbarLayer: Konva.Layer | null = null

/**
 * 中间区域剪辑组（中间区域）
 */
let centerBodyClipGroup: Konva.Group | null = null

/**
 * 左侧表头组（左侧表头）
 */
let leftHeaderGroup: Konva.Group | null = null

/**
 * 中间表头组（中间表头）
 */
let centerHeaderGroup: Konva.Group | null = null

/**
 * 右侧表头组（右侧表头）
 */
let rightHeaderGroup: Konva.Group | null = null

/**
 * 左侧主体组（左侧主体）
 */
let leftBodyGroup: Konva.Group | null = null

/**
 * 中间主体组（中间主体）
 */
let centerBodyGroup: Konva.Group | null = null

/**
 * 右侧主体组
 */
let rightBodyGroup: Konva.Group | null = null

/**
 * 垂直滚动状态
 */
let scrollY = 0

/**
 * 水平滚动状态
 */
let scrollX = 0

/**
 * 垂直滚动条组
 */
let verticalScrollbarGroup: Konva.Group | null = null

/**
 * 水平滚动条组
 */
let horizontalScrollbarGroup: Konva.Group | null = null

/**
 * 垂直滚动条滑块
 */
let verticalScrollbarThumb: Konva.Rect | null = null
/**
 * 水平滚动条滑块
 */
let horizontalScrollbarThumb: Konva.Rect | null = null

/**
 * 列宽拖拽相关状态
 */
const columnWidthOverrides: Record<string, number> = {}
let isResizingColumn = false
let resizingColumnName: string | null = null
let resizeStartX = 0
let resizeStartWidth = 0
let resizeNeighborColumnName: string | null = null
let resizeNeighborStartWidth = 0

/**
 * stage 容器上用于同步指针位置的事件处理器引用
 */
let containerPointerPositionHandler: ((e: MouseEvent) => void) | null = null

/**
 * 拖拽状态
 */
let isDraggingVThumb = false
let isDraggingHThumb = false
let dragStartY = 0
let dragStartX = 0
let dragStartScrollY = 0
let dragStartScrollX = 0

/**
 * 单元格选中状态
 */
let selectedCell: { rowIndex: number; colIndex: number; colKey: string } | null = null
/**
 * 高亮矩形
 */
let highlightRect: Konva.Rect | null = null

/**
 * 虚拟滚动状态
 */
let virtualScrollTop = 0
let visibleRowStart = 0
let visibleRowEnd = 0

/**
 * 上下缓冲行数
 */
let visibleRowCount = 0

/**
 * 行悬停状态
 */
let hoveredRowIndex: number | null = null
/**
 * 列悬停状态
 */
let hoveredColIndex: number | null = null
/**
 * 左侧悬停矩形
 */
let leftHoverRect: Konva.Rect | null = null
/**
 * 中间悬停矩形
 */
let centerHoverRect: Konva.Rect | null = null
/**
 * 右侧悬停矩形（右侧主体）
 */
let rightHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（表头）
 */
let headerHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（左侧固定列）
 */
let leftColHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（中间列）
 */
let centerColHoverRect: Konva.Rect | null = null
/**
 * 列悬停矩形（右侧固定列）
 */
let rightColHoverRect: Konva.Rect | null = null
/**
 * 表头列悬停矩形（中间表头）
 */
let centerHeaderHoverRect: Konva.Rect | null = null
/**
 * 表头列悬停矩形（右侧表头）
 */
let rightHeaderHoverRect: Konva.Rect | null = null

/**
 * 对象池
 */
interface ObjectPools {
  cellRects: Konva.Rect[]
  textNodes: Konva.Text[]
  backgroundRects: Konva.Rect[]
}

/**
 * 左侧主体组对象池
 */
const leftBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
/**
 * 中间主体组对象池
 */
const centerBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }
/**
 * 右侧主体组对象池
 */
const rightBodyPools: ObjectPools = { cellRects: [], textNodes: [], backgroundRects: [] }

/**
 * 容器样式：支持外部传入 chartWidth、chartHeight 与 border
 */
const containerStyle = computed(() => {
  const height = typeof props.chartHeight === 'number' ? `${props.chartHeight}px` : (props.chartHeight ?? '460px')
  const width = typeof props.chartWidth === 'number' ? `${props.chartWidth}px` : (props.chartWidth ?? '100%')
  const borderStyle = props.border ? '1px solid #e5e7eb' : 'none'
  return {
    height,
    width,
    border: borderStyle,
    background: '#fff'
  } as Record<string, string>
})

/**
 * 过滤下拉浮层状态（DOM）
 */
const filterDropdown = reactive({
  visible: false,
  x: 0,
  y: 0,
  colName: '' as string,
  options: [] as string[],
  selectedValues: [] as string[]
})
/**
 * 过滤下拉浮层元素
 */
const filterDropdownEl = ref<HTMLDivElement | null>(null)

/**
 * 过滤下拉浮层样式
 */
const filterDropdownStyle = computed(() => {
  return {
    position: 'fixed',
    left: filterDropdown.x + 'px',
    top: filterDropdown.y + 'px',
    zIndex: String(3000)
  } as Record<string, string>
})

/**
 * 打开过滤下拉浮层
 * @param clientX 鼠标点击位置的 X 坐标
 * @param clientY 鼠标点击位置的 Y 坐标
 * @param colName 列名
 * @param options 选项列表
 * @param selected 已选中的选项
 */
const openFilterDropdown = (
  clientX: number,
  clientY: number,
  colName: string,
  options: string[],
  selected: string[]
) => {
  // Teleport 到 body 后直接使用视口坐标
  filterDropdown.x = clientX
  filterDropdown.y = clientY + 8
  filterDropdown.colName = colName
  filterDropdown.options = options
  filterDropdown.selectedValues = [...selected]
  filterDropdown.visible = true
  // 打开下拉时取消 hover 高亮，避免视觉干扰
  hoveredRowIndex = null
  hoveredColIndex = null
  createOrUpdateHoverRects()
}

/**
 * 关闭过滤下拉浮层
 * @returns {void}
 */
const closeFilterDropdown = () => {
  filterDropdown.visible = false
}

/**
 * 应用过滤下拉浮层选中的选项
 * @returns {void}
 */
const handleSelectedFilter = () => {
  const colName = filterDropdown.colName
  const selectedValues = filterDropdown.selectedValues
  if (!selectedValues || selectedValues.length === 0) {
    delete filterState[colName]
  } else {
    filterState[colName] = new Set(selectedValues)
  }
  clearGroups()
  rebuildGroups()
}

/**
 * 点击外部关闭（允许点击 Element Plus 下拉面板）
 * @param e 鼠标事件
 * @returns {void}
 */
const onGlobalMousedown = (e: MouseEvent) => {
  if (!filterDropdown.visible) return
  const panel = filterDropdownEl.value
  const target = e.target as HTMLElement | null
  if (!target) return
  // 点击自身面板内：不关闭
  if (panel && panel.contains(target)) return
  // 点击 el-select 下拉面板：不关闭
  const inElSelectDropdown = target.closest('.el-select-dropdown, .el-select__popper')
  if (inElSelectDropdown) return
  // 其它点击：关闭
  filterDropdown.visible = false
}

/**
 * 计算左右固定列与中间列的分组与宽度汇总
 */
const getSplitColumns = () => {
  if (!stage) {
    // 如果stage还没有初始化，返回默认值
    const leftCols = allColumns.value.filter((c) => c.fixed === 'left')
    const rightCols = allColumns.value.filter((c) => c.fixed === 'right')
    const centerCols = allColumns.value.filter((c) => !c.fixed)
    return {
      leftCols,
      centerCols,
      rightCols,
      leftWidth: 0,
      centerWidth: 0,
      rightWidth: 0,
      totalWidth: 0
    }
  }

  const stageWidthRaw = stage.width()
  const stageHeightRaw = stage.height()
  const contentHeightForV = activeData.value.length * props.rowHeight
  const vBarPre = contentHeightForV > stageHeightRaw - props.headerHeight ? props.scrollbarSize : 0
  const stageWidth = stageWidthRaw - vBarPre

  // 计算已设置宽度的列的总宽度
  const fixedWidthColumns = allColumns.value.filter((c) => c.width !== undefined)
  const autoWidthColumns = allColumns.value.filter((c) => c.width === undefined)
  const fixedTotalWidth = fixedWidthColumns.reduce((acc, c) => acc + (c.width || 0), 0)

  // 计算自动宽度列应该分配的宽度
  const remainingWidth = Math.max(0, stageWidth - fixedTotalWidth)
  const rawAutoWidth = autoWidthColumns.length > 0 ? remainingWidth / autoWidthColumns.length : 0
  const autoColumnWidth = Math.max(props.minAutoColWidth, rawAutoWidth)

  // 为每个列计算最终宽度（支持用户拖拽覆盖）
  const columnsWithWidth = allColumns.value.map((col) => {
    const overrideWidth = columnWidthOverrides[col.columnName as string]
    const width = overrideWidth !== undefined ? overrideWidth : col.width !== undefined ? col.width : autoColumnWidth
    return { ...col, width }
  })

  const leftCols = columnsWithWidth.filter((c) => c.fixed === 'left')
  const rightCols = columnsWithWidth.filter((c) => c.fixed === 'right')
  const centerCols = columnsWithWidth.filter((c) => !c.fixed)
  /**
   * 计算列宽总和
   * @param columns 列数组
   * @returns 列宽总和
   */
  const sumWidth = (columns: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>) =>
    columns.reduce((acc, column) => acc + (column.width || 0), 0)

  return {
    leftCols,
    centerCols,
    rightCols,
    leftWidth: sumWidth(leftCols),
    centerWidth: sumWidth(centerCols),
    rightWidth: sumWidth(rightCols),
    totalWidth: sumWidth(columnsWithWidth)
  }
}

/**
 * 限制数值在[min, max] 区间内
 * @param n 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的数值
 */
const clamp = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n))
}

/**
 * 文本起始 X 坐标（包含左侧 8px 内边距）
 * @param x 文本起始 X 坐标
 * @returns 文本起始 X 坐标（包含左侧 8px 内边距）
 */
const getTextX = (x: number) => {
  return x + 8
}

/**
 * 超出最大宽度时裁剪文本，并追加省略号
 * @param text 文本
 * @param maxWidth 最大宽度
 * @param fontSize 字体大小
 * @param fontFamily 字体
 * @returns 裁剪后的文本
 */
const truncateText = (text: string, maxWidth: number, fontSize: number, fontFamily: string): string => {
  // 创建一个临时文本节点来测量文本宽度
  const tempText = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily
  })

  // 如果文本宽度小于等于 maxWidth，直接返回
  if (tempText.width() <= maxWidth) {
    tempText.destroy()
    return text
  }

  // 二分查找，找到最大可容纳的字符数
  let left = 0
  let right = text.length
  let result = ''

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const testText = text.substring(0, mid) + '...'

    tempText.text(testText)

    if (tempText.width() <= maxWidth) {
      result = testText
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  tempText.destroy()
  return result || '...'
}

/**
 * 在指定分组内创建单元格高亮矩形
 * @param x 矩形 X 坐标
 * @param y 矩形 Y 坐标
 * @param width 矩形宽度
 * @param height 矩形高度
 * @param group 分组
 */
const createHighlightRect = (x: number, y: number, width: number, height: number, group: Konva.Group) => {
  if (highlightRect) {
    highlightRect.destroy()
    highlightRect = null
  }

  highlightRect = new Konva.Rect({
    x,
    y,
    width,
    height,
    fill: 'rgba(66, 165, 245, 0.3)',
    stroke: '#1976d2',
    strokeWidth: 2,
    listening: false
  })

  group.add(highlightRect)
  highlightRect.moveToTop()
  const layer = group.getLayer()
  layer?.batchDraw()
}

/**
 * 处理单元格点击，更新选中状态并抛出事件
 * @param rowIndex 行索引
 * @param colIndex 列索引
 * @param col 列配置
 * @param cellX 单元格 X 坐标
 * @param cellY 单元格 Y 坐标
 * @param cellWidth 单元格宽度
 * @param cellHeight 单元格高度
 * @param group 分组
 */
const handleCellClick = (
  rowIndex: number,
  colIndex: number,
  col: GroupStore.GroupOption | DimensionStore.DimensionOption,
  cellX: number,
  cellY: number,
  cellWidth: number,
  cellHeight: number,
  group: Konva.Group
) => {
  selectedCell = { rowIndex, colIndex, colKey: col.columnName }
  if (rowIndex >= visibleRowStart && rowIndex <= visibleRowEnd) {
    createHighlightRect(cellX, cellY, cellWidth, cellHeight, group)
  } else if (highlightRect) {
    highlightRect.destroy()
    highlightRect = null
  }

  const rowData = activeData.value[rowIndex]
  emits('cell-click', { rowIndex, colIndex, colKey: col.columnName, rowData })
}

/**
 * 获取滚动限制
 * @returns {{ maxScrollX: number, maxScrollY: number }}
 */
const getScrollLimits = () => {
  if (!stage) return { maxScrollX: 0, maxScrollY: 0 }

  const { totalWidth, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const contentHeight = activeData.value.length * props.rowHeight
  // 初步估算：不预留滚动条空间
  const visibleContentWidthNoV = stageWidth - leftWidth - rightWidth
  const contentHeightNoH = stageHeight - props.headerHeight
  const prelimMaxX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidthNoV)
  const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
  const verticalScrollbarSpace = prelimMaxY > 0 ? props.scrollbarSize : 0
  const horizontalScrollbarSpace = prelimMaxX > 0 ? props.scrollbarSize : 0
  // 复算：考虑另一条滚动条占位
  const visibleContentWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpace
  const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
  const maxScrollY = Math.max(0, contentHeight - (stageHeight - props.headerHeight - horizontalScrollbarSpace))

  return { maxScrollX, maxScrollY }
}

/**
 * 计算虚拟滚动的可视区域（根据当前滚动位置得出渲染行范围）
 * @returns {void}
 */
const calculateVisibleRows = () => {
  if (!stage) return

  const stageHeight = stage.height()
  const contentHeight = stageHeight - props.headerHeight - props.scrollbarSize

  // 计算可视区域能显示的行数
  visibleRowCount = Math.ceil(contentHeight / props.rowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollY / props.rowHeight)

  // 添加缓冲区，确保滚动时有预渲染的行
  visibleRowStart = Math.max(0, startRow - props.bufferRows)
  visibleRowEnd = Math.min(activeData.value.length - 1, startRow + visibleRowCount + props.bufferRows)
}

/**
 * 对象池：获取或创建对象
 * @param pool 对象池
 * @param createFn 创建函数
 * @returns {T}
 */
const getFromPool = <T extends Konva.Node>(pool: T[], createFn: () => T): T => {
  let pooledNode = pool.pop()
  if (!pooledNode) {
    pooledNode = createFn()
  }
  return pooledNode
}

/**
 * 对象池：回收对象
 * @param pool 对象池
 * @param node 对象
 * @returns {void}
 */
const returnToPool = <T extends Konva.Node>(pool: T[], node: T) => {
  node.remove() // 从场景中移除
  pool.push(node)
}

/**
 * 为固定列添加右边缘阴影效果
 * @returns {void}
 */
const createFixedColumnShadow = () => {
  if (!stage || !bodyLayer || !headerLayer) return
  // 清除并不再绘制固定列阴影，以避免出现额外竖线
  const existingBodyShadow = stage.findOne('.fixedColumnBodyShadow')
  const existingHeaderShadow = stage.findOne('.fixedColumnHeaderShadow')
  if (existingBodyShadow) existingBodyShadow.destroy()
  if (existingHeaderShadow) existingHeaderShadow.destroy()
}

/**
 * 渲染表格
 * @returns {void}
 */
const initStage = () => {
  const tableContainer = getContainerEl()
  if (!tableContainer) return
  const width = tableContainer.clientWidth
  const height = tableContainer.clientHeight

  if (!stage) {
    stage = new Konva.Stage({ container: tableContainer, width, height })
  } else {
    stage.size({ width, height })
  }

  if (!headerLayer) {
    headerLayer = new Konva.Layer()
    stage.add(headerLayer)
  }

  if (!bodyLayer) {
    bodyLayer = new Konva.Layer()
    stage.add(bodyLayer)
  }

  if (!fixedLayer) {
    fixedLayer = new Konva.Layer()
    stage.add(fixedLayer)
  }

  if (!fixedHeaderLayer) {
    fixedHeaderLayer = new Konva.Layer()
    stage.add(fixedHeaderLayer)
  }

  if (!scrollbarLayer) {
    scrollbarLayer = new Konva.Layer()
    stage.add(scrollbarLayer)
  }

  const { leftWidth, rightWidth } = getSplitColumns()
  const { maxScrollX, maxScrollY } = getScrollLimits()
  const verticalScrollbarSpace = maxScrollY > 0 ? props.scrollbarSize : 0
  const horizontalScrollbarSpace = maxScrollX > 0 ? props.scrollbarSize : 0
  const contentHeight = height - props.headerHeight - horizontalScrollbarSpace

  // 创建中间区域剪辑组
  centerBodyClipGroup = new Konva.Group({
    x: leftWidth,
    y: props.headerHeight,
    clip: {
      x: 0,
      y: 0,
      width: width - leftWidth - rightWidth - verticalScrollbarSpace,
      height: contentHeight
    }
  })
  // 添加中间区域剪辑组到body层
  bodyLayer.add(centerBodyClipGroup)
}

/**
 * 清除分组
 * @returns {void}
 */
const clearGroups = () => {
  headerLayer?.destroyChildren()
  bodyLayer?.destroyChildren()
  fixedLayer?.destroyChildren()
  fixedHeaderLayer?.destroyChildren()
  scrollbarLayer?.destroyChildren()

  // 清理对象池
  const clearPool = (pool: Konva.Node[]) => {
    pool.forEach((node) => node.destroy())
    pool.length = 0
  }

  clearPool(leftBodyPools.cellRects)
  clearPool(leftBodyPools.textNodes)
  clearPool(leftBodyPools.backgroundRects)
  clearPool(centerBodyPools.cellRects)
  clearPool(centerBodyPools.textNodes)
  clearPool(centerBodyPools.backgroundRects)
  clearPool(rightBodyPools.cellRects)
  clearPool(rightBodyPools.textNodes)
  clearPool(rightBodyPools.backgroundRects)

  /**
   * 重置滚动条引用
   */
  verticalScrollbarGroup = null
  horizontalScrollbarGroup = null
  verticalScrollbarThumb = null
  horizontalScrollbarThumb = null

  /**
   * 重置中心区域剪辑组引用
   */
  centerBodyClipGroup = null

  /**
   * 重置单元格选择
   */
  selectedCell = null
  highlightRect = null

  /**
   * 重置虚拟滚动状态
   */
  visibleRowStart = 0
  visibleRowEnd = 0
  visibleRowCount = 0

  /**
   * 重置悬浮高亮
   */
  hoveredRowIndex = null
  hoveredColIndex = null
  leftHoverRect = null
  centerHoverRect = null
  rightHoverRect = null
  headerHoverRect = null
  leftColHoverRect = null
  centerColHoverRect = null
  rightColHoverRect = null
  centerHeaderHoverRect = null
  rightHeaderHoverRect = null
}

/**
 * 重建分组
 * @returns {void}
 */
const rebuildGroups = () => {
  if (!stage || !headerLayer || !bodyLayer || !fixedLayer || !fixedHeaderLayer || !scrollbarLayer) return

  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()
  const verticalScrollbarSpace = maxScrollY > 0 ? props.scrollbarSize : 0
  const horizontalScrollbarSpace = maxScrollX > 0 ? props.scrollbarSize : 0

  /**
   * 确保 centerBodyClipGroup 存在
   */
  if (!centerBodyClipGroup) {
    const contentHeight = stageHeight - props.headerHeight - horizontalScrollbarSpace
    centerBodyClipGroup = new Konva.Group({
      x: leftWidth,
      y: props.headerHeight,
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - verticalScrollbarSpace,
        height: contentHeight
      }
    })
    bodyLayer.add(centerBodyClipGroup)
  }

  leftHeaderGroup = new Konva.Group({ x: 0, y: 0, name: 'leftHeader' })
  centerHeaderGroup = new Konva.Group({ x: leftWidth - scrollX, y: 0, name: 'centerHeader' })
  rightHeaderGroup = new Konva.Group({
    x: stageWidth - rightWidth - verticalScrollbarSpace,
    y: 0,
    name: 'rightHeader'
  })

  leftBodyGroup = new Konva.Group({ x: 0, y: props.headerHeight - scrollY, name: 'leftBody' })
  centerBodyGroup = new Konva.Group({ x: -scrollX, y: -scrollY, name: 'centerBody' })
  rightBodyGroup = new Konva.Group({
    x: stageWidth - rightWidth - verticalScrollbarSpace,
    y: props.headerHeight - scrollY,
    name: 'rightBody'
  })

  /**
   * 添加中心滚动表头到表头层（底层）
   */
  headerLayer.add(centerHeaderGroup)

  /**
   * 添加固定表头到固定表头层（顶层）
   */
  fixedHeaderLayer.add(leftHeaderGroup, rightHeaderGroup)

  /**
   * 添加中心滚动内容到剪辑组
   */
  centerBodyClipGroup.add(centerBodyGroup)

  /**
   * 添加固定列到固定层（顶层）
   */
  fixedLayer.add(leftBodyGroup, rightBodyGroup)
  /**
   * 绘制左侧表头部分
   */
  drawHeaderPart(leftHeaderGroup, leftCols, 0)
  /**
   * 绘制中间表头部分
   */
  drawHeaderPart(centerHeaderGroup, centerCols, 0)
  /**
   * 绘制右侧表头部分
   */
  drawHeaderPart(rightHeaderGroup, rightCols, 0)

  /**
   * 绘制左侧主体部分
   */
  drawBodyPart(leftBodyGroup, leftCols, leftBodyPools)
  /**
   * 绘制中间主体部分
   */
  drawBodyPart(centerBodyGroup, centerCols, centerBodyPools)
  /**
   * 绘制右侧主体部分
   */
  drawBodyPart(rightBodyGroup, rightCols, rightBodyPools)

  createScrollbars()

  headerLayer.batchDraw()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  scrollbarLayer?.batchDraw()
  // 重新计算可视区与 hover after sort/resize
  if (props.enableRowHoverHighlight || props.enableColHoverHighlight) {
    const p = stage.getPointerPosition()
    recomputeHoverIndexFromPointer(p?.y)
  }
}

/**
 * 创建滚动条
 */
const createScrollbars = () => {
  if (!stage || !scrollbarLayer) return
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Vertical scrollbar（仅在需要时创建，同时创建表头遮罩）
  if (maxScrollY > 0) {
    const vScrollbarHeaderMask = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: 0,
      width: props.scrollbarSize,
      height: props.headerHeight,
      fill: props.headerBg,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    scrollbarLayer.add(vScrollbarHeaderMask)

    verticalScrollbarGroup = new Konva.Group()
    scrollbarLayer.add(verticalScrollbarGroup)

    const verticalScrollbarTrack = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: props.headerHeight,
      width: props.scrollbarSize,
      height: stageHeight - props.headerHeight - props.scrollbarSize,
      fill: props.scrollbarBg,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    verticalScrollbarGroup.add(verticalScrollbarTrack)

    const thumbHeight = Math.max(
      20,
      ((stageHeight - props.headerHeight - props.scrollbarSize) *
        (stageHeight - props.headerHeight - props.scrollbarSize)) /
        (tableData.value.length * props.rowHeight)
    )
    const thumbY =
      props.headerHeight +
      (scrollY / maxScrollY) * (stageHeight - props.headerHeight - props.scrollbarSize - thumbHeight)

    verticalScrollbarThumb = new Konva.Rect({
      x: stageWidth - props.scrollbarSize + 2,
      y: thumbY,
      width: props.scrollbarSize - 4,
      height: thumbHeight,
      fill: props.scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    verticalScrollbarGroup.add(verticalScrollbarThumb)

    setupVerticalScrollbarEvents()
  }

  // 水平滚动条
  if (maxScrollX > 0) {
    horizontalScrollbarGroup = new Konva.Group()
    scrollbarLayer.add(horizontalScrollbarGroup)

    const verticalScrollbarSpaceForHorizontal = maxScrollY > 0 ? props.scrollbarSize : 0
    const horizontalScrollbarTrack = new Konva.Rect({
      x: 0,
      y: stageHeight - props.scrollbarSize,
      width: stageWidth - verticalScrollbarSpaceForHorizontal,
      height: props.scrollbarSize,
      fill: props.scrollbarBg,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    horizontalScrollbarGroup.add(horizontalScrollbarTrack)

    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const verticalScrollbarSpaceForThumb = maxScrollY > 0 ? props.scrollbarSize : 0
    const visibleWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpaceForThumb
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)

    horizontalScrollbarThumb = new Konva.Rect({
      x: thumbX,
      y: stageHeight - props.scrollbarSize + 2,
      width: thumbWidth,
      height: props.scrollbarSize - 4,
      fill: props.scrollbarThumb,
      cornerRadius: 2,
      draggable: false
    })
    horizontalScrollbarGroup.add(horizontalScrollbarThumb)

    setupHorizontalScrollbarEvents()
  }
}

/**
 * 绘制表头部分
 * @param group 分组
 * @param cols 列
 * @param startX 起始 X 坐标
 */
const drawHeaderPart = (
  group: Konva.Group | null,
  cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  startX: number
) => {
  if (!group) return

  // background
  const totalWidth = cols.reduce((acc, c) => acc + (c.width || 0), 0)
  const bg = new Konva.Rect({
    x: startX + props.tablePadding,
    y: 0,
    width: totalWidth,
    height: props.headerHeight,
    fill: props.headerBg,
    stroke: props.borderColor,
    strokeWidth: 1
  })
  group.add(bg)

  let x = startX
  cols.forEach((col, colIndex) => {
    const cell = new Konva.Rect({
      x,
      y: 0,
      width: col.width || 0,
      height: props.headerHeight,
      stroke: props.borderColor,
      strokeWidth: 1,
      listening: true,
      cursor: 'pointer'
    })
    group.add(cell)

    // 强制指针样式为小手，避免被其他地方的默认样式覆盖
    cell.on('mouseenter', () => {
      if (!isResizingColumn && stage) stage.container().style.cursor = 'pointer'
    })
    cell.on('mouseleave', () => {
      if (!isResizingColumn && stage) stage.container().style.cursor = 'default'
    })

    // 如果该列当前参与排序，则给表头单元格一个高亮背景（多列排序）
    {
      const found = sortState.columns.find((s) => s.columnName === col.columnName)
      cell.fill(found ? props.headerSortActiveBg : 'transparent')
    }

    // 预留右侧区域（排序箭头 + 过滤图标），避免与文本重叠
    const maxTextWidth = (col.width || 0) - 40 // 预留约 40px 给右侧图标
    const fontFamily = props.headerFontFamily
    const fontSize = props.headerFontSize
    const displayName = col.displayName || col.alias || col.columnName
    const truncatedTitle = truncateText(displayName, maxTextWidth, fontSize, fontFamily)
    const label = new Konva.Text({
      x: getTextX(x),
      y: props.headerHeight / 2,
      text: truncatedTitle,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: props.headerTextColor,
      align: 'left',
      verticalAlign: 'middle',
      listening: false
    })
    label.offsetY(label.height() / 2)
    group.add(label)

    // 排序箭头（三角形 ▲/▼），更紧凑与清晰（多列排序）
    const foundSort = sortState.columns.find((s) => s.columnName === col.columnName)
    const activeColor = '#409EFF'
    const inactiveColor = '#C0C4CC'
    const upColor = foundSort?.order === 'asc' ? activeColor : inactiveColor
    const downColor = foundSort?.order === 'desc' ? activeColor : inactiveColor

    // 右侧预留区域：排序箭头 + 过滤图标（加大横向间距）
    const arrowX = x + (col.width || 0) - 34
    const centerY = props.headerHeight / 2
    const arrowSize = 5
    const gap = 2

    const upTriangle = new Konva.RegularPolygon({
      x: arrowX,
      y: centerY - (arrowSize + gap) / 2,
      sides: 3,
      radius: arrowSize,
      rotation: 0,
      fill: upColor,
      listening: true
    })
    const downTriangle = new Konva.RegularPolygon({
      x: arrowX,
      y: centerY + (arrowSize + gap) / 2,
      sides: 3,
      radius: arrowSize,
      rotation: 180,
      fill: downColor,
      listening: true
    })
    group.add(upTriangle)
    group.add(downTriangle)

    // 排序箭头也显示小手
    const setPointer = (on: boolean) => {
      if (stage) stage.container().style.cursor = on ? 'pointer' : 'default'
    }
    upTriangle.on('mouseenter', () => setPointer(true))
    upTriangle.on('mouseleave', () => setPointer(false))
    upTriangle.on('click', (evt) => cell.fire('click', evt))
    downTriangle.on('mouseenter', () => setPointer(true))
    downTriangle.on('mouseleave', () => setPointer(false))
    downTriangle.on('click', (evt) => cell.fire('click', evt))

    // 过滤图标（放大镜）
    if (col.filterable) {
      const hasFilter = !!(filterState[col.columnName] && filterState[col.columnName].size > 0)
      const filterColor = hasFilter ? '#409EFF' : '#C0C4CC'
      const filterX = x + (col.width || 0) - 12
      const filterIcon = new Konva.Circle({
        x: filterX,
        y: centerY,
        radius: 5,
        stroke: filterColor,
        strokeWidth: 2,
        listening: true,
        name: `filter-icon-${col.columnName}`
      })
      const handle = new Konva.Line({
        points: [filterX + 3, centerY + 3, filterX + 6, centerY + 6],
        stroke: filterColor,
        strokeWidth: 2,
        listening: false
      })
      filterIcon.on('mouseenter', () => {
        if (stage) stage.container().style.cursor = 'pointer'
      })
      filterIcon.on('mouseleave', () => {
        if (stage) stage.container().style.cursor = 'default'
      })
      group.add(filterIcon)
      group.add(handle)

      // 点击图标：以 DOM 下拉框方式展示可选值
      filterIcon.on('click', (evt) => {
        const values = new Set<string>()
        tableData.value.forEach((r) => values.add(String(r[col.columnName] ?? '')))
        const options = Array.from(values)
        const current = filterState[col.columnName] ? Array.from(filterState[col.columnName]!) : []
        const optionUnion = Array.from(new Set<string>([...options, ...current]))
        openFilterDropdown(evt.evt.clientX, evt.evt.clientY, col.columnName, optionUnion, current)
      })
    }

    // 列宽拖拽手柄（位于单元格右边缘，优先响应）
    const RESIZER_WIDTH = 6
    const resizer = new Konva.Rect({
      x: x + (col.width || 0) - RESIZER_WIDTH / 2,
      y: 0,
      width: RESIZER_WIDTH,
      height: props.headerHeight,
      fill: 'transparent',
      listening: true,
      draggable: false,
      name: `col-resizer-${col.columnName}`
    })
    group.add(resizer)

    resizer.on('mouseenter', () => {
      if (stage) stage.container().style.cursor = 'col-resize'
    })
    resizer.on('mouseleave', () => {
      if (!isResizingColumn && stage) stage.container().style.cursor = 'default'
    })
    resizer.on('mousedown', (evt) => {
      isResizingColumn = true
      resizingColumnName = col.columnName
      resizeStartX = evt.evt.clientX
      resizeStartWidth = col.width || 0
      // 找到同组内紧随其后的列，作为跟随调整的邻居列
      const neighbor = cols[colIndex + 1]
      if (neighbor) {
        resizeNeighborColumnName = neighbor.columnName
        resizeNeighborStartWidth = neighbor.width || 0
      } else {
        resizeNeighborColumnName = null
        resizeNeighborStartWidth = 0
      }
      if (stage) stage.container().style.cursor = 'col-resize'
    })

    // 点击表头切换排序（避免和拖拽冲突）
    // 默认支持多列排序：按住 Shift/Ctrl/⌘ 点击可追加/切换该列；普通点击为独占该列
    cell.on('click', (evt) => {
      if (isResizingColumn) return
      const e = evt.evt
      const hasModifier = !!(e && (e.shiftKey || e.ctrlKey || e.metaKey))
      const idx = sortState.columns.findIndex((s) => s.columnName === col.columnName)

      if (hasModifier) {
        // 多列模式：在原序列中追加/切换/移除该列
        if (idx === -1) {
          sortState.columns = [...sortState.columns, { columnName: col.columnName, order: 'asc' }]
        } else {
          const next = [...sortState.columns]
          if (next[idx].order === 'asc') next[idx] = { columnName: col.columnName, order: 'desc' }
          else if (next[idx].order === 'desc') next.splice(idx, 1)
          sortState.columns = next
        }
      } else {
        // 单列模式：仅对当前列循环 asc -> desc -> remove
        if (idx === -1) {
          sortState.columns = [{ columnName: col.columnName, order: 'asc' }]
        } else if (sortState.columns[idx].order === 'asc') {
          sortState.columns = [{ columnName: col.columnName, order: 'desc' }]
        } else {
          sortState.columns = []
        }
      }
      clearGroups()
      rebuildGroups()
    })

    x += col.width || 0
  })

  // 表头渲染完成后，如果是左侧表头，创建固定列阴影
  if (group && group.name() === 'leftHeader') {
    // 延迟创建阴影，确保所有内容都已渲染
    setTimeout(() => createFixedColumnShadow(), 0)
  }
}
/**
 * 设置垂直滚动条事件
 * @returns {void}
 */
const setupVerticalScrollbarEvents = () => {
  if (!verticalScrollbarThumb || !stage) return

  verticalScrollbarThumb.on('mousedown', (e) => {
    isDraggingVThumb = true
    dragStartY = e.evt.clientY
    dragStartScrollY = scrollY
    stage!.container().style.cursor = 'grabbing'

    // 设置指针位置到 stage，避免 Konva 警告
    stage!.setPointersPositions(e.evt)
  })

  verticalScrollbarThumb.on('mouseenter', () => {
    if (verticalScrollbarThumb) verticalScrollbarThumb.fill(props.scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  verticalScrollbarThumb.on('mouseleave', () => {
    if (verticalScrollbarThumb && !isDraggingVThumb) verticalScrollbarThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 设置水平滚动条事件
 * @returns {void}
 */
const setupHorizontalScrollbarEvents = () => {
  if (!horizontalScrollbarThumb || !stage) return

  horizontalScrollbarThumb.on('mousedown', (e) => {
    isDraggingHThumb = true
    dragStartX = e.evt.clientX
    dragStartScrollX = scrollX
    stage!.container().style.cursor = 'grabbing'

    // 设置指针位置到 stage，避免 Konva 警告
    stage!.setPointersPositions(e.evt)
  })

  horizontalScrollbarThumb.on('mouseenter', () => {
    if (horizontalScrollbarThumb) horizontalScrollbarThumb.fill(props.scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  horizontalScrollbarThumb.on('mouseleave', () => {
    if (horizontalScrollbarThumb && !isDraggingHThumb) horizontalScrollbarThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 虚拟滚动版本的drawBodyPart
 * 只渲染可视区域的行
 * @param group 分组
 * @param cols 列
 * @param pools 对象池
 * @returns {void}
 */
const drawBodyPart = (
  group: Konva.Group | null,
  cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  pools: ObjectPools
) => {
  if (!stage || !group) return

  // 计算可视区域
  calculateVisibleRows()
  // 切片渲染期间暂存当前指针位置，避免 getPointerPosition 在拖拽中为 null
  const pointerPosSnapshot = stage.getPointerPosition()

  const totalWidth = cols.reduce((acc, c) => acc + (c.width || 0), 0)

  // 清空当前组，将对象返回池中
  const children = group.children.slice() // 复制数组避免修改时的问题
  children.forEach((child) => {
    if (child instanceof Konva.Rect) {
      // 检查是否为阴影元素
      if (child.name() === 'fixedColumnShadow') {
        child.destroy() // 阴影元素直接销毁，不回收到池中
      } else if (child.name() && (child.name().startsWith('hoverRect') || child.name().startsWith('hoverColRect'))) {
        // 保留 hover 高亮矩形，不回收到池中
        return
      } else if (child.fill() && child.fill() !== 'transparent') {
        // 背景矩形
        returnToPool(pools.backgroundRects, child as Konva.Rect)
      } else {
        // 单元格边框矩形
        returnToPool(pools.cellRects, child as Konva.Rect)
      }
    } else if (child instanceof Konva.Text) {
      returnToPool(pools.textNodes, child as Konva.Text)
    }
  })

  // 记录已被合并覆盖的单元格，避免重复绘制
  const coveredCells = new Set<string>()

  // 渲染可视区域的行
  for (let rowIndex = visibleRowStart; rowIndex <= visibleRowEnd; rowIndex++) {
    const row = activeData.value[rowIndex]
    const y = rowIndex * props.rowHeight

    // 创建背景条纹：必须置底，避免在合并单元格跨越多行时覆盖上方单元格
    const bg = getFromPool(pools.backgroundRects, () => new Konva.Rect({ listening: false, name: 'row-bg' }))

    bg.x(0)
    bg.y(y)
    bg.width(totalWidth)
    bg.height(props.rowHeight)
    bg.fill(rowIndex % 2 === 0 ? props.bodyBgOdd : props.bodyBgEven)
    bg.stroke('')
    bg.strokeWidth(0)
    group.add(bg)
    bg.moveToBottom()

    // 渲染每列的单元格
    let x = 0
    cols.forEach((col, colIndex) => {
      const coveredKey = `${rowIndex}:${colIndex}`
      if (coveredCells.has(coveredKey)) {
        x += col.width || 0
        return
      }
      const isMergedCol = false
      const hasSpanMethod = typeof props.spanMethod === 'function'
      let spanRow = 1
      let spanCol = 1
      let coveredBySpanMethod = false
      if (hasSpanMethod) {
        const res = props.spanMethod!({ row, column: col, rowIndex, colIndex })
        if (Array.isArray(res)) {
          spanRow = Math.max(0, Number(res[0]) || 0)
          spanCol = Math.max(0, Number(res[1]) || 0)
        } else if (res && typeof res === 'object') {
          spanRow = Math.max(0, Number(res.rowspan) || 0)
          spanCol = Math.max(0, Number(res.colspan) || 0)
        }
        if (spanRow === 0 && spanCol === 0) coveredBySpanMethod = true
      }
      let currentSpan: { start: number; end: number } | null = null
      let shouldDraw = true
      let mergedDrawStart = rowIndex
      let mergedDrawEnd = rowIndex
      if (hasSpanMethod) {
        if (coveredBySpanMethod) {
          shouldDraw = false
        } else {
          mergedDrawStart = rowIndex
          mergedDrawEnd = Math.min(rowIndex + spanRow - 1, visibleRowEnd)
        }
      }

      if (!shouldDraw) {
        // 该列该行被上方合并单元格覆盖，仅推进 x 游标
        x += col.width || 0
        return
      }

      // 创建单元格边框
      const cell = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, cursor: 'pointer' }))

      const computedRowSpan = hasSpanMethod ? spanRow : 1
      const cellHeight = computedRowSpan * props.rowHeight

      // 列跨度宽度
      let cellWidth = col.width || 0
      if (hasSpanMethod && spanCol > 1) {
        let acc = 0
        for (let c = colIndex; c < Math.min(colIndex + spanCol, cols.length); c++) {
          acc += cols[c].width || 0
          if (c !== colIndex) {
            for (let r = rowIndex; r < Math.min(rowIndex + spanRow, activeData.value.length); r++) {
              if (r >= visibleRowStart && r <= visibleRowEnd) coveredCells.add(`${r}:${c}`)
            }
          }
        }
        cellWidth = acc
      }
      if (!hasSpanMethod && isMergedCol && currentSpan) {
        for (let r = mergedDrawStart + 1; r <= mergedDrawEnd; r++) coveredCells.add(`${r}:${colIndex}`)
      }

      cell.x(x)
      cell.y(y)
      cell.width(cellWidth)
      cell.height(cellHeight)
      cell.stroke(props.borderColor)
      cell.strokeWidth(1)
      // 始终保持单元格为透明，让行/列 hover 与底层条纹统一表现
      cell.fill('transparent')

      // 清除之前的事件监听器
      cell.off('click')

      // 添加点击事件
      cell.on('click', () => {
        // 对于合并单元格，基于指针位置推断点击的是跨度内的哪一行
        let clickedRowIndex = rowIndex
        // 默认不启用“相同值合并”，因此不需要基于跨度推断点击行
        handleCellClick(clickedRowIndex, colIndex, col, cell.x(), cell.y(), cellWidth, cellHeight, group)
      })
      group.add(cell)

      // 创建文本
      const rawValue = row[col.displayName || col.alias || col.columnName]
      const value = String(rawValue ?? '')
      const maxTextWidth = cellWidth - 16
      const fontFamily = props.bodyFontFamily
      const fontSize = props.bodyFontSize
      const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

      const textNode = getFromPool(pools.textNodes, () => new Konva.Text({ listening: false }))

      textNode.x(getTextX(x))
      textNode.y(y + cellHeight / 2)
      textNode.text(truncatedValue)
      textNode.fontSize(fontSize)
      textNode.fontFamily(fontFamily)
      textNode.fill(props.bodyTextColor)
      textNode.align('left')
      textNode.verticalAlign('middle')
      textNode.offsetY(textNode.height() / 2)
      group.add(textNode)

      const colShowOverflow = col.showOverflowTooltip
      const enableTooltip = colShowOverflow !== undefined ? colShowOverflow : false
      if (enableTooltip && truncatedValue !== value) {
        // 悬浮提示：仅在文本被截断时创建 Konva.Tooltip 等价层
        // 这里用浏览器原生 title 实现，命中区域为单元格矩形
        // Konva 没有内置 tooltip，避免复杂度，先用 title
        cell.off('mouseenter.tooltip')
        cell.on('mouseenter.tooltip', () => {
          if (!stage) return
          // 设置 container 的 title
          stage.container().setAttribute('title', String(rawValue ?? ''))
        })
        cell.off('mouseleave.tooltip')
        cell.on('mouseleave.tooltip', () => {
          if (!stage) return
          // 清除 title，避免全局悬浮
          stage.container().removeAttribute('title')
        })
      }

      x += col.width || 0
    })
  }

  // 检查是否需要重新创建高亮（选中的单元格在当前可视区域内）
  if (selectedCell && selectedCell.rowIndex >= visibleRowStart && selectedCell.rowIndex <= visibleRowEnd) {
    // 找到选中的列在当前组中的位置
    const selectedColIndex = cols.findIndex((col) => col.columnName === selectedCell!.colKey)
    if (selectedColIndex >= 0) {
      // 计算高亮位置
      let highlightX = 0
      for (let i = 0; i < selectedColIndex; i++) {
        highlightX += cols[i].width || 0
      }
      const col = cols[selectedColIndex]
      // 默认宽/高
      let highlightWidth = col.width || 0
      let highlightY = selectedCell!.rowIndex * props.rowHeight
      let highlightHeight = props.rowHeight

      // 若存在 spanMethod，以其为准
      if (typeof props.spanMethod === 'function') {
        const res = props.spanMethod({
          row: activeData.value[selectedCell!.rowIndex],
          column: col,
          rowIndex: selectedCell!.rowIndex,
          colIndex: selectedColIndex
        })
        let spanRow = 1
        let spanCol = 1
        if (Array.isArray(res)) {
          spanRow = Math.max(0, Number(res[0]) || 0)
          spanCol = Math.max(0, Number(res[1]) || 0)
        } else if (res && typeof res === 'object') {
          spanRow = Math.max(0, Number(res.rowspan) || 0)
          spanCol = Math.max(0, Number(res.colspan) || 0)
        }
        if (spanRow > 0 && spanCol > 0) {
          const drawEnd = Math.min(selectedCell!.rowIndex + spanRow - 1, visibleRowEnd)
          highlightHeight = (drawEnd - selectedCell!.rowIndex + 1) * props.rowHeight
          // 计算跨列宽度
          let acc = 0
          for (let c = selectedColIndex; c < Math.min(selectedColIndex + spanCol, cols.length); c++) {
            acc += cols[c].width || 0
          }
          highlightWidth = acc
        }
      }

      // 重新创建高亮
      createHighlightRect(highlightX, highlightY, highlightWidth, highlightHeight, group)
    }
  }

  // 渲染完成后，用快照位置重新计算 hover，保证滚动、重绘后仍然可见
  if (pointerPosSnapshot && (props.enableRowHoverHighlight || props.enableColHoverHighlight)) {
    recomputeHoverIndexFromPointer(pointerPosSnapshot.y, pointerPosSnapshot.x)
  } else if (props.enableRowHoverHighlight || props.enableColHoverHighlight) {
    createOrUpdateHoverRects()
  }
}

/**
 * 基于当前指针位置重新计算 hoveredRowIndex 和 hoveredColIndex 并更新 hover 矩形
 * @param {number} localY 本地 Y 坐标
 * @param {number} localX 本地 X 坐标
 * @returns {void}
 */
const recomputeHoverIndexFromPointer = (localY?: number, localX?: number) => {
  if (!stage || (!props.enableRowHoverHighlight && !props.enableColHoverHighlight)) return
  if (filterDropdown.visible) return
  const pointerPos = stage.getPointerPosition()
  if (!pointerPos) {
    // 保持原有 hover，不做清空，等待下一次可用位置再更新
    return
  }

  // 计算行索引
  if (localY === undefined) {
    localY = pointerPos.y
  }
  const withinContent = localY >= props.headerHeight && localY <= stage.height() - props.scrollbarSize
  const newHoverRowIndex = withinContent
    ? (() => {
        const yInContent = localY! - props.headerHeight + scrollY
        const idx = Math.floor(yInContent / props.rowHeight)
        return idx >= 0 && idx < tableData.value.length ? idx : null
      })()
    : null

  // 计算列索引
  if (localX === undefined) {
    localX = pointerPos.x
  }
  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()
  const stageWidth = stage.width()
  const rightStartX = stageWidth - rightWidth - props.scrollbarSize

  let newHoverColIndex: number | null = null

  // 判断鼠标在哪个区域，计算全局列索引
  if (localX < leftWidth) {
    // 左侧固定列区域
    let currentX = 0
    for (let i = 0; i < leftCols.length; i++) {
      const colWidth = leftCols[i].width || 0
      if (localX >= currentX && localX < currentX + colWidth) {
        // 找到对应的全局列索引
        const globalColIndex = allColumns.value.findIndex((col) => col.columnName === leftCols[i].columnName)
        newHoverColIndex = globalColIndex >= 0 ? globalColIndex : null
        break
      }
      currentX += colWidth
    }
  } else if (localX >= rightStartX) {
    // 右侧固定列区域
    let currentX = rightStartX
    for (let i = 0; i < rightCols.length; i++) {
      const colWidth = rightCols[i].width || 0
      if (localX >= currentX && localX < currentX + colWidth) {
        // 找到对应的全局列索引
        const globalColIndex = allColumns.value.findIndex((col) => col.columnName === rightCols[i].columnName)
        newHoverColIndex = globalColIndex >= 0 ? globalColIndex : null
        break
      }
      currentX += colWidth
    }
  } else {
    // 中间滚动区域
    const centerX = localX - leftWidth + scrollX
    let currentX = 0
    for (let i = 0; i < centerCols.length; i++) {
      const colWidth = centerCols[i].width || 0
      if (centerX >= currentX && centerX < currentX + colWidth) {
        // 找到对应的全局列索引
        const globalColIndex = allColumns.value.findIndex((col) => col.columnName === centerCols[i].columnName)
        newHoverColIndex = globalColIndex >= 0 ? globalColIndex : null
        break
      }
      currentX += colWidth
    }
  }

  // 更新状态并重新渲染
  const rowChanged = newHoverRowIndex !== hoveredRowIndex
  const colChanged = newHoverColIndex !== hoveredColIndex

  if (rowChanged) {
    hoveredRowIndex = newHoverRowIndex
  }
  if (colChanged) {
    hoveredColIndex = newHoverColIndex
  }

  if (rowChanged || colChanged) {
    createOrUpdateHoverRects()
  }

  // 若仍无 hover（例如鼠标位于内容区域外），强制刷新一次矩形显隐，避免残留
  if (hoveredRowIndex === null && hoveredColIndex === null) {
    createOrUpdateHoverRects()
  }
}

/**
 * 创建或更新行和列的 hover 高亮矩形
 * @returns {Konva.Rect | null}
 */
const createOrUpdateHoverRects = () => {
  if (!stage || !leftBodyGroup || !centerBodyGroup || !rightBodyGroup) return
  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()

  // 更新行高亮矩形
  const updateRowRect = (
    rectRef: Konva.Rect | null,
    group: Konva.Group | null,
    totalWidth: number,
    name: string
  ): Konva.Rect | null => {
    if (!group) return null
    const y = hoveredRowIndex === null ? 0 : hoveredRowIndex * props.rowHeight
    const shouldShow =
      hoveredRowIndex !== null && hoveredRowIndex >= visibleRowStart && hoveredRowIndex <= visibleRowEnd
    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: 0,
        y,
        width: totalWidth,
        height: props.rowHeight,
        fill: props.hoverFill,
        listening: false,
        visible: shouldShow,
        name
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.y(y)
      rectRef.width(totalWidth)
      rectRef.height(props.rowHeight)
      rectRef.visible(shouldShow)
      rectRef.moveToTop()
    }
    return rectRef
  }

  /**
   * 更新列高亮矩形
   * @param rectRef 矩形引用
   * @param group 分组
   * @param colIndex 列索引
   * @param cols 列
   * @param name 名称
   * @returns {Konva.Rect | null}
   */
  const updateColRect = (
    rectRef: Konva.Rect | null,
    group: Konva.Group | null,
    colIndex: number,
    cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    name: string
  ): Konva.Rect | null => {
    if (!group || hoveredColIndex === null) return rectRef

    // 根据全局列索引找到对应的列
    const targetCol = allColumns.value[colIndex]
    if (!targetCol) {
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 检查目标列是否在当前组中
    const targetColIndex = cols.findIndex((col) => col.columnName === targetCol.columnName)
    if (targetColIndex === -1) {
      // 隐藏不在当前组的列高亮
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 计算列的位置和宽度；若使用 spanMethod 且当前 hover 行位于跨列区间，则扩展高亮到整个跨列宽度
    let colX = 0
    for (let i = 0; i < targetColIndex; i++) colX += cols[i].width || 0
    let colWidth = cols[targetColIndex].width || 0

    if (typeof props.spanMethod === 'function' && hoveredRowIndex !== null) {
      // 从当前列向左回溯，寻找该 hover 行上覆盖当前列的“起始列”
      let startIdx = targetColIndex
      for (let i = targetColIndex; i >= 0; i--) {
        const res = props.spanMethod({
          row: activeData.value[hoveredRowIndex!],
          column: cols[i],
          rowIndex: hoveredRowIndex!,
          colIndex: allColumns.value.findIndex((c) => c.columnName === cols[i].columnName)
        })
        let spanCol = 1
        if (Array.isArray(res)) spanCol = Math.max(0, Number(res[1]) || 0)
        else if (res && typeof res === 'object') spanCol = Math.max(0, Number(res.colspan) || 0)

        if (spanCol > 1) {
          const endIdx = Math.min(i + spanCol - 1, cols.length - 1)
          if (targetColIndex >= i && targetColIndex <= endIdx) {
            startIdx = i
            // 重新计算 x 与宽度
            colX = 0
            for (let k = 0; k < startIdx; k++) colX += cols[k].width || 0
            colWidth = 0
            for (let k = startIdx; k <= endIdx; k++) colWidth += cols[k].width || 0
            break
          }
        }
      }
    }

    const shouldShow = hoveredColIndex === colIndex
    // 列高亮应该覆盖整个可视区域，包括缓冲区域
    const visibleHeight = (visibleRowEnd - visibleRowStart + 1) * props.rowHeight
    const startY = visibleRowStart * props.rowHeight

    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: colX,
        y: startY,
        width: colWidth,
        height: visibleHeight,
        fill: props.hoverFill,
        listening: false,
        visible: shouldShow,
        name
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.x(colX)
      rectRef.y(startY)
      rectRef.width(colWidth)
      rectRef.height(visibleHeight)
      rectRef.visible(shouldShow)
      rectRef.moveToTop()
    }
    return rectRef
  }

  /**
   * 计算列宽总和
   * @param cols 列
   * @returns {number}
   */
  const leftTotal = leftCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const centerTotal = centerCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const rightTotal = rightCols.reduce((acc, c) => acc + (c.width || 0), 0)

  /**
   * 先更新列高亮，再更新行高亮，让行高亮覆盖列高亮，避免交叉处叠色
   */
  if (hoveredColIndex !== null && props.enableColHoverHighlight) {
    leftColHoverRect = updateColRect(leftColHoverRect, leftBodyGroup, hoveredColIndex, leftCols, 'hoverColRect-left')
    centerColHoverRect = updateColRect(
      centerColHoverRect,
      centerBodyGroup,
      hoveredColIndex,
      centerCols,
      'hoverColRect-center'
    )
    rightColHoverRect = updateColRect(
      rightColHoverRect,
      rightBodyGroup,
      hoveredColIndex,
      rightCols,
      'hoverColRect-right'
    )
  } else {
    // 隐藏所有列高亮
    if (leftColHoverRect) leftColHoverRect.visible(false)
    if (centerColHoverRect) centerColHoverRect.visible(false)
    if (rightColHoverRect) rightColHoverRect.visible(false)
  }

  /**
   * 更新行高亮（后绘制，覆盖列高亮，保证交叉处只渲染一次）
   */
  if (props.enableRowHoverHighlight) {
    leftHoverRect = updateRowRect(leftHoverRect, leftBodyGroup, leftTotal, 'hoverRect-left')
    centerHoverRect = updateRowRect(centerHoverRect, centerBodyGroup, centerTotal, 'hoverRect-center')
    rightHoverRect = updateRowRect(rightHoverRect, rightBodyGroup, rightTotal, 'hoverRect-right')
  } else {
    if (leftHoverRect) leftHoverRect.visible(false)
    if (centerHoverRect) centerHoverRect.visible(false)
    if (rightHoverRect) rightHoverRect.visible(false)
  }

  /**
   * 更新表头列高亮
   */
  const updateHeaderColRect = (
    rectRef: Konva.Rect | null,
    group: Konva.Group | null,
    colIndex: number,
    cols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    name: string
  ): Konva.Rect | null => {
    if (!group || hoveredColIndex === null) return rectRef

    // 根据全局列索引找到对应的列
    const targetCol = allColumns.value[colIndex]
    if (!targetCol) {
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 检查目标列是否在当前组中
    const targetColIndex = cols.findIndex((col) => col.columnName === targetCol.columnName)
    if (targetColIndex === -1) {
      // 隐藏不在当前组的列高亮
      if (rectRef) {
        rectRef.visible(false)
      }
      return rectRef
    }

    // 计算列的位置和宽度
    let colX = 0
    let colWidth = 0
    for (let i = 0; i < cols.length; i++) {
      if (i === targetColIndex) {
        colWidth = cols[i].width || 0
        break
      }
      colX += cols[i].width || 0
    }

    const shouldShow = hoveredColIndex === colIndex

    if (!rectRef) {
      rectRef = new Konva.Rect({
        x: colX,
        y: 0,
        width: colWidth,
        height: props.headerHeight,
        fill: props.hoverFill,
        listening: false,
        visible: shouldShow,
        name
      })
      group.add(rectRef)
      rectRef.moveToTop()
    } else {
      rectRef.x(colX)
      rectRef.y(0)
      rectRef.width(colWidth)
      rectRef.height(props.headerHeight)
      rectRef.visible(shouldShow)
      rectRef.moveToTop()
    }
    return rectRef
  }

  /**
   * 更新表头列高亮
   */
  if (hoveredColIndex !== null && props.enableColHoverHighlight) {
    // 先隐藏所有表头列高亮
    if (headerHoverRect) headerHoverRect.visible(false)
    if (centerHeaderHoverRect) centerHeaderHoverRect.visible(false)
    if (rightHeaderHoverRect) rightHeaderHoverRect.visible(false)

    // 然后只显示当前悬停列的高亮
    headerHoverRect = updateHeaderColRect(
      headerHoverRect,
      leftHeaderGroup,
      hoveredColIndex,
      leftCols,
      'hoverHeaderRect-left'
    )
    centerHeaderHoverRect = updateHeaderColRect(
      centerHeaderHoverRect,
      centerHeaderGroup,
      hoveredColIndex,
      centerCols,
      'hoverHeaderRect-center'
    )
    rightHeaderHoverRect = updateHeaderColRect(
      rightHeaderHoverRect,
      rightHeaderGroup,
      hoveredColIndex,
      rightCols,
      'hoverHeaderRect-right'
    )
  } else {
    // 隐藏所有表头列高亮
    if (headerHoverRect) headerHoverRect.visible(false)
    if (centerHeaderHoverRect) centerHeaderHoverRect.visible(false)
    if (rightHeaderHoverRect) rightHeaderHoverRect.visible(false)
  }

  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  headerLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
}

/**
 * 更新垂直滚动
 * @param offsetY 滚动偏移量
 */
const updateVerticalScroll = (offsetY: number) => {
  if (!stage || !leftBodyGroup || !centerBodyGroup || !rightBodyGroup) return
  const { maxScrollY } = getScrollLimits()
  const oldScrollY = scrollY
  scrollY = clamp(scrollY + offsetY, 0, maxScrollY)

  // 检查是否需要重新渲染（滚动超过一定阈值或可视区域改变）
  const oldVisibleStart = visibleRowStart
  const oldVisibleEnd = visibleRowEnd
  calculateVisibleRows()

  const needsRerender =
    visibleRowStart !== oldVisibleStart ||
    visibleRowEnd !== oldVisibleEnd ||
    Math.abs(scrollY - oldScrollY) > props.rowHeight * 2 // 滚动超过2行时强制重新渲染

  if (needsRerender) {
    // 重新渲染可视区域
    const { leftCols, centerCols, rightCols } = getSplitColumns()
    drawBodyPart(leftBodyGroup, leftCols, leftBodyPools)
    drawBodyPart(centerBodyGroup, centerCols, centerBodyPools)
    drawBodyPart(rightBodyGroup, rightCols, rightBodyPools)
  }

  const bodyY = props.headerHeight - scrollY
  const centerY = -scrollY

  // Only body content moves vertically, headers stay fixed
  leftBodyGroup.y(bodyY)
  rightBodyGroup.y(bodyY)
  centerBodyGroup.y(centerY)

  updateScrollbars()

  // 更新列高亮矩形位置（因为可视区域可能改变了）
  if (hoveredColIndex !== null && props.enableColHoverHighlight) {
    createOrUpdateHoverRects()
  }

  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()

  // 垂直滚动时同步 hover 矩形位置/显示：优先使用最近的指针坐标
  if (props.enableRowHoverHighlight || props.enableColHoverHighlight) {
    const p = stage.getPointerPosition()
    recomputeHoverIndexFromPointer(p?.y, p?.x)
  }
}

/**
 * 更新水平滚动
 * @param offsetX 滚动偏移量
 */
const updateHorizontalScroll = (offsetX: number) => {
  if (!stage || !centerHeaderGroup || !centerBodyGroup) return
  const { maxScrollX } = getScrollLimits()
  const { leftWidth } = getSplitColumns()
  scrollX = clamp(scrollX + offsetX, 0, maxScrollX)

  const headerX = leftWidth - scrollX
  const centerX = -scrollX

  // Only center scrollable content moves horizontally
  centerHeaderGroup.x(headerX)
  centerBodyGroup.x(centerX)

  updateScrollbars()

  // 更新列高亮矩形位置（因为可视区域可能改变了）
  if (hoveredColIndex !== null && props.enableColHoverHighlight) {
    createOrUpdateHoverRects()
  }

  headerLayer?.batchDraw()
  bodyLayer?.batchDraw()

  // 横向滚动时也保持 hover 矩形可见（宽度不变，仅 redraw）
  if (props.enableRowHoverHighlight || props.enableColHoverHighlight) {
    const p2 = stage.getPointerPosition()
    recomputeHoverIndexFromPointer(p2?.y, p2?.x)
  }
}

/**
 * 更新滚动条
 */
const updateScrollbars = () => {
  if (!stage) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // Update vertical thumb position
  if (verticalScrollbarThumb && maxScrollY > 0) {
    const thumbHeight = Math.max(
      20,
      ((stageHeight - props.headerHeight - props.scrollbarSize) *
        (stageHeight - props.headerHeight - props.scrollbarSize)) /
        (tableData.value.length * props.rowHeight)
    )
    const thumbY =
      props.headerHeight +
      (scrollY / maxScrollY) * (stageHeight - props.headerHeight - props.scrollbarSize - thumbHeight)
    verticalScrollbarThumb.y(thumbY)
  }

  // Update horizontal thumb position
  if (horizontalScrollbarThumb && maxScrollX > 0) {
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)
    horizontalScrollbarThumb.x(thumbX)
  }

  scrollbarLayer?.batchDraw()
}

/**
 * 处理滚轮事件
 * @param e 滚轮事件
 */
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  // 设置指针位置到 stage，避免 Konva 警告
  if (stage) {
    stage.setPointersPositions(e)
  }

  const hasDeltaX = Math.abs(e.deltaX) > 0
  const hasDeltaY = Math.abs(e.deltaY) > 0
  // 兼容 Shift + 滚轮用于横向滚动（常见于鼠标）
  if (e.shiftKey && !hasDeltaX && hasDeltaY) {
    updateHorizontalScroll(e.deltaY)
    return
  }
  // 触控板或支持横向滚轮的鼠标
  if (hasDeltaX) updateHorizontalScroll(e.deltaX)
  if (hasDeltaY) updateVerticalScroll(e.deltaY)
}

/**
 * 处理鼠标移动事件
 * @param e 鼠标移动事件
 */
const handleMouseMove = (e: MouseEvent) => {
  if (!stage) return
  if (filterDropdown.visible) return

  // 列宽拖拽中：实时更新覆盖宽度并重建分组
  if (isResizingColumn && resizingColumnName) {
    const delta = e.clientX - resizeStartX
    const newWidth = Math.max(props.minAutoColWidth, resizeStartWidth + delta)
    columnWidthOverrides[resizingColumnName] = newWidth
    if (resizeNeighborColumnName) {
      const neighborWidth = Math.max(props.minAutoColWidth, resizeNeighborStartWidth - delta)
      columnWidthOverrides[resizeNeighborColumnName] = neighborWidth
    }
    clearGroups()
    rebuildGroups()
    return
  }

  // 设置指针位置到 stage，避免 Konva 警告
  stage.setPointersPositions(e)

  if (isDraggingVThumb) {
    const deltaY = e.clientY - dragStartY
    // 添加容错机制：只有当垂直移动距离超过阈值时才触发滚动
    const threshold = props.scrollThreshold
    if (Math.abs(deltaY) < threshold) return

    const { maxScrollY } = getScrollLimits()
    const stageHeight = stage.height()
    const trackHeight = stageHeight - props.headerHeight - props.scrollbarSize
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.rowHeight))
    const scrollRatio = deltaY / (trackHeight - thumbHeight)
    const newScrollY = dragStartScrollY + scrollRatio * maxScrollY

    const oldScrollY = scrollY
    scrollY = clamp(newScrollY, 0, maxScrollY)

    // 检查是否需要重新渲染虚拟滚动内容
    const oldVisibleStart = visibleRowStart
    const oldVisibleEnd = visibleRowEnd
    calculateVisibleRows()

    const needsRerender =
      visibleRowStart !== oldVisibleStart ||
      visibleRowEnd !== oldVisibleEnd ||
      Math.abs(scrollY - oldScrollY) > props.rowHeight * 2

    if (needsRerender) {
      // 重新渲染可视区域
      const { leftCols, centerCols, rightCols } = getSplitColumns()
      drawBodyPart(leftBodyGroup, leftCols, leftBodyPools)
      drawBodyPart(centerBodyGroup, centerCols, centerBodyPools)
      drawBodyPart(rightBodyGroup, rightCols, rightBodyPools)
    }

    updateScrollPositions()
  }

  if (isDraggingHThumb) {
    const deltaX = e.clientX - dragStartX
    // 添加容错机制：只有当水平移动距离超过阈值时才触发滚动
    const threshold = props.scrollThreshold
    if (Math.abs(deltaX) < threshold) return

    const { maxScrollX } = getScrollLimits()
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const stageWidth = stage.width()
    const visibleWidth = stageWidth - leftWidth - rightWidth - props.scrollbarSize
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const scrollRatio = deltaX / (visibleWidth - thumbWidth)
    const newScrollX = dragStartScrollX + scrollRatio * maxScrollX

    scrollX = clamp(newScrollX, 0, maxScrollX)
    updateScrollPositions()
  }

  // 普通移动时，更新 hoveredRowIndex 和 hoveredColIndex，并同步 hover 矩形
  if (
    !isDraggingVThumb &&
    !isDraggingHThumb &&
    stage &&
    (props.enableRowHoverHighlight || props.enableColHoverHighlight)
  ) {
    const pointerPos = stage.getPointerPosition()
    if (pointerPos) {
      recomputeHoverIndexFromPointer()
    }
  }
}

/**
 * 处理鼠标抬起事件
 */
const handleMouseUp = () => {
  if (isDraggingVThumb || isDraggingHThumb) {
    isDraggingVThumb = false
    isDraggingHThumb = false
    if (stage) stage.container().style.cursor = 'default'

    if (verticalScrollbarThumb && !isDraggingVThumb) verticalScrollbarThumb.fill(props.scrollbarThumb)
    if (horizontalScrollbarThumb && !isDraggingHThumb) horizontalScrollbarThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  }

  // 列宽拖拽结束
  if (isResizingColumn) {
    isResizingColumn = false
    resizingColumnName = null
    resizeNeighborColumnName = null
    if (stage) stage.container().style.cursor = 'default'
  }
}

/**
 * 更新滚动位置
 * @returns {void}
 */
const updateScrollPositions = () => {
  if (!leftBodyGroup || !centerBodyGroup || !rightBodyGroup || !centerHeaderGroup) return

  const { leftWidth } = getSplitColumns()
  const bodyY = props.headerHeight - scrollY
  const centerX = -scrollX
  const headerX = leftWidth - scrollX

  /**
   * 更新左侧和右侧主体（只有 Y 位置变化）
   */
  leftBodyGroup.y(bodyY)
  rightBodyGroup.y(bodyY)

  /**
   * 更新中间主体（X 和 Y 位置变化）
   */
  centerBodyGroup.x(centerX)
  centerBodyGroup.y(-scrollY)

  /**
   * 更新中心表头（只有 X 位置变化）
   */
  centerHeaderGroup.x(headerX)

  /**
   * 固定表头（leftHeaderGroup 和 rightHeaderGroup）从不移动 - 它们保持在 (0,0) 并固定在右侧位置
   */

  updateScrollbars()
  headerLayer?.batchDraw()
  bodyLayer?.batchDraw()
  fixedLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
}

/**
 * 处理窗口大小改变
 * @returns {void}
 */
const handleResize = () => {
  initStage()
  calculateVisibleRows()
  clearGroups()
  rebuildGroups()
  setTimeout(() => createFixedColumnShadow(), 0)
}

/**
 * 从 props 初始化 初始化表格
 * @param {boolean} resetScroll 是否重置滚动状态
 * @returns {void}
 */
const refreshTable = (resetScroll: boolean) => {
  /**
   * 重置滚动状态
   */
  if (resetScroll) {
    scrollX = 0
    scrollY = 0
  } else {
    /**
     * 在不重置时，保证滚动值在新范围内
     */
    const { maxScrollX, maxScrollY } = getScrollLimits()
    scrollX = clamp(scrollX, 0, maxScrollX)
    scrollY = clamp(scrollY, 0, maxScrollY)
  }

  /**
   * 初始化虚拟滚动状态
   */
  calculateVisibleRows()
  clearGroups()
  rebuildGroups()

  /**
   * 创建固定列阴影
   */
  setTimeout(() => createFixedColumnShadow(), 0)
}

/**
 * 挂载
 * @returns {void}
 */
onMounted(() => {
  window.addEventListener('mousedown', onGlobalMousedown, true)
  initStage()
  refreshTable(true)

  const tableContainer = getContainerEl()
  tableContainer?.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)

  // 添加全局鼠标事件监听器来确保 Konva 指针位置始终正确
  if (stage) {
    const container = stage.container()
    // 创建事件处理函数引用，以便后续可以移除
    const updatePointerPositions = (e: MouseEvent) => {
      if (stage) {
        stage.setPointersPositions(e)
      }
    }

    container.addEventListener('mousemove', updatePointerPositions)
    container.addEventListener('mousedown', updatePointerPositions)
    container.addEventListener('mouseup', updatePointerPositions)
    container.addEventListener('mouseenter', updatePointerPositions)
    container.addEventListener('mouseleave', updatePointerPositions)

    // 存储处理器引用，卸载时移除
    containerPointerPositionHandler = updatePointerPositions
  }
})

/**
 * 监听 props 变化
 */
watch(
  () => [props.xAxisFields, props.yAxisFields, props.data],
  () => {
    if (!stage) return
    refreshTable(true)
  },
  { deep: true }
)

watch(
  () => [
    props.chartWidth,
    props.chartHeight,
    props.headerHeight,
    props.rowHeight,
    props.scrollbarSize,
    props.tablePadding,
    props.headerBg,
    props.bodyBgOdd,
    props.bodyBgEven,
    props.borderColor,
    props.headerTextColor,
    props.bodyTextColor,
    props.scrollbarBg,
    props.scrollbarThumb,
    props.scrollbarThumbHover,
    props.bufferRows,
    props.hoverFill
  ],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 卸载
 */
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onGlobalMousedown, true)
  const tableContainer = getContainerEl()
  tableContainer?.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)

  // 移除 stage 容器的事件监听器
  if (stage) {
    const container = stage.container()
    const pointerHandler = containerPointerPositionHandler
    if (pointerHandler) {
      container.removeEventListener('mousemove', pointerHandler)
      container.removeEventListener('mousedown', pointerHandler)
      container.removeEventListener('mouseup', pointerHandler)
      container.removeEventListener('mouseenter', pointerHandler)
      container.removeEventListener('mouseleave', pointerHandler)
    }
    containerPointerPositionHandler = null
  }

  stage?.destroy()
  stage = null
  headerLayer = null
  bodyLayer = null
  fixedLayer = null
  fixedHeaderLayer = null
  scrollbarLayer = null
  centerBodyClipGroup = null
  selectedCell = null
  highlightRect = null
})
</script>

<style lang="scss" scoped>
.container-table {
  width: 100%;
  position: relative;
}

.dms-filter-dropdown {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  padding: 8px;
  border-radius: 4px;
}
</style>
