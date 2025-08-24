<template>
  <div id="table-container" class="table-container" :style="tableContainerStyle"></div>

  <!-- 过滤器下拉（多选） -->
  <teleport to="body">
    <div
      ref="filterDropdownRef"
      v-show="filterDropdown.visible"
      class="dms-filter-dropdown"
      :style="filterDropdownStyle"
    >
      <el-select
        v-model="filterDropdown.selectedValues"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        size="small"
        placeholder="选择过滤值"
        style="width: 160px"
        @change="handleSelectedFilter"
        @blur="closeFilterDropdown"
        @keydown.stop
      >
        <el-option v-for="opt in filterDropdown.options" :key="opt" :label="opt === '' ? '(空)' : opt" :value="opt" />
      </el-select>
    </div>
  </teleport>
  <!-- 汇总行下拉（单选） -->
  <teleport to="body">
    <div
      ref="summaryDropdownRef"
      v-show="summaryDropdown.visible"
      class="dms-summary-dropdown"
      :style="summaryDropdownStyle"
    >
      <el-select
        v-model="summaryDropdown.selectedValue"
        size="small"
        placeholder="选择汇总"
        style="width: 160px"
        @change="handleSelectedSummary"
        @blur="closeSummaryDropdown"
        @keydown.stop
      >
        <el-option v-for="opt in summaryDropdown.options" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { chartProps } from './props'
/**
 * 获取容器元素
 * @returns {HTMLDivElement | null} 容器元素
 */
const getTableContainerElement = (): HTMLDivElement | null => {
  return document.getElementById('table-container') as HTMLDivElement | null
}

const props = defineProps(chartProps)
const { $webworker } = useNuxtApp()
/**
 * 获取有效的汇总高度（受开关控制）
 * @returns {number}
 */
const getSummaryRowHeight = () => (props.enableSummary ? props.summaryHeight : 0)

/**
 * 定义事件
 */
const emits = defineEmits<{
  'cell-click': [{ rowIndex: number; colIndex: number; colKey: string; rowData: ChartDataVo.ChartData }]
  'action-click': [{ rowIndex: number; action: string; rowData: ChartDataVo.ChartData }]
  'render-chart-start': []
  'render-chart-end': []
}>()

/**
 * 所有列
 * @returns {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>}
 */
const tableColumns = computed(
  () => props.xAxisFields.concat(props.yAxisFields) as Array<GroupStore.GroupOption | DimensionStore.DimensionOption>
)

/**
 * @returns {Record<string, string>}
 */
const columnAliasMap = computed(() => {
  const map: Record<string, string> = {}
  tableColumns.value.forEach((c: GroupStore.GroupOption | DimensionStore.DimensionOption) => {
    if (c && typeof c === 'object') {
      const columnName = c.columnName
      const displayName = c.displayName as string | undefined
      if (columnName && displayName && displayName !== columnName) {
        map[columnName] = displayName
      }
    }
  })
  return map
})

/**
 * 表格数据
 * @returns {ChartDataVo.ChartData}
 */
const tableData = computed<Array<ChartDataVo.ChartData>>(() => props.data)

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
 * 汇总行选择状态：列名 -> 选中的规则
 */
const summaryState = reactive<Record<string, string>>({})

/**
 * 应用排序后的数据视图
 * @returns {ChartDataVo.ChartData}
 */
const activeData = computed<Array<ChartDataVo.ChartData>>(() => {
  // 先按 filter 过滤
  let base = tableData.value.filter((row) => row && typeof row === 'object') // 过滤掉无效的行
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
  const toNum = (v: string | number | null | undefined) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  const aliasMap2 = columnAliasMap.value

  const getVal = (row: ChartDataVo.ChartData, key: string): string | number | undefined => {
    const alias = aliasMap2[key]
    const candidates: unknown[] = [row[key], alias ? row[alias] : undefined]
    for (const v of candidates) {
      if (typeof v === 'string' || typeof v === 'number') return v
    }
    return undefined
  }
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
 * 滚动条层（滚动条）
 */
let scrollbarLayer: Konva.Layer | null = null

/**
 * 中间区域剪辑组（中间区域）
 */
let centerBodyClipGroup: Konva.Group | null = null

/**
 * 表头层（固定表头）
 */
let headerLayer: Konva.Layer | null = null

/**
 * 表格层（主体）
 */
let bodyLayer: Konva.Layer | null = null

/**
 * 汇总层（汇总）
 */
let summaryLayer: Konva.Layer | null = null

/**
 * 固定表头层（固定表头）
 */
let fixedHeaderLayer: Konva.Layer | null = null

/**
 * 固定表body层（固定表body）
 */
let fixedBodyLayer: Konva.Layer | null = null

/**
 * 固定汇总层（固定汇总）
 */
let fixedSummaryLayer: Konva.Layer | null = null

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
 * 左侧汇总组（左侧汇总）
 */
let leftSummaryGroup: Konva.Group | null = null

/**
 * 中间汇总组（中间汇总）
 */
let centerSummaryGroup: Konva.Group | null = null

/**
 * 右侧汇总组（右侧汇总）
 */
let rightSummaryGroup: Konva.Group | null = null

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

/**
 * 列宽拖拽状态
 */
let isResizingColumn = false

/**
 * 列宽拖拽列名
 */
let resizingColumnName: string | null = null
let resizeStartX = 0
let resizeStartWidth = 0

/**
 * 列宽拖拽邻居列名
 */
let resizeNeighborColumnName: string | null = null
let resizeNeighborStartWidth = 0

/**
 * 是否正在垂直拖动滚动条
 */
let isDraggingVerticalThumb = false
/**
 * 是否正在水平拖动滚动条
 */
let isDraggingHorizontalThumb = false
/**
 * 垂直滚动条拖拽起始 Y 坐标
 */
let dragStartY = 0
/**
 * 水平滚动条拖拽起始 X 坐标
 */
let dragStartX = 0
/**
 * 垂直滚动条拖拽起始滚动位置 Y
 */
let dragStartScrollY = 0
/**
 * 水平滚动条拖拽起始滚动位置 X
 */
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
 * 可视区域起始行索引
 */
let visibleRowStart = 0

/**
 * 可视区域结束行索引
 */
let visibleRowEnd = 0

/**
 * 上下缓冲行数
 */
let visibleRowCount = 0

/**
 * 需要高亮的行索引
 */
let hoveredRowIndex: number | null = null
/**
 * 需要高亮的列索引
 */
let hoveredColIndex: number | null = null
/**
 * 最近一次指针的屏幕坐标（用于判断表格上是否存在遮罩层）
 */

let lastClientX = 0
let lastClientY = 0

/**
 * 判断当前指针位置的顶层元素是否属于表格容器
 * 若不属于，则认为表格被其它遮罩/弹层覆盖，此时不进行高亮
 * @param {number} clientX 鼠标点击位置的 X 坐标
 * @param {number} clientY 鼠标点击位置的 Y 坐标
 * @returns {boolean} 是否在表格容器内
 */
const isTopMostInTable = (clientX: number, clientY: number): boolean => {
  const container = getTableContainerElement()
  if (!container) return false
  const topEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  if (!topEl) return false
  if (!container.contains(topEl)) return false
  // 仅当命中的元素为 Konva 的 canvas（或其包裹层）时，认为没有被遮罩覆盖
  if (topEl.tagName === 'CANVAS') return true
  const konvaContent = topEl.closest('.konvajs-content') as HTMLElement | null
  if (konvaContent && container.contains(konvaContent)) return true
  // 命中的虽然在容器内，但不是 Konva 画布，视为被遮罩覆盖
  return false
}

/**
 * 判断坐标是否在表格区域内（排除滚动条区域）
 * @param clientX 客户端X坐标
 * @param clientY 客户端Y坐标
 * @returns 是否在表格区域内
 */
const isInTableArea = (clientX: number, clientY: number) => {
  if (!stage) return false

  // 转换为 stage 坐标
  const pointerPosition = stage.getPointerPosition()
  if (!pointerPosition) return false

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // 计算表格有效区域（排除滚动条）
  const effectiveWidth = maxScrollY > 0 ? stageWidth - props.scrollbarSize : stageWidth
  const effectiveHeight = maxScrollX > 0 ? stageHeight - props.scrollbarSize : stageHeight

  return (
    pointerPosition.x >= 0 &&
    pointerPosition.x < effectiveWidth &&
    pointerPosition.y >= 0 &&
    pointerPosition.y < effectiveHeight
  )
}

const numberOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '最大', value: 'max' },
  { label: '最小', value: 'min' },
  { label: '平均', value: 'avg' },
  { label: '求和', value: 'sum' }
]
const textOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '已填写', value: 'filled' },
  { label: '未填写', value: 'nofilled' }
]

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
 * 容器样式
 */
const tableContainerStyle = computed(() => {
  const height = typeof props.chartHeight === 'number' ? `${props.chartHeight}px` : (props.chartHeight ?? '460px')
  const width = typeof props.chartWidth === 'number' ? `${props.chartWidth}px` : (props.chartWidth ?? '100%')
  return {
    height,
    width,
    background: '#fff'
  }
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
  selectedValues: [] as string[],
  // 存储原始点击位置，用于滚动时重新计算
  originalClientX: 0,
  originalClientY: 0
})

// 汇总行下拉状态（DOM）
const summaryDropdown = reactive({
  visible: false,
  x: 0,
  y: 0,
  colName: '' as string,
  options: [] as Array<{ label: string; value: string }>,
  selectedValue: '' as string,
  // 存储原始点击位置，用于滚动时重新计算
  originalClientX: 0,
  originalClientY: 0
})

/**
 * 过滤下拉浮层元素
 */
const filterDropdownRef = ref<HTMLDivElement | null>(null)
/**
 * 汇总下拉浮层元素
 */
const summaryDropdownRef = ref<HTMLDivElement | null>(null)

/**
 * 滚动事件处理函数
 */
const handleScroll = () => {
  // 如果过滤下拉框可见，重新计算位置
  if (filterDropdown.visible && filterDropdownRef.value) {
    const filterDropdownElRect = filterDropdownRef.value.getBoundingClientRect()
    const filterDropdownElHeight = Math.ceil(filterDropdownElRect.height)
    const filterDropdownElWidth = Math.ceil(filterDropdownElRect.width)

    // 获取当前滚动偏移量
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    // 将保存的页面坐标转换为当前的视口坐标
    const currentClientX = filterDropdown.originalClientX - scrollX
    const currentClientY = filterDropdown.originalClientY - scrollY

    const { dropdownX, dropdownY } = getWapperPosition(
      currentClientX,
      currentClientY,
      filterDropdownElWidth,
      filterDropdownElHeight
    )
    filterDropdown.x = dropdownX
    filterDropdown.y = dropdownY
  }

  // 如果汇总下拉框可见，重新计算位置
  if (summaryDropdown.visible && summaryDropdownRef.value) {
    const summaryDropdownElRect = summaryDropdownRef.value.getBoundingClientRect()
    const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
    const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)

    // 获取当前滚动偏移量
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop

    // 将保存的页面坐标转换为当前的视口坐标
    const currentClientX = summaryDropdown.originalClientX - scrollX
    const currentClientY = summaryDropdown.originalClientY - scrollY

    const { dropdownX, dropdownY } = getWapperPosition(
      currentClientX,
      currentClientY,
      summaryDropdownElWidth,
      summaryDropdownElHeight
    )
    console.log('summaryDropdown.originalClientX', summaryDropdown.originalClientX)
    console.log('summaryDropdown.originalClientY', summaryDropdown.originalClientY)
    console.log('scrollX', scrollX, 'scrollY', scrollY)
    summaryDropdown.x = dropdownX
    summaryDropdown.y = dropdownY
  }
}

/**
 * 更新下拉弹框位置（用于表格内部滚动）
 */
const updateDropdownPositions = () => {
  // 如果过滤下拉框可见，重新计算位置
  if (filterDropdown.visible && filterDropdownRef.value) {
    const filterDropdownElRect = filterDropdownRef.value.getBoundingClientRect()
    const filterDropdownElHeight = Math.ceil(filterDropdownElRect.height)
    const filterDropdownElWidth = Math.ceil(filterDropdownElRect.width)

    // 对于表格内部滚动，使用保存的原始客户端坐标
    const { dropdownX, dropdownY } = getWapperPosition(
      filterDropdown.originalClientX,
      filterDropdown.originalClientY,
      filterDropdownElWidth,
      filterDropdownElHeight
    )
    filterDropdown.x = dropdownX
    filterDropdown.y = dropdownY
  }

  // 如果汇总下拉框可见，重新计算位置
  if (summaryDropdown.visible && summaryDropdownRef.value) {
    const summaryDropdownElRect = summaryDropdownRef.value.getBoundingClientRect()
    const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
    const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)

    // 对于表格内部滚动，使用保存的原始客户端坐标
    const { dropdownX, dropdownY } = getWapperPosition(
      summaryDropdown.originalClientX,
      summaryDropdown.originalClientY,
      summaryDropdownElWidth,
      summaryDropdownElHeight
    )
    summaryDropdown.x = dropdownX
    summaryDropdown.y = dropdownY
  }
}

/**
 * 过滤下拉浮层样式
 */
const filterDropdownStyle = computed(() => {
  return {
    position: 'fixed' as const,
    left: filterDropdown.x + 'px',
    top: filterDropdown.y + 'px',
    zIndex: 3000
  }
})
/**
 * 汇总下拉浮层样式
 */
const summaryDropdownStyle = computed(() => {
  return {
    position: 'fixed' as const,
    left: summaryDropdown.x + 'px',
    top: summaryDropdown.y + 'px',
    zIndex: 3000
  }
})
/**
 * 获取下拉框的弹出位置
 * @param {number} clientX
 * @param {number} clientY
 * @param {number} wapperWidth
 * @param {number} wapperHeight
 * @returns {dropdownX:number,dropdownY:number}
 */
const getWapperPosition = (clientX: number, clientY: number, wapperWidth: number, wapperHeight: number) => {
  // 获取视口高度
  const viewportHeight = window.innerHeight
  // 获取视口宽度
  const viewportWidth = window.innerWidth

  // 计算各方向剩余空间
  const spaceBelow = viewportHeight - clientY
  const spaceAbove = clientY
  const spaceRight = viewportWidth - clientX
  const spaceLeft = clientX

  // 垂直位置计算
  let dropdownY = clientY
  if (spaceBelow >= wapperHeight) {
    // 下方空间充足，显示在点击位置下方
    dropdownY = clientY + 5
  } else if (spaceAbove >= wapperHeight) {
    // 下方空间不足但上方空间充足，显示在点击位置上方
    dropdownY = clientY - wapperHeight - 5
  } else {
    // 上下空间都不足，优先选择空间较大的一方
    if (spaceBelow >= spaceAbove) {
      dropdownY = clientY + 5
    } else {
      dropdownY = clientY - wapperHeight - 5
    }
    // 确保不超出边界
    dropdownY = Math.max(5, Math.min(dropdownY, viewportHeight - wapperHeight - 5))
  }

  // 水平位置计算
  let dropdownX = clientX
  if (spaceRight >= wapperWidth) {
    // 右侧空间充足，显示在点击位置右侧
    dropdownX = clientX + 5
  } else if (spaceLeft >= wapperWidth) {
    // 右侧空间不足但左侧空间充足，显示在点击位置左侧
    dropdownX = clientX - wapperWidth - 5
  } else {
    // 左右空间都不足，优先选择空间较大的一方
    if (spaceRight >= spaceLeft) {
      dropdownX = clientX + 5
    } else {
      dropdownX = clientX - wapperWidth - 5
    }
    // 确保不超出边界
    dropdownX = Math.max(5, Math.min(dropdownX, viewportWidth - wapperWidth - 5))
  }
  return {
    dropdownX,
    dropdownY
  }
}

/**
 * 打开过滤下拉浮层
 * @param {number} clientX 鼠标点击位置的 X 坐标
 * @param {number} clientY 鼠标点击位置的 Y 坐标
 * @param {string} colName 列名
 * @param {Array<string>} options 选项列表
 * @param {Array<string>} selected 已选中的选项
 */
const openFilterDropdown = (
  evt: KonvaEventObject<MouseEvent, Konva.Shape | Konva.Circle>,
  colName: string,
  options: string[],
  selected: string[]
) => {
  // 存储原始点击位置（转换为页面坐标，考虑滚动偏移）
  const { clientX, clientY } = evt.evt
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop
  filterDropdown.originalClientX = clientX + scrollX
  filterDropdown.originalClientY = clientY + scrollY

  filterDropdown.visible = true
  nextTick(() => {
    if (!filterDropdownRef.value) return
    const filterDropdownEl = filterDropdownRef.value
    if (!filterDropdownEl) return
    const filterDropdownElRect = filterDropdownEl.getBoundingClientRect()
    const filterDropdownElHeight = Math.ceil(filterDropdownElRect.height)
    const filterDropdownElWidth = Math.ceil(filterDropdownElRect.width)
    const { dropdownX, dropdownY } = getWapperPosition(clientX, clientY, filterDropdownElWidth, filterDropdownElHeight)
    filterDropdown.x = dropdownX
    filterDropdown.y = dropdownY
    filterDropdown.colName = colName
    filterDropdown.options = options
    filterDropdown.selectedValues = [...selected]
    // 打开下拉时取消 hover 高亮，避免视觉干扰
    hoveredRowIndex = null
    hoveredColIndex = null
    updateHoverRects()
  })
}

/**
 * 关闭过滤下拉浮层
 * @returns {void}
 */
const closeFilterDropdown = () => {
  filterDropdown.visible = false
}

/**
 * 打开汇总下拉
 * @param {number} clientX 鼠标点击位置的 X 坐标
 * @param {number} clientY 鼠标点击位置的 Y 坐标
 * @param {string} colName 列名
 * @param {Array<{ label: string; value: string }>} options 选项列表
 * @param {string} selected 已选中的选项
 */
const openSummaryDropdown = (
  evt: KonvaEventObject<MouseEvent, Konva.Rect>,
  colName: string,
  options: Array<{ label: string; value: string }>,
  selected?: string
) => {
  // 存储原始点击位置（转换为页面坐标，考虑滚动偏移）
  const { clientX, clientY } = evt.evt
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop
  summaryDropdown.originalClientX = clientX + scrollX
  summaryDropdown.originalClientY = clientY + scrollY

  summaryDropdown.visible = true
  if (!summaryDropdownRef.value) return
  const summaryDropdownEl = summaryDropdownRef.value
  if (!summaryDropdownEl) return
  nextTick(() => {
    const summaryDropdownElRect = summaryDropdownEl.getBoundingClientRect()
    const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
    const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)
    const { dropdownX, dropdownY } = getWapperPosition(
      clientX,
      clientY,
      summaryDropdownElWidth,
      summaryDropdownElHeight
    )
    summaryDropdown.x = dropdownX
    summaryDropdown.y = dropdownY
    summaryDropdown.colName = colName
    summaryDropdown.options = options
    summaryDropdown.selectedValue = selected || 'nodisplay'
    // 打开下拉时取消 hover 高亮，避免视觉干扰
    hoveredRowIndex = null
    hoveredColIndex = null
    updateHoverRects()
  })
}

/**
 * 应用汇总选择
 * @returns {void}
 */
const handleSelectedSummary = () => {
  const colName = summaryDropdown.colName
  const selected = summaryDropdown.selectedValue
  summaryState[colName] = selected
  clearGroups()
  rebuildGroups()
  // 选择后关闭弹框
  summaryDropdown.visible = false
}

/**
 * 关闭汇总下拉
 * @returns {void}
 */
const closeSummaryDropdown = () => {
  summaryDropdown.visible = false
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
  if (stage) stage.setPointersPositions(e)
  if (!filterDropdown.visible && !summaryDropdown.visible) return
  const panel = filterDropdownRef.value
  const panelSummary = summaryDropdownRef.value
  const target = e.target as HTMLElement | null
  if (!target) return
  // 点击自身面板内：不关闭
  if ((panel && panel.contains(target)) || (panelSummary && panelSummary.contains(target))) return
  // 点击 el-select 下拉面板：不关闭
  const inElSelectDropdown = target.closest('.el-select-dropdown, .el-select__popper')
  if (inElSelectDropdown) return
  // 其它点击：关闭
  filterDropdown.visible = false
  summaryDropdown.visible = false
}

/**
 * 计算左右固定列与中间列的分组与宽度汇总
 * @returns
 */
const getSplitColumns = () => {
  if (!stage) {
    // 如果stage还没有初始化，返回默认值
    const leftCols = tableColumns.value.filter((c) => c.fixed === 'left')
    const rightCols = tableColumns.value.filter((c) => c.fixed === 'right')
    const centerCols = tableColumns.value.filter((c) => !c.fixed)
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
  // 计算滚动条预留宽度
  const stageWidthRaw = stage.width()
  // 计算滚动条预留高度
  const stageHeightRaw = stage.height()
  // 计算内容高度
  const contentHeight = activeData.value.length * props.bodyRowHeight
  // 计算垂直滚动条预留空间
  const verticalScrollbarSpace =
    contentHeight > stageHeightRaw - props.headerHeight - getSummaryRowHeight() ? props.scrollbarSize : 0
  // 计算内容宽度
  const stageWidth = stageWidthRaw - verticalScrollbarSpace

  // 计算已设置宽度的列的总宽度
  const fixedWidthColumns = tableColumns.value.filter((c) => c.width !== undefined)
  const autoWidthColumns = tableColumns.value.filter((c) => c.width === undefined)
  const fixedTotalWidth = fixedWidthColumns.reduce((acc, c) => acc + (c.width || 0), 0)

  // 计算自动宽度列应该分配的宽度
  const remainingWidth = Math.max(0, stageWidth - fixedTotalWidth)
  const rawAutoWidth = autoWidthColumns.length > 0 ? remainingWidth / autoWidthColumns.length : 0
  const autoColumnWidth = Math.max(props.minAutoColWidth, rawAutoWidth)

  // 为每个列计算最终宽度（支持用户拖拽覆盖）
  const columnsWithWidth = tableColumns.value.map((col) => {
    const overrideWidth = columnWidthOverrides[col.columnName as string]
    const width = overrideWidth !== undefined ? overrideWidth : col.width !== undefined ? col.width : autoColumnWidth
    return { ...col, width }
  })

  const leftCols = columnsWithWidth.filter((c) => c.fixed === 'left')
  const centerCols = columnsWithWidth.filter((c) => !c.fixed)
  const rightCols = columnsWithWidth.filter((c) => c.fixed === 'right')
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
 * 调整十六进制颜色亮度
 * @param hex 颜色，如 #409EFF
 * @param percent 亮度百分比，正数变亮，负数变暗（-100~100）
 */
const adjustHexColorBrightness = (hex: string, percent: number): string => {
  const normalizeHex = (h: string) => {
    if (!h) return '#000000'
    if (h.startsWith('#')) h = h.slice(1)
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    if (h.length !== 6) return '#000000'
    return '#' + h
  }
  const base = normalizeHex(hex)
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  const adj = (v: number) => clamp(Math.round(v + (percent / 100) * 255), 0, 255)
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`
}

/**
 * 为按钮矩形绑定“原生按钮”式动效（hover/active 阴影与亮度变化）
 */
const bindButtonInteractions = (
  rect: Konva.Rect,
  options: {
    baseFill: string
    baseStroke: string
    layer: Konva.Layer | null
    disabled?: boolean
  }
) => {
  let isHovering = false
  const hoverFill = adjustHexColorBrightness(options.baseFill, 8)
  const activeFill = adjustHexColorBrightness(options.baseFill, -8)
  const original = { x: rect.x(), y: rect.y(), w: rect.width(), h: rect.height() }

  const applyNormal = () => {
    rect.fill(options.baseFill)
    rect.shadowOpacity(0)
    rect.shadowBlur(0)
    rect.shadowOffset({ x: 0, y: 0 })
    rect.to({ x: original.x, y: original.y, scaleX: 1, scaleY: 1, duration: 0.08, easing: Konva.Easings.EaseInOut })
    options.layer?.batchDraw()
  }
  const applyHover = () => {
    rect.fill(hoverFill)
    rect.shadowColor(options.baseFill)
    rect.shadowOpacity(0.25)
    rect.shadowBlur(8)
    rect.shadowOffset({ x: 0, y: 1 })
    rect.to({ x: original.x, y: original.y, scaleX: 1, scaleY: 1, duration: 0.08, easing: Konva.Easings.EaseInOut })
    options.layer?.batchDraw()
  }
  const applyActive = () => {
    rect.fill(activeFill)
    rect.shadowColor(options.baseFill)
    rect.shadowOpacity(0.2)
    rect.shadowBlur(4)
    rect.shadowOffset({ x: 0, y: 0 })
    const sx = 0.98
    const sy = 0.98
    const dx = (original.w * (1 - sx)) / 2
    const dy = (original.h * (1 - sy)) / 2
    rect.to({
      x: original.x + dx,
      y: original.y + dy,
      scaleX: sx,
      scaleY: sy,
      duration: 0.06,
      easing: Konva.Easings.EaseInOut
    })
    options.layer?.batchDraw()
  }

  // 清理旧事件并绑定
  rect.off('mouseenter.buttonfx')
  rect.off('mouseleave.buttonfx')
  rect.off('mousedown.buttonfx')
  rect.off('mouseup.buttonfx')

  if (options.disabled) {
    rect.opacity(0.6)
    rect.on('mouseenter.buttonfx', () => {
      setPointer(false, 'default')
      if (stage) stage.container().style.cursor = 'not-allowed'
    })
    rect.on('mouseleave.buttonfx', () => {
      if (stage) stage.container().style.cursor = 'default'
    })
    return
  }

  rect.opacity(1)
  rect.on('mouseenter.buttonfx', () => {
    isHovering = true
    setPointer(true, 'pointer')
    applyHover()
  })
  rect.on('mouseleave.buttonfx', () => {
    isHovering = false
    setPointer(false, 'default')
    applyNormal()
  })
  rect.on('mousedown.buttonfx', () => {
    applyActive()
  })
  rect.on('mouseup.buttonfx', () => {
    if (isHovering) applyHover()
    else applyNormal()
  })
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
const truncateText = (text: string, maxWidth: number, fontSize: number | string, fontFamily: string): string => {
  fontSize = typeof fontSize === 'string' ? Number(fontSize) : fontSize
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
 * @param {number} rowIndex 行索引
 * @param {number} colIndex 列索引
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列配置
 * @param {number} cellX 单元格 X 坐标
 * @param {number} cellY 单元格 Y 坐标
 * @param {number} cellWidth 单元格宽度
 * @param {number} cellHeight 单元格高度
 * @param {Konva.Group} group 分组
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

  // 计算内容高度
  let contentHeight = activeData.value.length * props.bodyRowHeight

  // 初步估算：不预留滚动条空间
  const visibleContentWidthNoV = stageWidth - leftWidth - rightWidth
  const contentHeightNoH = stageHeight - props.headerHeight - getSummaryRowHeight()
  const prelimMaxX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidthNoV)
  const prelimMaxY = Math.max(0, contentHeight - contentHeightNoH)
  const verticalScrollbarSpace = prelimMaxY > 0 ? props.scrollbarSize : 0
  const horizontalScrollbarSpace = prelimMaxX > 0 ? props.scrollbarSize : 0
  // 复算：考虑另一条滚动条占位
  const visibleContentWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpace
  const maxScrollX = Math.max(0, totalWidth - leftWidth - rightWidth - visibleContentWidth)
  const maxScrollY = Math.max(
    0,
    contentHeight - (stageHeight - props.headerHeight - getSummaryRowHeight() - horizontalScrollbarSpace)
  )

  return { maxScrollX, maxScrollY }
}

/**
 * 计算虚拟滚动的可视区域（根据当前滚动位置得出渲染行范围）
 * @returns {void}
 */
const calculateVisibleRows = () => {
  if (!stage) return

  const stageHeight = stage.height()
  const contentHeight = stageHeight - props.headerHeight - getSummaryRowHeight() - props.scrollbarSize

  // 计算可视区域能显示的行数
  visibleRowCount = Math.ceil(contentHeight / props.bodyRowHeight)

  // 根据scrollY计算起始行
  const startRow = Math.floor(scrollY / props.bodyRowHeight)

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
const getFromPool = <T extends Konva.Node>(pools: T[], createPoolFn: () => T): T => {
  let pooledNode = pools.pop()
  if (!pooledNode) {
    pooledNode = createPoolFn()
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
  // 清理可能存在的临时属性，避免对象复用导致高亮残留
  try {
    node.setAttr && node.setAttr('original-fill', null)
    node.setAttr && node.setAttr('original-stroke', null)
    node.setAttr && node.setAttr('original-strokeWidth', null)
  } catch {}
  pool.push(node)
}

/**
 * 初始化state
 * @returns {void}
 */
const initStage = () => {
  emits('render-chart-start')

  // 等待demo节点发生变更再触发该方法

  const tableContainer = getTableContainerElement()

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

  if (!fixedBodyLayer) {
    fixedBodyLayer = new Konva.Layer()
    stage.add(fixedBodyLayer)
  }

  if (!fixedHeaderLayer) {
    fixedHeaderLayer = new Konva.Layer()
    stage.add(fixedHeaderLayer)
  }

  // 创建汇总图层与固定汇总图层（位于滚动条层之下）
  if (!summaryLayer) {
    summaryLayer = new Konva.Layer()
    stage.add(summaryLayer)
  }

  if (!fixedSummaryLayer) {
    fixedSummaryLayer = new Konva.Layer()
    stage.add(fixedSummaryLayer)
  }

  if (!scrollbarLayer) {
    scrollbarLayer = new Konva.Layer()
    stage.add(scrollbarLayer)
  }

  stage.setPointersPositions({
    clientX: 0,
    clientY: 0
  })
}

/**
 * 清除分组 清理所有分组
 * @returns {void}
 */
const clearGroups = () => {
  headerLayer?.destroyChildren()
  bodyLayer?.destroyChildren()
  summaryLayer?.destroyChildren()
  fixedHeaderLayer?.destroyChildren()
  fixedBodyLayer?.destroyChildren()
  fixedSummaryLayer?.destroyChildren()
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
   * 重置汇总组引用
   */
  leftSummaryGroup = null
  centerSummaryGroup = null
  rightSummaryGroup = null

  /**
   * 重置悬浮高亮
   */
  hoveredRowIndex = null
  hoveredColIndex = null
}

/**
 * 重建分组
 * @returns {void}
 */
const rebuildGroups = () => {
  if (
    !stage ||
    !headerLayer ||
    !bodyLayer ||
    !fixedBodyLayer ||
    !fixedHeaderLayer ||
    !scrollbarLayer ||
    !summaryLayer ||
    !fixedSummaryLayer
  )
    return

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
    const clipHeight = stageHeight - props.headerHeight - getSummaryRowHeight() - horizontalScrollbarSpace
    centerBodyClipGroup = new Konva.Group({
      x: leftWidth,
      y: props.headerHeight,
      clip: {
        x: 0,
        y: 0,
        width: stageWidth - leftWidth - rightWidth - verticalScrollbarSpace,
        height: clipHeight
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

  // 构建底部 summary 组（受开关控制）
  if (props.enableSummary) {
    const summaryY = stageHeight - getSummaryRowHeight() - horizontalScrollbarSpace
    leftSummaryGroup = new Konva.Group({ x: 0, y: summaryY, name: 'leftSummary' })

    centerSummaryGroup = new Konva.Group({ x: leftWidth - scrollX, y: summaryY, name: 'centerSummary' })

    rightSummaryGroup = new Konva.Group({
      x: stageWidth - rightWidth - verticalScrollbarSpace,
      y: summaryY,
      name: 'rightSummary'
    })
    // 中间 summary 放到底层，固定左右 summary 放顶层
    summaryLayer.add(centerSummaryGroup)
    fixedSummaryLayer.add(leftSummaryGroup, rightSummaryGroup)
  } else {
    leftSummaryGroup = null
    centerSummaryGroup = null
    rightSummaryGroup = null
  }

  /**
   * 添加中心滚动内容到剪辑组
   */
  centerBodyClipGroup.add(centerBodyGroup)

  /**
   * 添加固定列到固定层（顶层）
   */
  fixedBodyLayer.add(leftBodyGroup, rightBodyGroup)

  /**
   * 绘制左侧表头部分
   */
  drawHeaderPart(leftHeaderGroup, leftCols, 0, 0)
  /**
   * 绘制中间表头部分
   */
  drawHeaderPart(centerHeaderGroup, centerCols, 0, leftCols.length)
  /**
   * 绘制右侧表头部分
   */
  drawHeaderPart(rightHeaderGroup, rightCols, 0, leftCols.length + centerCols.length)

  /**
   * 绘制左侧主体部分
   */
  drawBodyPart(leftBodyGroup, leftCols, leftBodyPools, 0)
  /**
   * 绘制中间主体部分
   */
  drawBodyPart(centerBodyGroup, centerCols, centerBodyPools, leftCols.length)
  /**
   * 绘制右侧主体部分
   */
  drawBodyPart(rightBodyGroup, rightCols, rightBodyPools, leftCols.length + centerCols.length)

  /**
   * 绘制底部 summary
   */
  if (props.enableSummary) {
    drawSummaryPart(leftSummaryGroup, leftCols, 0, 0)
    drawSummaryPart(centerSummaryGroup, centerCols, 0, leftCols.length)
    drawSummaryPart(rightSummaryGroup, rightCols, 0, leftCols.length + centerCols.length)
  }

  createScrollbars()

  headerLayer.batchDraw()
  bodyLayer?.batchDraw()
  fixedBodyLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  summaryLayer?.batchDraw()
  fixedSummaryLayer?.batchDraw()
  scrollbarLayer?.batchDraw()
}

/**
 * 创建滚动条
 */
const createScrollbars = () => {
  if (!stage || !scrollbarLayer) return
  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  if (maxScrollY > 0) {
    // 绘制垂直滚动条顶部遮罩
    const verticalScrollbarHeaderMask = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: 0,
      width: props.scrollbarSize,
      height: props.headerHeight,
      fill: props.headerBackground,
      stroke: '', // 移除边框，避免与表头边框冲突
      strokeWidth: 0
    })
    scrollbarLayer.add(verticalScrollbarHeaderMask)
    // 绘制垂直滚动条底部遮罩
    const verticalScrollbarFooterMask = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: stageHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0),
      width: props.scrollbarSize,
      height: getSummaryRowHeight(),
      fill: props.summaryBackground,
      stroke: props.borderColor,
      strokeWidth: 1
    })

    if (getSummaryRowHeight() > 0) scrollbarLayer.add(verticalScrollbarFooterMask)

    // 创建垂直滚动条组
    verticalScrollbarGroup = new Konva.Group()
    scrollbarLayer.add(verticalScrollbarGroup)
    // 绘制垂直滚动条轨道
    const verticalScrollbarTrack = new Konva.Rect({
      x: stageWidth - props.scrollbarSize,
      y: props.headerHeight,
      width: props.scrollbarSize,
      height: stageHeight - props.headerHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0),
      fill: props.scrollbarBackground,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    verticalScrollbarGroup.add(verticalScrollbarTrack)

    // 计算垂直滚动条高度
    const trackHeight =
      stageHeight - props.headerHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0)
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
    // 计算垂直滚动条 Y 坐标
    const thumbY = props.headerHeight + (scrollY / maxScrollY) * (trackHeight - thumbHeight)

    // 绘制垂直滚动条滑块
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

    // 设置垂直滚动条事件
    setupVerticalScrollbarEvents()
  }

  // 水平滚动条
  if (maxScrollX > 0) {
    // 创建水平滚动条组
    horizontalScrollbarGroup = new Konva.Group()
    scrollbarLayer.add(horizontalScrollbarGroup)

    const verticalScrollbarSpaceForHorizontal = maxScrollY > 0 ? props.scrollbarSize : 0
    // 绘制水平滚动条轨道
    const horizontalScrollbarTrack = new Konva.Rect({
      x: 0,
      y: stageHeight - props.scrollbarSize,
      width: stageWidth - verticalScrollbarSpaceForHorizontal,
      height: props.scrollbarSize,
      fill: props.scrollbarBackground,
      stroke: props.borderColor,
      strokeWidth: 1
    })
    horizontalScrollbarGroup.add(horizontalScrollbarTrack)

    // 计算水平滚动条宽度
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const verticalScrollbarSpaceForThumb = maxScrollY > 0 ? props.scrollbarSize : 0
    // 计算水平滚动条宽度
    const visibleWidth = stageWidth - leftWidth - rightWidth - verticalScrollbarSpaceForThumb
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)

    // 绘制水平滚动条滑块
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

    // 设置水平滚动条事件
    setupHorizontalScrollbarEvents()
  }
}
/**
 * 设置指针样式的辅助函数
 * @param on 是否显示指针
 */
const setPointer = (on: boolean, cursor: string) => {
  if (stage) stage.container().style.cursor = on ? cursor : 'default'
}
/**
 * 绘制表头部分
 * @param group 分组
 * @param cols 列
 * @param startX 起始 X 坐标
 * @param startColIndex 起始列索引
 */
const drawHeaderPart = (
  headerGroupNode: Konva.Group | null,
  headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  startX: number,
  startColIndex: number
) => {
  if (!headerGroupNode) return

  const headerTotalWidth = headerCols.reduce((acc, c) => acc + (c.width || 0), 0)
  const headerBackgroundNode = new Konva.Rect({
    x: startX,
    y: 0,
    width: headerTotalWidth,
    height: props.headerHeight,
    fill: props.headerBackground,
    stroke: '', // 移除背景边框，避免重复
    strokeWidth: 0
  })
  headerGroupNode.add(headerBackgroundNode)

  let x = startX
  headerCols.forEach((col, colIndex) => {
    const headerCellNode = new Konva.Rect({
      x,
      y: 0,
      width: col.width || 0,
      height: props.headerHeight,
      stroke: props.borderColor,
      strokeWidth: 1,
      listening: false,
      cursor: 'default'
    })
    headerCellNode.setAttr('col-index', colIndex + startColIndex)
    headerCellNode.setAttr('row-index', 0)
    headerGroupNode.add(headerCellNode)

    // 如果该列当前参与排序，则给表头单元格一个高亮背景（多列排序）
    const isSortColumn = sortState.columns.find((s) => s.columnName === col.columnName)
    headerCellNode.fill(isSortColumn ? props.headerSortActiveBackground : props.headerBackground)

    // 预留右侧区域（排序箭头 + 过滤图标），避免与文本重叠
    // 预留约 40px 给右侧图标
    const maxTextWidth = (col.width || 0) - 40
    const fontFamily = props.headerFontFamily
    const fontSize = typeof props.headerFontSize === 'string' ? parseFloat(props.headerFontSize) : props.headerFontSize
    const displayName = col.displayName || col.columnName
    const truncatedTitle = truncateText(displayName, maxTextWidth, fontSize, fontFamily)
    const label = new Konva.Text({
      x: getTextX(x),
      y: props.headerHeight / 2,
      text: truncatedTitle,
      fontSize: fontSize,
      fontFamily: fontFamily,
      fill: props.headerTextColor,
      align: col.align || 'left',
      verticalAlign: 'middle',
      listening: false
    })
    label.offsetY(label.height() / 2)
    headerGroupNode.add(label)
    const centerY = props.headerHeight / 2

    // 如果用户当前列开启排序
    if (col.sortable) {
      // 排序箭头（三角形 ▲/▼），更紧凑与清晰（多列排序）
      const foundSort = sortState.columns.find((s) => s.columnName === col.columnName)
      const inactiveColor = '#C0C4CC'
      const upColor = foundSort?.order === 'asc' ? props.sortableColor : inactiveColor
      const downColor = foundSort?.order === 'desc' ? props.sortableColor : inactiveColor

      // 右侧预留区域：排序箭头 + 过滤图标（加大横向间距）
      const arrowX = x + (col.width || 0) - 34

      const arrowSize = 5
      const gap = 2
      // 上三角（升序 asc）
      const upTriangle = new Konva.RegularPolygon({
        x: arrowX,
        y: centerY - (arrowSize + gap) / 2,
        sides: 3,
        radius: arrowSize,
        rotation: 0,
        fill: upColor,
        listening: true
      })
      // 下三角（降序 desc）
      const downTriangle = new Konva.RegularPolygon({
        x: arrowX,
        y: centerY + (arrowSize + gap) / 2,
        sides: 3,
        radius: arrowSize,
        rotation: 180,
        fill: downColor,
        listening: true
      })
      headerGroupNode.add(upTriangle)
      headerGroupNode.add(downTriangle)

      // 排序箭头也显示小手
      upTriangle.on('mouseenter', () => setPointer(true, 'pointer'))
      upTriangle.on('mouseleave', () => setPointer(false, 'default'))
      downTriangle.on('mouseenter', () => setPointer(true, 'pointer'))
      downTriangle.on('mouseleave', () => setPointer(false, 'default'))

      // 排序箭头点击事件：只在点击箭头时触发排序
      const handleSortClick = (event: Konva.KonvaEventObject<MouseEvent>, order: 'asc' | 'desc') => {
        if (isResizingColumn) return
        const e = event.evt
        const hasModifier = !!(e && (e.shiftKey || e.ctrlKey || e.metaKey))
        const idx = sortState.columns.findIndex((s) => s.columnName === col.columnName)

        if (hasModifier) {
          // 多列模式：在原序列中追加/切换/移除该列
          if (idx === -1) {
            sortState.columns = [...sortState.columns, { columnName: col.columnName, order }]
          } else {
            const next = [...sortState.columns]
            if (next[idx].order === order) {
              // 如果点击的是相同顺序，则移除该列
              next.splice(idx, 1)
            } else {
              // 否则切换到新顺序
              next[idx] = { columnName: col.columnName, order }
            }
            sortState.columns = next
          }
        } else {
          // 单列模式：仅对当前列循环 asc -> desc -> remove
          if (idx === -1) {
            sortState.columns = [{ columnName: col.columnName, order }]
          } else if (sortState.columns[idx].order === order) {
            // 如果点击的是相同顺序，则移除该列
            sortState.columns = []
          } else {
            // 否则切换到新顺序
            sortState.columns = [{ columnName: col.columnName, order }]
          }
        }
        clearGroups()
        rebuildGroups()
      }

      // 升序事件（点击箭头）
      upTriangle.on('click', (evt) => handleSortClick(evt, 'asc'))
      // 降序事件（点击箭头）
      downTriangle.on('click', (evt) => handleSortClick(evt, 'desc'))
    }

    // 如果用户当前列开启过滤
    if (col.filterable) {
      const hasFilter = !!(filterState[col.columnName] && filterState[col.columnName].size > 0)
      const filterColor = hasFilter ? props.sortableColor : '#C0C4CC'
      const filterX = x + (col.width || 0) - 12
      // 绘制过滤器图标（漏斗形状）
      const filterIcon = new Konva.Shape({
        x: filterX - 6,
        y: centerY - 6,
        width: 16,
        height: 16,
        listening: true,
        name: `filter-icon-${col.columnName}`,
        sceneFunc: (context, shape) => {
          context.beginPath()
          // 漏斗上边缘（宽）
          context.moveTo(2, 2)
          context.lineTo(14, 2)
          // 漏斗中间收缩部分
          context.lineTo(11, 7)
          context.lineTo(11, 12)
          // 漏斗下边缘（窄）
          context.lineTo(5, 12)
          context.lineTo(5, 7)
          context.closePath()

          context.fillStrokeShape(shape)
        },
        stroke: filterColor,
        strokeWidth: 1.5,
        fill: hasFilter ? filterColor : 'transparent'
      })
      // 鼠标进入图标时，显示手型
      filterIcon.on('mouseenter', () => setPointer(true, 'pointer'))
      // 鼠标离开图标时，恢复默认指针
      filterIcon.on('mouseleave', () => setPointer(false, 'default'))

      headerGroupNode.add(filterIcon)

      // 点击图标：以 DOM 下拉框方式展示可选值
      filterIcon.on('click', (evt) => {
        const values = new Set<string>()
        tableData.value.forEach((r) => values.add(String(r[col.columnName] ?? '')))
        const options = Array.from(values)
        const current = filterState[col.columnName] ? Array.from(filterState[col.columnName]!) : []
        const optionUnion = Array.from(new Set<string>([...options, ...current]))
        openFilterDropdown(evt, col.columnName, optionUnion, current)
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
    headerGroupNode.add(resizer)

    resizer.on('mouseenter', () => {
      if (stage) setPointer(true, 'col-resize')
    })
    resizer.on('mouseleave', () => {
      if (!isResizingColumn && stage) setPointer(false, 'default')
    })
    // 鼠标按下时，开始拖拽列宽
    resizer.on('mousedown', (evt) => {
      isResizingColumn = true
      resizingColumnName = col.columnName
      resizeStartX = evt.evt.clientX
      resizeStartWidth = col.width || 0
      // 找到同组内紧随其后的列，作为跟随调整的邻居列
      const neighbor = headerCols[colIndex + 1]
      if (neighbor) {
        resizeNeighborColumnName = neighbor.columnName
        resizeNeighborStartWidth = neighbor.width || 0
      } else {
        resizeNeighborColumnName = null
        resizeNeighborStartWidth = 0
      }
      if (stage) setPointer(true, 'col-resize')
    })

    x += col.width || 0
  })
}

/**
 * 绘制汇总部分（固定在底部，风格与表头一致，但使用 bodyTextColor）
 * @param {Konva.Group | null} group 分组
 * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
 * @param {number} startX 起始 X 坐标
 * @param {number} startColIndex 起始列索引
 */
const drawSummaryPart = (
  summaryGroup: Konva.Group | null,
  summaryCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  startX: number,
  startColIndex: number
) => {
  if (!summaryGroup) return

  const summaryTotalWidth = summaryCols.reduce((acc, c) => acc + (c.width || 0), 0)

  const summaryBackgroundNode = new Konva.Rect({
    x: startX,
    y: 0,
    width: summaryTotalWidth,
    height: props.summaryHeight,
    fill: props.summaryBackground,
    stroke: '', // 移除背景边框，避免重复
    strokeWidth: 0
  })

  summaryGroup.add(summaryBackgroundNode)

  let x = startX
  summaryCols.forEach((col, colIndex) => {
    const summaryRectNode = new Konva.Rect({
      x,
      y: 0,
      width: col.width || 0,
      height: props.summaryHeight,
      fill: props.summaryBackground,
      stroke: props.borderColor,
      strokeWidth: 1,
      listening: true,
      cursor: 'default'
    })
    summaryRectNode.setAttr('col-index', colIndex + startColIndex)
    summaryRectNode.setAttr('row-index', activeData.value.length + 1)
    summaryGroup.add(summaryRectNode)

    // 先显示占位文本，然后异步更新
    const rule = summaryState[col.columnName] || 'nodisplay'
    const placeholderText = rule === 'nodisplay' ? '不显示' : '计算中...'
    const truncatedTitle = truncateText(
      placeholderText,
      (col.width || 0) - 16,
      props.summaryFontSize,
      props.summaryFontFamily
    )
    const fontSize =
      typeof props.summaryFontSize === 'string' ? parseFloat(props.summaryFontSize) : props.summaryFontSize
    const summaryTextNode = new Konva.Text({
      x: getTextX(x),
      y: props.summaryHeight / 2,
      text: truncatedTitle,
      fontSize: fontSize,
      fontFamily: props.summaryFontFamily,
      fill: props.summaryTextColor,
      align: col.align || 'left',
      verticalAlign: 'middle',
      listening: false
    })
    summaryTextNode.offsetY(summaryTextNode.height() / 2)
    summaryGroup.add(summaryTextNode)

    // 异步计算汇总值并更新文本
    if (rule !== 'nodisplay') {
      computeSummaryValueForColumn(col, rule).then((summaryText) => {
        // 获取汇总方式的中文名称
        const getRuleLabel = (rule: string) => {
          switch (rule) {
            case 'max':
              return '最大'
            case 'min':
              return '最小'
            case 'avg':
              return '平均'
            case 'sum':
              return '求和'
            case 'filled':
              return '已填写'
            case 'nofilled':
              return '未填写'
            default:
              return ''
          }
        }
        const ruleLabel = getRuleLabel(rule)
        const displayText = ruleLabel ? `${ruleLabel}: ${summaryText}` : summaryText
        const finalText = truncateText(
          displayText,
          (col.width || 0) - 16,
          props.summaryFontSize,
          props.summaryFontFamily
        )
        summaryTextNode.text(finalText)
        summaryGroup.getLayer()?.batchDraw()
      })
    }
    summaryRectNode.on('mouseenter', () => {
      if (stage) setPointer(true, 'pointer')
    })
    summaryRectNode.on('mouseleave', () => {
      if (stage) setPointer(false, 'default')
    })

    summaryRectNode.on('click', (evt) => {
      if (!stage) return
      const isNumber = col.columnType === 'number'
      const options = isNumber ? numberOptions : textOptions
      const prev = summaryState[col.columnName] || 'nodisplay'
      const valid = options.some((o) => o.value === prev) ? prev : 'nodisplay'
      openSummaryDropdown(evt, col.columnName, options, valid)
    })

    x += col.width || 0
  })
}

/**
 * 计算某列的汇总显示值（异步版本）
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} col 列
 * @param {string} rule 规则
 * @returns {string} 汇总显示值
 */
const computeSummaryValueForColumn = async (
  col: GroupStore.GroupOption | DimensionStore.DimensionOption,
  rule: string
) => {
  if (rule === 'nodisplay') return '不显示'
  const key = col.columnName
  const values = activeData.value.map((r) => r?.[key])
  const isNumber = values.some((v) => typeof v === 'number')
  if (isNumber) {
    const nums = values
      .map((v) => (typeof v === 'number' ? v : Number(v)))
      .filter((v) => Number.isFinite(v)) as number[]
    if (nums.length === 0) return ''
    switch (rule) {
      case 'max':
        return String(Math.max(...nums))
      case 'min':
        return String(Math.min(...nums))
      case 'avg': {
        const s = nums.reduce((a, b) => a + b, 0)
        const avg = s / nums.length
        return String(Number.isFinite(avg) ? Number(avg.toFixed(4)) : '')
      }
      case 'sum': {
        const s = await $webworker.run(() => nums.reduce((a, b) => a + b, 0))
        return String(Number.isFinite(s) ? Number(s) : '')
      }
      default:
        return ''
    }
  } else {
    const filled = values.filter((v) => v !== null && v !== undefined && String(v) !== '').length
    const empty = values.length - filled
    switch (rule) {
      case 'filled':
        return String(filled)
      case 'nofilled':
        return String(empty)
      default:
        return ''
    }
  }
}

/**
 * 设置垂直滚动条事件
 * @returns {void}
 */
const setupVerticalScrollbarEvents = () => {
  if (!verticalScrollbarThumb || !stage) return
  /**
   * 设置垂直滚动条拖拽事件
   */
  verticalScrollbarThumb.on('mousedown', (event) => {
    isDraggingVerticalThumb = true
    dragStartY = event.evt.clientY
    dragStartScrollY = scrollY
    stage!.container().style.cursor = 'grabbing'
    stage!.setPointersPositions(event.evt)
  })
  /**
   * 设置垂直滚动条鼠标进入事件
   */
  verticalScrollbarThumb.on('mouseenter', () => {
    if (verticalScrollbarThumb) verticalScrollbarThumb.fill(props.scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  /**
   * 设置垂直滚动条鼠标离开事件
   */
  verticalScrollbarThumb.on('mouseleave', () => {
    if (verticalScrollbarThumb && !isDraggingVerticalThumb) verticalScrollbarThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 设置水平滚动条事件
 * @returns {void}
 */
const setupHorizontalScrollbarEvents = () => {
  if (!horizontalScrollbarThumb || !stage) return

  horizontalScrollbarThumb.on('mousedown', (event) => {
    isDraggingHorizontalThumb = true
    dragStartX = event.evt.clientX
    dragStartScrollX = scrollX
    stage!.container().style.cursor = 'grabbing'

    // 设置指针位置到 stage，避免 Konva 警告
    stage!.setPointersPositions(event.evt)
  })

  horizontalScrollbarThumb.on('mouseenter', () => {
    if (horizontalScrollbarThumb) horizontalScrollbarThumb.fill(props.scrollbarThumbHover)
    scrollbarLayer?.batchDraw()
  })

  horizontalScrollbarThumb.on('mouseleave', () => {
    if (horizontalScrollbarThumb && !isDraggingHorizontalThumb) horizontalScrollbarThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  })
}

/**
 * 虚拟滚动版本的drawBodyPart
 * 只渲染可视区域的行
 * @param {Konva.Group | null} group 分组
 * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列
 * @param {ObjectPools} pools 对象池
 * @param {number} startColIndex 起始列索引
 * @returns {void}
 */
const drawBodyPart = (
  bodyGroup: Konva.Group | null,
  bodyCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
  pools: ObjectPools,
  startColIndex: number
) => {
  if (!stage || !bodyGroup) return

  // 计算可视区域
  calculateVisibleRows()

  const rowTotalWidth = bodyCols.reduce((acc, c) => acc + (c.width || 0), 0)

  // 清空当前组，将对象返回池中
  const children = bodyGroup.children.slice() // 复制数组避免修改时的问题
  children.forEach((child) => {
    if (child instanceof Konva.Rect) {
      if (child.fill() && child.fill() !== 'transparent') {
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
    const y = rowIndex * props.bodyRowHeight

    // 创建背景条纹：必须置底，避免在合并单元格跨越多行时覆盖上方单元格
    const backgroundRect = getFromPool(
      pools.backgroundRects,
      () => new Konva.Rect({ listening: false, name: 'row-rect' })
    )

    // 行背景矩形不应携带行/列索引，避免被误纳入 hover 高亮集合
    backgroundRect.setAttr('row-index', null)
    backgroundRect.setAttr('col-index', null)

    backgroundRect.x(0)
    backgroundRect.y(y)
    backgroundRect.width(rowTotalWidth)
    backgroundRect.height(props.bodyRowHeight)
    backgroundRect.fill(rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven)
    backgroundRect.stroke('')
    backgroundRect.strokeWidth(0)
    bodyGroup.add(backgroundRect)
    backgroundRect.moveToBottom()

    // 渲染每列的单元格
    let x = 0
    for (let colIndex = 0; colIndex < bodyCols.length; colIndex++) {
      const col = bodyCols[colIndex]
      const coveredKey = `${rowIndex}:${colIndex}`
      if (coveredCells.has(coveredKey)) {
        x += col.width || 0
        continue
      }
      const hasSpanMethod = typeof props.spanMethod === 'function'
      let spanRow = 1
      let spanCol = 1
      let coveredBySpanMethod = false
      if (hasSpanMethod) {
        // 传入全局列索引，以避免将左/中/右分区的局部索引当成第 0 列
        const globalColIndex = tableColumns.value.findIndex((c) => c.columnName === col.columnName)
        const res = props.spanMethod({ row, column: col, rowIndex, colIndex: globalColIndex })
        if (Array.isArray(res)) {
          spanRow = Math.max(0, Number(res[0]) || 0)
          spanCol = Math.max(0, Number(res[1]) || 0)
        } else if (res && typeof res === 'object') {
          spanRow = Math.max(0, Number(res.rowspan) || 0)
          spanCol = Math.max(0, Number(res.colspan) || 0)
        }
        // 只要任一维度为 0，即视为被合并覆盖（与常见表格合并语义一致）
        if (spanRow === 0 || spanCol === 0) coveredBySpanMethod = true
      }

      const shouldDraw = !hasSpanMethod || !coveredBySpanMethod

      if (!shouldDraw) {
        // 该列该行被上方合并单元格覆盖，仅推进 x 游标
        x += col.width || 0
        continue
      }
      const computedRowSpan = hasSpanMethod ? spanRow : 1

      const cellHeight = computedRowSpan * props.bodyRowHeight

      // 列跨度宽度
      let cellWidth = col.width || 0
      if (hasSpanMethod && spanCol > 1) {
        let acc = 0
        for (let c = colIndex; c < Math.min(colIndex + spanCol, bodyCols.length); c++) {
          acc += bodyCols[c].width || 0
          if (c !== colIndex) {
            for (let r = rowIndex; r < Math.min(rowIndex + spanRow, activeData.value.length); r++) {
              if (r >= visibleRowStart && r <= visibleRowEnd) coveredCells.add(`${r}:${c}`)
            }
          }
        }
        cellWidth = acc
      }

      // 若为合并单元格（跨行或跨列），在行斑马纹之上绘制统一背景色，避免内部出现条纹断层
      if (hasSpanMethod && (computedRowSpan > 1 || spanCol > 1)) {
        const mergedCellRect = getFromPool(
          pools.backgroundRects,
          () => new Konva.Rect({ listening: false, name: 'merged-cell' })
        )
        mergedCellRect.setAttr('row-index', rowIndex + 1)
        mergedCellRect.setAttr('col-index', colIndex + startColIndex)
        mergedCellRect.x(x)
        mergedCellRect.y(y)
        mergedCellRect.width(cellWidth)
        mergedCellRect.height(cellHeight)
        // 使用起始行的背景色以保持整体风格一致
        mergedCellRect.fill(rowIndex % 2 === 0 ? props.bodyBackgroundOdd : props.bodyBackgroundEven)
        mergedCellRect.stroke(props.borderColor)
        mergedCellRect.strokeWidth(1)
        bodyGroup.add(mergedCellRect)

        // 在合并单元格中绘制文本
        const rawValue = row && typeof row === 'object' ? row[col.columnName] : undefined
        const value = String(rawValue ?? '')
        const maxTextWidth = cellWidth - 16
        const fontFamily = props.bodyFontFamily
        const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize

        const truncatedValue = truncateText(value, maxTextWidth, fontSize, fontFamily)

        const mergedTextNode = getFromPool(pools.textNodes, () => new Konva.Text({ listening: false }))
        mergedTextNode.x(getTextX(x))
        mergedTextNode.y(y + cellHeight / 2)
        mergedTextNode.text(truncatedValue)
        mergedTextNode.fontSize(fontSize)
        mergedTextNode.fontFamily(fontFamily)
        mergedTextNode.fill(props.bodyTextColor)
        mergedTextNode.align('left')
        mergedTextNode.verticalAlign('middle')
        mergedTextNode.offsetY(mergedTextNode.height() / 2)
        bodyGroup.add(mergedTextNode)
      } else {
        const cellRect = getFromPool(pools.cellRects, () => new Konva.Rect({ listening: true, name: 'cell' }))
        cellRect.setAttr('row-index', rowIndex + 1)
        cellRect.setAttr('col-index', colIndex + startColIndex)
        cellRect.x(x)
        cellRect.y(y)
        cellRect.width(cellWidth)
        cellRect.height(cellHeight)
        cellRect.stroke(props.borderColor)
        cellRect.strokeWidth(1)
        cellRect.fill('transparent')

        // 清除之前的事件监听器
        cellRect.off('click')

        // 添加点击事件
        cellRect.on('click', () => {
          // 默认不启用"相同值合并"，因此不需要基于跨度推断点击行
          handleCellClick(rowIndex, colIndex, col, cellRect.x(), cellRect.y(), cellWidth, cellHeight, bodyGroup)
        })
        bodyGroup.add(cellRect)

        // 如果是操作列，绘制按钮；否则绘制文本
        if (col.columnName === 'action') {
          const actions = col.actions
          const gap = 6
          const buttonHeight = Math.max(22, Math.min(28, cellHeight - 8))
          const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
          // 估算单个按钮宽度基于文本长度
          const estimateButtonWidth = (text: string) => {
            const temp = new Konva.Text({
              text,
              fontSize: fontSize,
              fontFamily: props.bodyFontFamily
            })
            const w = temp.width() + 16
            temp.destroy()
            return clamp(w, 48, 120)
          }
          const palette: Record<string, { fill: string; stroke: string; text: string }> = {
            primary: { fill: '#409EFF', stroke: '#2b74c7', text: '#fff' },
            success: { fill: '#67C23A', stroke: '#4ea427', text: '#fff' },
            warning: { fill: '#E6A23C', stroke: '#c9882f', text: '#fff' },
            danger: { fill: '#F56C6C', stroke: '#d15858', text: '#fff' },
            default: { fill: '#73767a', stroke: '#5b5e62', text: '#fff' }
          }
          if (actions && actions.length > 0) {
            const widths = actions.map((a) => estimateButtonWidth(a.label))
            const totalButtonsWidth = widths.reduce((a, b) => a + b, 0) + gap * (actions.length - 1)
            let startX = x + (cellWidth - totalButtonsWidth) / 2
            const centerY = y + (cellHeight - buttonHeight) / 2
            actions.forEach((a, idx) => {
              const w = widths[idx]
              const theme = palette[a.type || 'primary'] || palette.primary
              const rect = getFromPool(
                pools.backgroundRects,
                () => new Konva.Rect({ listening: true, name: `action-button-${a.key}` })
              )
              rect.off('click')
              rect.off('mouseenter')
              rect.off('mouseleave')
              // 按钮矩形不应携带行/列索引，避免被误纳入 hover 高亮集合
              rect.setAttr('row-index', null)
              rect.setAttr('col-index', null)
              rect.x(startX)
              rect.y(centerY)
              rect.width(w)
              rect.height(buttonHeight)
              rect.cornerRadius(4)
              rect.fill(theme.fill)
              rect.stroke(theme.stroke)
              rect.strokeWidth(1)
              const isDisabled =
                typeof a.disabled === 'function' ? a.disabled(activeData.value[rowIndex], rowIndex) : !!a.disabled
              bindButtonInteractions(rect, {
                baseFill: theme.fill,
                baseStroke: theme.stroke,
                layer: bodyGroup.getLayer(),
                disabled: isDisabled
              })
              rect.on('click', () => {
                if (isDisabled) return
                const rowData = activeData.value[rowIndex]
                emits('action-click', { rowIndex, action: a.key, rowData })
              })
              bodyGroup.add(rect)
              const fontSize =
                typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
              const textNode = getFromPool(pools.textNodes, () => new Konva.Text({ listening: false }))
              textNode.x(startX + w / 2)
              textNode.y(centerY + buttonHeight / 2)
              textNode.text(a.label)
              textNode.fontSize(fontSize)
              textNode.fontFamily(props.bodyFontFamily)
              textNode.fill(theme.text)
              textNode.opacity(isDisabled ? 0.6 : 1)
              textNode.align('center')
              textNode.verticalAlign('middle')
              textNode.offset({ x: textNode.width() / 2, y: textNode.height() / 2 })
              bodyGroup.add(textNode)

              startX += w + gap
            })
          } else {
            // 兼容：未配置 actions 时，渲染一个默认“操作”按钮
            const buttonWidth = Math.max(48, Math.min(88, cellWidth - 16))
            const buttonX = x + (cellWidth - buttonWidth) / 2
            const buttonY = y + (cellHeight - buttonHeight) / 2
            const rect = getFromPool(
              pools.backgroundRects,
              () => new Konva.Rect({ listening: true, name: 'action-button' })
            )
            rect.off('click')
            rect.off('mouseenter')
            rect.off('mouseleave')
            // 按钮矩形不应携带行/列索引，避免被误纳入 hover 高亮集合
            rect.setAttr('row-index', null)
            rect.setAttr('col-index', null)
            rect.x(buttonX)
            rect.y(buttonY)
            rect.width(buttonWidth)
            rect.height(buttonHeight)
            rect.cornerRadius(4)
            rect.fill('#409EFF')
            rect.stroke('#2b74c7')
            rect.strokeWidth(1)
            const isDisabled = false
            bindButtonInteractions(rect, {
              baseFill: '#409EFF',
              baseStroke: '#2b74c7',
              layer: bodyGroup.getLayer(),
              disabled: isDisabled
            })
            rect.on('click', () => {
              if (isDisabled) return
              const rowData = activeData.value[rowIndex]
              emits('action-click', { rowIndex, action: 'action', rowData })
            })
            bodyGroup.add(rect)
            const fontSize =
              typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize
            const label = getFromPool(pools.textNodes, () => new Konva.Text({ listening: false }))
            label.x(buttonX + buttonWidth / 2)
            label.y(buttonY + buttonHeight / 2)
            label.text('操作')
            label.fontSize(fontSize)
            label.fontFamily(props.bodyFontFamily)
            label.fill('#fff')
            label.opacity(isDisabled ? 0.6 : 1)
            label.align('center')
            label.verticalAlign('middle')
            label.offset({ x: label.width() / 2, y: label.height() / 2 })
            bodyGroup.add(label)
          }
        } else {
          // 创建文本
          const rawValue = row && typeof row === 'object' ? row[col.columnName] : undefined
          const value = String(rawValue ?? '')
          const maxTextWidth = cellWidth - 16
          const fontFamily = props.bodyFontFamily
          const fontSize = typeof props.bodyFontSize === 'string' ? parseFloat(props.bodyFontSize) : props.bodyFontSize

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
          bodyGroup.add(textNode)

          const colShowOverflow = col.showOverflowTooltip
          const enableTooltip = colShowOverflow !== undefined ? colShowOverflow : false
          if (enableTooltip && truncatedValue !== value) {
            // 悬浮提示：仅在文本被截断时创建 Konva.Tooltip 等价层
            // 这里用浏览器原生 title 实现，命中区域为单元格矩形
            // Konva 没有内置 tooltip，避免复杂度，先用 title
            cellRect.off('mouseenter.tooltip')
            cellRect.on('mouseenter.tooltip', () => {
              if (!stage) return
              // 设置 container 的 title
              stage.container().setAttribute('title', String(rawValue ?? ''))
            })
            cellRect.off('mouseleave.tooltip')
            cellRect.on('mouseleave.tooltip', () => {
              if (!stage) return
              // 清除 title，避免全局悬浮
              stage.container().removeAttribute('title')
            })
          }
        }
      }
      x += col.width || 0
    }
  }

  // 检查是否需要重新创建高亮（选中的单元格在当前可视区域内）
  if (selectedCell && selectedCell.rowIndex >= visibleRowStart && selectedCell.rowIndex <= visibleRowEnd) {
    // 找到选中的列在当前组中的位置
    const selectedColIndex = bodyCols.findIndex((col) => col.columnName === selectedCell!.colKey)
    if (selectedColIndex >= 0) {
      // 计算高亮位置
      let highlightX = 0
      for (let i = 0; i < selectedColIndex; i++) {
        highlightX += bodyCols[i].width || 0
      }
      const col = bodyCols[selectedColIndex]
      // 默认宽/高
      let highlightWidth = col.width || 0
      let highlightY = selectedCell!.rowIndex * props.bodyRowHeight
      let highlightHeight = props.bodyRowHeight

      // 若存在 spanMethod，以其为准
      if (typeof props.spanMethod === 'function') {
        const res = props.spanMethod({
          row: activeData.value[selectedCell!.rowIndex],
          column: col,
          rowIndex: selectedCell!.rowIndex,
          // 选中高亮也应传全局列索引
          colIndex: tableColumns.value.findIndex((c) => c.columnName === col.columnName)
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
          highlightHeight = (drawEnd - selectedCell!.rowIndex + 1) * props.bodyRowHeight
          // 计算跨列宽度
          let acc = 0
          for (let c = selectedColIndex; c < Math.min(selectedColIndex + spanCol, bodyCols.length); c++) {
            acc += bodyCols[c].width || 0
          }
          highlightWidth = acc
        }
      }
      // 重新创建高亮
      createHighlightRect(highlightX, highlightY, highlightWidth, highlightHeight, bodyGroup)
    }
  }
  // 渲染完成后，重新计算 行下标 列下标
  recomputeHoverIndexFromPointer()
}

/**
 * 基于当前指针位置重新计算 行下标 列下标
 * @returns {void}
 */
const recomputeHoverIndexFromPointer = () => {
  if (
    !stage ||
    (!props.enableRowHoverHighlight && !props.enableColHoverHighlight) ||
    filterDropdown.visible ||
    summaryDropdown.visible
  ) {
    return
  }

  // 清除高亮的辅助函数
  const clearHoverHighlight = () => {
    if (hoveredRowIndex !== null || hoveredColIndex !== null) {
      hoveredRowIndex = null
      hoveredColIndex = null
      updateHoverRects()
    }
  }

  // 检查各种边界条件，如果不符合则清除高亮并返回
  if (!isTopMostInTable(lastClientX, lastClientY)) {
    clearHoverHighlight()
    return
  }

  const pointerPosition = stage.getPointerPosition()
  if (!pointerPosition) {
    clearHoverHighlight()
    return
  }

  /**
   * 检查鼠标是否在表格区域内（排除滚动条区域）
   */
  if (!isInTableArea(lastClientX, lastClientY)) {
    clearHoverHighlight()
    return
  }

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const localY = pointerPosition.y
  const localX = pointerPosition.x
  const hasHorizontalScrollbar = getScrollLimits().maxScrollX > 0
  const horizontalBarSpace = hasHorizontalScrollbar ? props.scrollbarSize : 0
  const summaryHeight = getSummaryRowHeight()

  /**
   * 计算鼠标所在的行索引（考虑合并行，且仅在当前列是合并列时折叠到起始行）
   * header = 0, body 从 1 开始, summary = activeData.length + 1
   */
  const getRowIndexFromPointer = (hoverColIndex: number | null): number | null => {
    // Header 区域
    if (localY < props.headerHeight) return 0

    const bodyEndY = stageHeight - summaryHeight - horizontalBarSpace
    // Body 区域
    if (localY >= props.headerHeight && localY <= bodyEndY) {
      const yInBodyContent = localY - props.headerHeight + scrollY
      let rowInData = Math.floor(yInBodyContent / props.bodyRowHeight)
      if (rowInData < 0 || rowInData >= activeData.value.length) return null

      // 仅当当前列是合并列，并且指针命中了被合并覆盖的行时，返回起始行
      if (typeof props.spanMethod === 'function' && hoverColIndex !== null) {
        const col = tableColumns.value[hoverColIndex]
        if (col) {
          const parseRowspan = (res: any): number => {
            if (Array.isArray(res)) return Math.max(0, Number(res[0]) || 0)
            if (res && typeof res === 'object') return Math.max(0, Number(res.rowspan) || 0)
            return 1
          }

          const currentRes = props.spanMethod({
            row: activeData.value[rowInData],
            column: col,
            rowIndex: rowInData,
            colIndex: hoverColIndex
          })
          const currentSpanRow = parseRowspan(currentRes)

          // 若当前行在该列被合并覆盖（rowspan 为 0），向上查找起始行
          if (currentSpanRow === 0) {
            for (let k = rowInData - 1; k >= 0; k--) {
              const res = props.spanMethod({
                row: activeData.value[k],
                column: col,
                rowIndex: k,
                colIndex: hoverColIndex
              })
              const spanRow = parseRowspan(res)
              if (spanRow > 1 && rowInData < k + spanRow) {
                rowInData = k
                break
              }
            }
          }
        }
      }

      // 返回最终行索引（1 基）
      return rowInData + 1
    }

    // Summary 区域
    if (summaryHeight > 0 && localY > bodyEndY && localY <= stageHeight - horizontalBarSpace) {
      return activeData.value.length + 1
    }

    return null
  }

  /**
   * 计算列索引的辅助函数
   * @param {Array<GroupStore.GroupOption | DimensionStore.DimensionOption>} cols 列数组
   * @param {number} startX 起始 X 坐标
   * @param {number} currentX 当前 X 坐标
   */
  const findColumnIndex = (
    cols: (GroupStore.GroupOption | DimensionStore.DimensionOption)[],
    startX: number,
    currentX: number
  ) => {
    for (let i = 0; i < cols.length; i++) {
      const colWidth = cols[i].width || 0
      if (currentX >= startX && currentX < startX + colWidth) {
        return i
      }
      startX += colWidth
    }
    return null
  }

  const { leftCols, centerCols, rightCols, leftWidth, rightWidth } = getSplitColumns()

  // 当存在水平滚动条时，右侧固定列的起始 X 需要扣除滚动条占位
  const effectiveRightStartX = stageWidth - rightWidth - horizontalBarSpace
  let newHoverColIndex: number | null = null
  if (localX < leftWidth) {
    // 左侧固定列区域
    const idx = findColumnIndex(leftCols, 0, localX)
    newHoverColIndex = idx
  } else if (localX >= effectiveRightStartX) {
    // 右侧固定列区域
    const idx = findColumnIndex(rightCols, effectiveRightStartX, localX)
    newHoverColIndex = idx !== null ? leftCols.length + centerCols.length + idx : null
  } else {
    // 中间滚动区域，需要考虑 scrollX 偏移
    const centerX = localX - leftWidth + scrollX
    const idx = findColumnIndex(centerCols, 0, centerX)
    newHoverColIndex = idx !== null ? leftCols.length + idx : null
  }

  const newHoverRowIndex = getRowIndexFromPointer(newHoverColIndex)

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
    updateHoverRects()
    console.log('hoveredRowIndex', hoveredRowIndex)
    console.log('hoveredColIndex', hoveredColIndex)
  }
}

/**
 * 清除所有高亮效果
 */
const clearHoverHighlights = (type: 'row' | 'column') => {
  if (!stage) return
  if (type === 'row') {
    rowHighlightRects?.forEach((rect) => {
      rect.fill(rect.getAttr('original-fill') || null)
    })
    rowHighlightRects = null
  } else {
    colHighlightRects?.forEach((rect) => {
      rect.fill(rect.getAttr('original-fill') || null)
    })
    colHighlightRects = null
  }
}

/**
 * 创建或更新行和列的 hover 高亮矩形
 */
const updateHoverRects = () => {
  if (!stage) return
  // 根据配置和当前悬停状态创建高亮效果
  if (props.enableRowHoverHighlight && hoveredRowIndex !== null) {
    // 清除之前的高亮
    clearHoverHighlights('row')
    getColOrRowHighlightRects('row', hoveredRowIndex)
    // applyHighlightToRects('row')
  } else {
    clearHoverHighlights('row')
  }
  if (props.enableColHoverHighlight && hoveredColIndex !== null) {
    // 清除之前的高亮
    clearHoverHighlights('column')
    getColOrRowHighlightRects('column', hoveredColIndex)
    // applyHighlightToRects('column')
  } else {
    clearHoverHighlights('column')
  }

  // 重绘所有图层
  bodyLayer?.batchDraw()
  fixedBodyLayer?.batchDraw()
  headerLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  scrollbarLayer?.batchDraw()
}
let rowHighlightRects: Konva.Rect[] | null = null
let colHighlightRects: Konva.Rect[] | null = null
/**
 * 获取指定行需要高亮的所有矩形
 * @param rowIndex 行索引
 * @returns 矩形数组
 */
const getColOrRowHighlightRects = (type: 'row' | 'column', index: number) => {
  // 初始化高亮矩形数组
  if (type === 'row') {
    if (!rowHighlightRects) rowHighlightRects = []
  } else {
    if (!colHighlightRects) colHighlightRects = []
  }

  const allGroups = [
    leftHeaderGroup,
    centerHeaderGroup,
    rightHeaderGroup,
    leftBodyGroup,
    centerBodyGroup,
    rightBodyGroup,
    leftSummaryGroup,
    centerSummaryGroup,
    rightSummaryGroup
  ]
  allGroups.forEach((group) => {
    if (!group) return
    group.children.forEach((child) => {
      if (!(child instanceof Konva.Rect)) return
      // 排除非单元格矩形：行背景与操作按钮
      const nodeName = child.name?.() || ''
      if (nodeName === 'row-rect' || nodeName === 'action-button' || nodeName.startsWith?.('action-button-')) return
      if (type === 'row') {
        // 检查行索引
        const attr = child.getAttr('row-index')
        if (typeof attr === 'number' && attr === index) {
          // 避免重复添加
          if (!rowHighlightRects!.includes(child)) {
            rowHighlightRects!.push(child)
          }
        }
      } else {
        // 检查列索引
        const attr = child.getAttr('col-index')
        if (typeof attr === 'number' && attr === index) {
          // 避免重复添加
          if (!colHighlightRects!.includes(child)) {
            colHighlightRects!.push(child)
          }
        }
      }
    })
  })

  // 应用高亮效果
  applyHighlightToAllRects()
}

/**
 * 应用高亮效果到所有相关矩形
 */
const applyHighlightToAllRects = () => {
  // 首先处理行高亮
  if (rowHighlightRects) {
    rowHighlightRects.forEach((rect) => {
      // 保存原始样式
      if (!rect.getAttr('original-fill')) {
        rect.setAttr('original-fill', rect.fill())
        rect.setAttr('original-stroke', rect.stroke())
        rect.setAttr('original-strokeWidth', rect.strokeWidth())
      }
      rect.fill(props.highlightRowBackground)
    })
  }

  // 然后处理列高亮
  if (colHighlightRects) {
    colHighlightRects.forEach((rect) => {
      // 保存原始样式
      if (!rect.getAttr('original-fill')) {
        rect.setAttr('original-fill', rect.fill())
        rect.setAttr('original-stroke', rect.stroke())
        rect.setAttr('original-strokeWidth', rect.strokeWidth())
      }
      rect.fill(props.highlightColBackground)
    })
  }

  // 最后处理交叉矩形：找到既在行高亮数组又在列高亮数组的矩形
  if (rowHighlightRects && colHighlightRects && hoveredRowIndex !== null && hoveredColIndex !== null) {
    // 寻找交叉矩形：同时具有当前行和列索引的矩形
    const allGroups = [
      leftHeaderGroup,
      centerHeaderGroup,
      rightHeaderGroup,
      leftBodyGroup,
      centerBodyGroup,
      rightBodyGroup,
      leftSummaryGroup,
      centerSummaryGroup,
      rightSummaryGroup
    ]

    allGroups.forEach((group) => {
      if (!group) return
      group.children.forEach((child) => {
        if (!(child instanceof Konva.Rect)) return
        const rowAttr = child.getAttr('row-index')
        const colAttr = child.getAttr('col-index')

        // 如果这个矩形是交叉矩形（同时具有当前行和列索引）
        if (
          typeof rowAttr === 'number' &&
          typeof colAttr === 'number' &&
          rowAttr === hoveredRowIndex &&
          colAttr === hoveredColIndex
        ) {
          // 保存原始样式
          if (!child.getAttr('original-fill')) {
            child.setAttr('original-fill', child.fill())
            child.setAttr('original-stroke', child.stroke())
            child.setAttr('original-strokeWidth', child.strokeWidth())
          }
          // 使用交叉高亮颜色（这里可以设计一个混合色或者使用列高亮色）
          child.fill(props.highlightColBackground)
        }
      })
    })
  }
}

/**
 * 应用高亮效果到矩形数组
 * @param rects 矩形数组
 * @param type 高亮类型
 */
const applyHighlightToRects = (type: 'row' | 'column') => {
  const highlightRects = type === 'row' ? rowHighlightRects : colHighlightRects
  if (!highlightRects) return
  const highlightColor = type === 'row' ? props.highlightRowBackground : props.highlightColBackground
  highlightRects.forEach((rect) => {
    // Save original styles once
    if (!rect.getAttr('original-fill')) {
      rect.setAttr('original-fill', rect.fill())
      rect.setAttr('original-stroke', rect.stroke())
      rect.setAttr('original-strokeWidth', rect.strokeWidth())
    }
    // Apply highlight
    rect.fill(highlightColor)
  })
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
    Math.abs(scrollY - oldScrollY) > props.bodyRowHeight * 2 // 滚动超过2行时强制重新渲染

  if (needsRerender) {
    // 重新渲染可视区域
    const { leftCols, centerCols, rightCols } = getSplitColumns()
    drawBodyPart(leftBodyGroup, leftCols, leftBodyPools, 0)
    drawBodyPart(centerBodyGroup, centerCols, centerBodyPools, leftCols.length)
    drawBodyPart(rightBodyGroup, rightCols, rightBodyPools, leftCols.length + centerCols.length)
  }

  const bodyY = props.headerHeight - scrollY
  const centerY = -scrollY

  // 固定列和中间列随垂直滚动
  leftBodyGroup.y(bodyY)
  rightBodyGroup.y(bodyY)
  centerBodyGroup.y(centerY)

  // summary 固定在底部，不随垂直滚动；仅中间 summary 随横向滚动，已在水平滚动中处理

  updateScrollbars()

  // 更新行和列高亮矩形位置（因为可视区域可能改变了）
  // 无条件重算与更新，避免滚动时 hover 状态不同步
  recomputeHoverIndexFromPointer()
  updateHoverRects()

  bodyLayer?.batchDraw()
  fixedBodyLayer?.batchDraw()
  summaryLayer?.batchDraw()
  fixedSummaryLayer?.batchDraw()
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

  // 中间区域随横向滚动
  centerHeaderGroup.x(headerX)
  centerBodyGroup.x(centerX)
  // summary 中间部分也随横向滚动
  if (centerSummaryGroup) centerSummaryGroup.x(headerX)

  updateScrollbars()

  headerLayer?.batchDraw()
  bodyLayer?.batchDraw()
  summaryLayer?.batchDraw()
  fixedSummaryLayer?.batchDraw()

  recomputeHoverIndexFromPointer()
  updateHoverRects()

  // 横向滚动时更新弹框位置
  updateDropdownPositions()
}

/**
 * 更新滚动条
 */
const updateScrollbars = () => {
  if (!stage) return

  const stageWidth = stage.width()
  const stageHeight = stage.height()
  const { maxScrollX, maxScrollY } = getScrollLimits()

  // 更新垂直滚动条位置
  if (verticalScrollbarThumb && maxScrollY > 0) {
    const trackHeight =
      stageHeight - props.headerHeight - getSummaryRowHeight() - (maxScrollX > 0 ? props.scrollbarSize : 0)
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
    const thumbY = props.headerHeight + (scrollY / maxScrollY) * (trackHeight - thumbHeight)
    verticalScrollbarThumb.y(thumbY)
  }

  // 更新水平滚动条位置
  if (horizontalScrollbarThumb && maxScrollX > 0) {
    const { leftWidth, rightWidth, centerWidth } = getSplitColumns()
    const visibleWidth = stageWidth - leftWidth - rightWidth - (maxScrollY > 0 ? props.scrollbarSize : 0)
    const thumbWidth = Math.max(20, (visibleWidth * visibleWidth) / centerWidth)
    const thumbX = leftWidth + (scrollX / maxScrollX) * (visibleWidth - thumbWidth)
    horizontalScrollbarThumb.x(thumbX)
  }

  scrollbarLayer?.batchDraw()
}

/**
 * 处理滚轮事件
 * @param {WheelEvent} e 滚轮事件
 */
const handleWheel = (e: WheelEvent) => {
  e.preventDefault()

  // 设置指针位置到 stage，避免 Konva 警告
  if (stage) stage.setPointersPositions(e)

  // 同步最后一次客户端坐标，用于遮罩与区域判断
  lastClientX = e.clientX
  lastClientY = e.clientY

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
 * @param {MouseEvent} e 鼠标移动事件
 */
const handleMouseMove = (e: MouseEvent) => {
  if (!stage) return
  stage.setPointersPositions(e)
  if (filterDropdown.visible || summaryDropdown.visible) return

  // 记录鼠标在屏幕中的坐标
  lastClientX = e.clientX
  lastClientY = e.clientY

  /**
   * 列宽拖拽中：实时更新覆盖宽度并重建分组
   */
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

  /**
   * 垂直滚动
   */
  if (isDraggingVerticalThumb) {
    const deltaY = e.clientY - dragStartY
    // 添加容错机制：只有当垂直移动距离超过阈值时才触发滚动
    const scrollThreshold = props.scrollThreshold
    if (Math.abs(deltaY) < scrollThreshold) return

    const { maxScrollY } = getScrollLimits()
    const stageHeight = stage.height()
    const trackHeight =
      stageHeight -
      props.headerHeight -
      getSummaryRowHeight() -
      (getScrollLimits().maxScrollX > 0 ? props.scrollbarSize : 0)
    const thumbHeight = Math.max(20, (trackHeight * trackHeight) / (tableData.value.length * props.bodyRowHeight))
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
      Math.abs(scrollY - oldScrollY) > props.bodyRowHeight * 2

    if (needsRerender) {
      // 重新渲染可视区域
      const { leftCols, centerCols, rightCols } = getSplitColumns()
      drawBodyPart(leftBodyGroup, leftCols, leftBodyPools, 0)
      drawBodyPart(centerBodyGroup, centerCols, centerBodyPools, leftCols.length)
      drawBodyPart(rightBodyGroup, rightCols, rightBodyPools, leftCols.length + centerCols.length)
    }

    updateScrollPositions()
  }

  /**
   * 水平滚动
   */
  if (isDraggingHorizontalThumb) {
    const deltaX = e.clientX - dragStartX
    // 添加容错机制：只有当水平移动距离超过阈值时才触发滚动
    const scrollThreshold = props.scrollThreshold
    if (Math.abs(deltaX) < scrollThreshold) return
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

  /**
   * 普通移动时，更新 hoveredRowIndex 和 hoveredColIndex
   */
  if (!isDraggingVerticalThumb && !isDraggingHorizontalThumb) {
    recomputeHoverIndexFromPointer()
  }
}

/**
 * 处理鼠标抬起事件
 */
const handleMouseUp = (e: MouseEvent) => {
  if (stage) stage.setPointersPositions(e)
  /**
   * 滚动条拖拽结束
   */
  if (isDraggingVerticalThumb || isDraggingHorizontalThumb) {
    isDraggingVerticalThumb = false
    isDraggingHorizontalThumb = false
    if (stage) setPointer(false, 'default')

    if (verticalScrollbarThumb && !isDraggingVerticalThumb) verticalScrollbarThumb.fill(props.scrollbarThumb)
    if (horizontalScrollbarThumb && !isDraggingHorizontalThumb) horizontalScrollbarThumb.fill(props.scrollbarThumb)
    scrollbarLayer?.batchDraw()
  }

  /**
   * 列宽拖拽结束
   */
  if (isResizingColumn) {
    isResizingColumn = false
    resizingColumnName = null
    resizeNeighborColumnName = null
    if (stage) setPointer(false, 'default')
    // 结束拖拽后，强制重建，确保汇总行列宽与表头同步
    clearGroups()
    rebuildGroups()
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
  const summaryY = stage
    ? stage.height() - getSummaryRowHeight() - (getScrollLimits().maxScrollX > 0 ? props.scrollbarSize : 0)
    : 0

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
   * 更新底部 summary 组位置
   */
  if (leftSummaryGroup) leftSummaryGroup.y(summaryY)
  if (rightSummaryGroup) rightSummaryGroup.y(summaryY)
  if (centerSummaryGroup) centerSummaryGroup.y(summaryY)

  updateScrollbars()
  headerLayer?.batchDraw()
  bodyLayer?.batchDraw()
  fixedBodyLayer?.batchDraw()
  fixedHeaderLayer?.batchDraw()
  summaryLayer?.batchDraw()
  fixedSummaryLayer?.batchDraw()

  // 滚动时更新弹框位置
  // updateDropdownPositions()
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

  calculateVisibleRows()
  clearGroups()
  rebuildGroups()
}

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
  () => [props.chartWidth, props.chartHeight],
  async () => {
    if (!stage) return
    // 等待demo节点发生变更再触发该方法
    await nextTick()
    initStage()
    refreshTable(true)
  }
)

/**
 * header 相关（尺寸与样式）
 */
watch(
  () => [
    props.headerHeight,
    props.headerFontFamily,
    props.headerFontSize,
    props.headerTextColor,
    props.headerBackground,
    props.headerSortActiveBackground
  ],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * body 相关（行高与样式）
 */
watch(
  () => [
    props.bodyRowHeight,
    props.bodyBackgroundOdd,
    props.bodyBackgroundEven,
    props.borderColor,
    props.bodyTextColor,
    props.bodyFontSize,
    props.bodyFontFamily
  ],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 汇总行相关
 */
watch(
  () => [
    props.enableSummary,
    props.summaryHeight,
    props.summaryFontFamily,
    props.summaryFontSize,
    props.summaryBackground,
    props.summaryTextColor
  ],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 滚动条相关（样式与尺寸）
 */
watch(
  () => [props.scrollbarBackground, props.scrollbarThumb, props.scrollbarThumbHover, props.scrollbarSize],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 交互相关（悬浮高亮、排序指示等）
 */
watch(
  () => [
    props.enableRowHoverHighlight,
    props.enableColHoverHighlight,
    props.sortableColor,
    props.highlightCellBackground
  ],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 虚拟滚动/性能相关
 */
watch(
  () => [props.bufferRows, props.scrollThreshold],
  () => {
    if (!stage) return
    refreshTable(false)
  }
)

/**
 * 挂载
 * @returns {void}
 */
onMounted(() => {
  initStage()
  refreshTable(true)
  window.addEventListener('mousedown', onGlobalMousedown, true)
  const tableContainer = getTableContainerElement()
  tableContainer?.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('resize', handleResize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
  // 添加滚动监听器，监听页面滚动
  window.addEventListener('scroll', handleScroll)
  document.addEventListener('scroll', handleScroll)
})

/**
 * 卸载
 */
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onGlobalMousedown, true)
  const tableContainer = getTableContainerElement()
  tableContainer?.removeEventListener('wheel', handleWheel)
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  // 移除滚动监听器
  window.removeEventListener('scroll', handleScroll)
  document.removeEventListener('scroll', handleScroll)

  stage?.destroy()
  stage = null
  headerLayer = null
  bodyLayer = null
  fixedBodyLayer = null
  fixedHeaderLayer = null
  summaryLayer = null
  fixedSummaryLayer = null
  scrollbarLayer = null
  centerBodyClipGroup = null
  selectedCell = null
  highlightRect = null
})
</script>

<style lang="scss" scoped>
.table-container {
  position: relative;
}

.dms-filter-dropdown,
.dms-summary-dropdown {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  padding: 5px 8px;
  border-radius: 4px;
}
</style>
