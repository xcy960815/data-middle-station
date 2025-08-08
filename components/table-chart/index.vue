<template>
  <div class="canvas-table-chart h-full">
    <div class="table-layout">
      <!-- 左侧固定列 -->
      <div v-if="hasFixedColumns && leftFixedCount > 0" class="fixed-left" :style="{ width: leftFixedWidth + 'px' }">
        <canvas ref="leftCanvasRef" class="fixed-canvas" @click="handleLeftCanvasClick"></canvas>
      </div>

      <!-- 中间滚动区域 -->
      <div class="scroll-container" @scroll="handleScroll">
        <div class="scroll-wrapper" :style="{ width: scrollableContainerWidth + 'px' }">
          <canvas ref="centerCanvasRef" class="scroll-canvas" @click="handleCenterCanvasClick"></canvas>
        </div>
      </div>

      <!-- 右侧固定列 -->
      <div v-if="hasFixedColumns && rightFixedCount > 0" class="fixed-right" :style="{ width: rightFixedWidth + 'px' }">
        <canvas ref="rightCanvasRef" class="fixed-canvas" @click="handleRightCanvasClick"></canvas>
      </div>
    </div>

    <div class="pagination">
      <span class="pagination-info"> 第{{ startIndex }}-{{ endIndex }}条，共{{ totalPage }}页{{ total }}条 </span>
      <div class="pagination-controls">
        <el-icon :size="12" class="cursor-pointer" @click="handlePreviousPage(1)">
          <DArrowLeft />
        </el-icon>
        <el-icon :size="12" class="cursor-pointer" @click="handlePreviousPage">
          <ArrowLeft />
        </el-icon>
        <input
          class="page-input"
          type="number"
          v-model.number="pageNum"
          min="1"
          :max="totalPage"
          @change="handlePageChange"
        />
        <el-icon :size="12" class="cursor-pointer" @click="handleNextPage">
          <ArrowRight />
        </el-icon>
        <el-icon :size="12" class="cursor-pointer" @click="handleNextPage(totalPage)">
          <DArrowRight />
        </el-icon>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, reactive, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { DArrowLeft, ArrowLeft, ArrowRight, DArrowRight } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array as PropType<ChartDataDao.ChartData>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<GroupStore.GroupOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  chartHeight: {
    type: Number,
    default: () => 0
  },
  chartWidth: {
    type: Number,
    default: () => 0
  },
  // 是否启用列平均分剩余宽度
  enableEqualWidth: {
    type: Boolean,
    default: true
  },
  // 固定列配置
  fixedColumns: {
    type: Object as PropType<{
      left?: number // 左侧固定列数
      right?: number // 右侧固定列数
    }>,
    default: () => ({})
  },
  // 图表配置
  chartConfig: {
    type: Object as PropType<{
      conditions?: Array<{
        conditionType: string
        conditionField: string
        conditionSymbol: string
        conditionValue: number
        conditionColor: string
      }>
    }>,
    default: () => ({})
  }
})

/**
 * @desc 表格高度
 */
const TABLEHEADERHEIGHT = 25

/**
 * @desc 分页高度
 */
const PAGINATIONHEIGHT = 25

/**
 * @desc 行高
 */
const ROWHEIGHT = 25

/**
 * @desc 当前页码
 */
const pageNum = ref(1)

/**
 * @desc 每页条数
 */
const pageSize = ref(0)

/**
 * @desc Canvas引用
 */
const canvasRef = ref<HTMLCanvasElement>()
const leftCanvasRef = ref<HTMLCanvasElement>()
const centerCanvasRef = ref<HTMLCanvasElement>()
const rightCanvasRef = ref<HTMLCanvasElement>()

/**
 * @desc Canvas上下文
 */
const ctx = ref<CanvasRenderingContext2D | null>()
const leftCtx = ref<CanvasRenderingContext2D | null>(null)
const centerCtx = ref<CanvasRenderingContext2D | null>(null)
const rightCtx = ref<CanvasRenderingContext2D | null>(null)

/**
 * @desc 订单 store
 */
const orderStore = useOrderStore()

/**
 * @desc 图表配置 store
 */
const chartsConfigStore = useChartConfigStore()

/**
 * @desc 表格头状态
 */
const tableHeaderState = reactive<TableChart.TableHeaderState>({
  tableHeader: []
})

/**
 * @desc 表格数据状态
 */
const tableDataState = reactive<TableChart.TableDataState>({
  tableData: []
})

/**
 * @desc 鼠标位置
 */
const mousePos = ref({ x: 0, y: 0 })

/**
 * @desc 是否正在拖拽
 */
const isDragging = ref(false)

/**
 * @desc 滚动位置
 */
const scrollPos = ref({ x: 0, y: 0 })

/**
 * @desc 表格总宽度
 */
const tableTotalWidth = ref(0)

/**
 * @desc 可视区域宽度
 */
const viewportWidth = ref(0)

// 计算属性
/**
 * @desc 总条数
 */
const total = computed(() => props.data.length)

/**
 * @desc 开始索引
 */
const startIndex = computed(() => (pageNum.value - 1) * pageSize.value + 1)

/**
 * @desc 结束索引
 */
const endIndex = computed(() => Math.min(pageNum.value * pageSize.value, total.value))

/**
 * @desc 总页数
 */
const totalPage = computed(() => Math.ceil(total.value / pageSize.value))

/**
 * @desc 分页数据
 */
const paginatedData = computed(() => {
  const start = (pageNum.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableDataState.tableData.slice(start, end)
})

/**
 * @desc 表格配置
 */
const tableChartConfig = computed(() => chartsConfigStore.chartConfig?.table)

/**
 * @desc 左侧固定列数
 */
const leftFixedCount = computed(() => props.fixedColumns.left || 0)

/**
 * @desc 右侧固定列数
 */
const rightFixedCount = computed(() => props.fixedColumns.right || 0)

/**
 * @desc 是否有固定列
 */
const hasFixedColumns = computed(() => leftFixedCount.value > 0 || rightFixedCount.value > 0)

/**
 * @desc 左侧固定列总宽度
 */
const leftFixedWidth = computed(() => {
  if (leftFixedCount.value === 0) return 0
  const columnWidths = calculateColumnWidths(tableTotalWidth.value)
  return columnWidths.slice(0, leftFixedCount.value).reduce((sum, width) => sum + width, 0)
})

/**
 * @desc 右侧固定列总宽度
 */
const rightFixedWidth = computed(() => {
  if (rightFixedCount.value === 0) return 0
  const columnWidths = calculateColumnWidths(tableTotalWidth.value)
  const startIndex = columnWidths.length - rightFixedCount.value
  return columnWidths.slice(startIndex).reduce((sum, width) => sum + width, 0)
})

/**
 * @desc 中间可滚动区域宽度
 */
const scrollableWidth = computed(() => {
  // 计算所有列的总宽度
  const allColumnWidths = calculateColumnWidths(viewportWidth.value)
  const totalColumns = allColumnWidths.length
  const scrollableStart = leftFixedCount.value
  const scrollableEnd = totalColumns - rightFixedCount.value

  // 计算中间列的总宽度
  const scrollableColumnsWidth = allColumnWidths
    .slice(scrollableStart, scrollableEnd)
    .reduce((sum, width) => sum + width, 0)

  // 计算可视区域中可用于中间列的宽度
  const availableWidth = viewportWidth.value - leftFixedWidth.value - rightFixedWidth.value

  // 如果中间列总宽度小于等于可用宽度，则不需要滚动，使用可用宽度
  // 如果中间列总宽度大于可用宽度，则需要滚动，使用实际宽度
  return Math.max(scrollableColumnsWidth, availableWidth)
})

/**
 * @desc 中间滚动容器的实际宽度
 */
const scrollableContainerWidth = computed(() => {
  return Math.max(scrollableWidth.value, viewportWidth.value - leftFixedWidth.value - rightFixedWidth.value)
})

/**
 * @desc 表格样式配置
 */
const tableStyles = {
  headerBg: '#f5f7fa',
  headerBorder: '#e4e7ed',
  headerText: '#606266',
  rowBg: '#ffffff',
  rowBgEven: '#fafafa',
  rowHoverBg: '#f5f7fa',
  border: '#ebeef5',
  text: '#606266',
  fontSize: 13,
  padding: 12
}

/**
 * @desc 初始化Canvas
 */
const initCanvas = () => {
  // 初始化左侧固定列Canvas
  if (leftCanvasRef.value && hasFixedColumns.value && leftFixedCount.value > 0) {
    const leftCanvas = leftCanvasRef.value
    leftCtx.value = leftCanvas.getContext('2d')
    if (leftCtx.value) {
      const container = leftCanvas.parentElement
      if (container) {
        // 直接计算左侧固定列宽度，避免循环依赖
        const columnWidths = calculateColumnWidths(viewportWidth.value)
        const width = columnWidths.slice(0, leftFixedCount.value).reduce((sum, w) => sum + w, 0)
        const height = container.clientHeight || 600
        const dpr = window.devicePixelRatio || 1
        leftCanvas.width = width * dpr
        leftCanvas.height = height * dpr
        leftCtx.value.scale(dpr, dpr)
        leftCanvas.style.width = width + 'px'
        leftCanvas.style.height = height + 'px'
      }
    }
  }

  // 初始化中间滚动区域Canvas
  if (centerCanvasRef.value) {
    const centerCanvas = centerCanvasRef.value
    centerCtx.value = centerCanvas.getContext('2d')
    if (centerCtx.value) {
      const container = centerCanvas.parentElement
      if (container) {
        // 使用计算好的中间区域宽度
        const columnWidths = calculateColumnWidths(viewportWidth.value)
        const leftWidth =
          leftFixedCount.value > 0 ? columnWidths.slice(0, leftFixedCount.value).reduce((sum, w) => sum + w, 0) : 0
        const rightWidth =
          rightFixedCount.value > 0
            ? columnWidths.slice(columnWidths.length - rightFixedCount.value).reduce((sum, w) => sum + w, 0)
            : 0

        const scrollableStart = leftFixedCount.value
        const scrollableEnd = columnWidths.length - rightFixedCount.value
        const scrollableColumnsWidth = columnWidths.slice(scrollableStart, scrollableEnd).reduce((sum, w) => sum + w, 0)
        const availableWidth = viewportWidth.value - leftWidth - rightWidth
        const width = Math.max(scrollableColumnsWidth, availableWidth)

        const height = container.clientHeight || 600
        const dpr = window.devicePixelRatio || 1
        centerCanvas.width = width * dpr
        centerCanvas.height = height * dpr
        centerCtx.value.scale(dpr, dpr)
        centerCanvas.style.width = width + 'px'
        centerCanvas.style.height = height + 'px'
      }
    }
  }

  // 初始化右侧固定列Canvas
  if (rightCanvasRef.value && hasFixedColumns.value && rightFixedCount.value > 0) {
    const rightCanvas = rightCanvasRef.value
    rightCtx.value = rightCanvas.getContext('2d')
    if (rightCtx.value) {
      const container = rightCanvas.parentElement
      if (container) {
        // 直接计算右侧固定列宽度，避免循环依赖
        const columnWidths = calculateColumnWidths(viewportWidth.value)
        const startIndex = columnWidths.length - rightFixedCount.value
        const width = columnWidths.slice(startIndex).reduce((sum, w) => sum + w, 0)
        const height = container.clientHeight || 600
        const dpr = window.devicePixelRatio || 1
        rightCanvas.width = width * dpr
        rightCanvas.height = height * dpr
        rightCtx.value.scale(dpr, dpr)
        rightCanvas.style.width = width + 'px'
        rightCanvas.style.height = height + 'px'
      }
    }
  }

  // 保持向后兼容
  if (canvasRef.value) {
    const canvas = canvasRef.value
    ctx.value = canvas.getContext('2d')
    if (ctx.value) {
      const container = canvas.parentElement
      if (container) {
        const width = container.clientWidth || 800
        const height = container.clientHeight || 600
        canvas.width = width
        canvas.height = height
      }
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const finalWidth = rect.width || 800
      const finalHeight = rect.height || 600
      canvas.width = finalWidth * dpr
      canvas.height = finalHeight * dpr
      ctx.value.scale(dpr, dpr)
      canvas.style.width = finalWidth + 'px'
      canvas.style.height = finalHeight + 'px'
    }
  }
}

/**
 * @desc 绘制文本
 */
const drawText = (
  text: string,
  x: number,
  y: number,
  options: {
    color?: string
    fontSize?: number
    fontWeight?: string
    textAlign?: CanvasTextAlign
    maxWidth?: number
    context?: CanvasRenderingContext2D | null
  } = {}
) => {
  const targetCtx = options.context || ctx.value
  if (!targetCtx) return

  const {
    color = tableStyles.text,
    fontSize = tableStyles.fontSize,
    fontWeight = 'normal',
    textAlign = 'left',
    maxWidth
  } = options

  targetCtx.fillStyle = color
  targetCtx.font = `${fontWeight} ${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  targetCtx.textAlign = textAlign
  targetCtx.textBaseline = 'middle'

  if (maxWidth) {
    // 文本截断
    let truncatedText = text
    while (targetCtx.measureText(truncatedText + '...').width > maxWidth && truncatedText.length > 0) {
      truncatedText = truncatedText.slice(0, -1)
    }
    if (truncatedText !== text) {
      truncatedText += '...'
    }
    targetCtx.fillText(truncatedText, x, y)
  } else {
    targetCtx.fillText(text, x, y)
  }
}

/**
 * @desc 绘制矩形
 */
const drawRect = (
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    fillColor?: string
    strokeColor?: string
    lineWidth?: number
    context?: CanvasRenderingContext2D | null
  } = {}
) => {
  const targetCtx = options.context || ctx.value
  if (!targetCtx) return

  const { fillColor, strokeColor, lineWidth = 1 } = options

  if (fillColor) {
    targetCtx.fillStyle = fillColor
    targetCtx.fillRect(x, y, width, height)
  }

  if (strokeColor) {
    targetCtx.strokeStyle = strokeColor
    targetCtx.lineWidth = lineWidth
    targetCtx.strokeRect(x, y, width, height)
  }
}

/**
 * @desc 绘制表格
 */
const drawTable = () => {
  console.log('开始绘制表格')
  console.log('表头数量:', tableHeaderState.tableHeader.length)
  console.log('数据数量:', paginatedData.value.length)

  if (tableHeaderState.tableHeader.length === 0 || paginatedData.value.length === 0) {
    console.log('表头或数据为空，退出绘制')
    return
  }

  // 获取容器宽度
  const container = centerCanvasRef.value?.parentElement?.parentElement
  if (!container) {
    console.log('找不到容器元素，使用默认宽度')
    viewportWidth.value = 800
  } else {
    const containerWidth = container.clientWidth || 800
    viewportWidth.value = containerWidth
    console.log('容器宽度:', containerWidth)
  }

  // 计算列宽
  const columnWidths = calculateColumnWidths(viewportWidth.value)
  const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0)
  console.log('列宽:', columnWidths)
  console.log('总宽度:', totalWidth)

  // 计算固定列宽度
  const leftWidth =
    leftFixedCount.value > 0 ? columnWidths.slice(0, leftFixedCount.value).reduce((sum, w) => sum + w, 0) : 0
  const rightWidth =
    rightFixedCount.value > 0
      ? columnWidths.slice(columnWidths.length - rightFixedCount.value).reduce((sum, w) => sum + w, 0)
      : 0

  // 计算中间列宽度
  const scrollableStart = leftFixedCount.value
  const scrollableEnd = columnWidths.length - rightFixedCount.value
  const scrollableColumnsWidth = columnWidths.slice(scrollableStart, scrollableEnd).reduce((sum, w) => sum + w, 0)

  // 计算可视区域中可用于中间列的宽度
  const availableWidth = viewportWidth.value - leftWidth - rightWidth

  // 确定中间区域的实际宽度
  const actualScrollableWidth = Math.max(scrollableColumnsWidth, availableWidth)

  // 更新表格总宽度
  tableTotalWidth.value = leftWidth + actualScrollableWidth + rightWidth

  console.log('左侧宽度:', leftWidth)
  console.log('右侧宽度:', rightWidth)
  console.log('中间列宽度:', scrollableColumnsWidth)
  console.log('可用宽度:', availableWidth)
  console.log('实际中间宽度:', actualScrollableWidth)
  console.log('表格总宽度:', tableTotalWidth.value)

  // 初始化Canvas
  initCanvas()

  // 绘制左侧固定列
  if (hasFixedColumns.value && leftFixedCount.value > 0 && leftCtx.value) {
    console.log('绘制左侧固定列')
    drawFixedColumns(columnWidths, 'left')
  }

  // 绘制中间滚动区域
  if (centerCtx.value) {
    console.log('绘制中间滚动区域')
    drawScrollableArea(columnWidths)
  }

  // 绘制右侧固定列
  if (hasFixedColumns.value && rightFixedCount.value > 0 && rightCtx.value) {
    console.log('绘制右侧固定列')
    drawFixedColumns(columnWidths, 'right')
  }
}

/**
 * @desc 绘制固定列
 */
const drawFixedColumns = (columnWidths: number[], position: 'left' | 'right') => {
  const ctx = position === 'left' ? leftCtx.value : rightCtx.value
  if (!ctx) return

  const container = position === 'left' ? leftCanvasRef.value?.parentElement : rightCanvasRef.value?.parentElement
  if (!container) return

  const containerHeight = container.clientHeight || 600
  const startIndex = position === 'left' ? 0 : columnWidths.length - rightFixedCount.value
  const endIndex = position === 'left' ? leftFixedCount.value : columnWidths.length
  const columns = tableHeaderState.tableHeader.slice(startIndex, endIndex)
  const widths = columnWidths.slice(startIndex, endIndex)

  // 清空画布
  const canvasWidth =
    position === 'left'
      ? columnWidths.slice(0, leftFixedCount.value).reduce((sum, w) => sum + w, 0)
      : columnWidths.slice(columnWidths.length - rightFixedCount.value).reduce((sum, w) => sum + w, 0)
  ctx.clearRect(0, 0, canvasWidth, containerHeight)

  // 绘制表头
  let x = 0
  columns.forEach((header, index) => {
    const width = widths[index]
    const headerText = header.displayName || header.alias || header.columnName

    // 绘制表头背景
    drawRect(x, 0, width, TABLEHEADERHEIGHT, {
      fillColor: tableStyles.headerBg,
      strokeColor: tableStyles.headerBorder,
      lineWidth: 1,
      context: ctx
    })

    // 绘制表头文本
    drawText(headerText, x + tableStyles.padding, TABLEHEADERHEIGHT / 2, {
      color: tableStyles.headerText,
      fontWeight: '500',
      maxWidth: width - tableStyles.padding * 2,
      context: ctx
    })

    x += width
  })

  // 绘制表格内容
  paginatedData.value.forEach((row: ChartDataDao.ChartData[number], rowIndex: number) => {
    const y = TABLEHEADERHEIGHT + rowIndex * ROWHEIGHT
    x = 0

    columns.forEach((header, colIndex) => {
      const width = widths[colIndex]
      const key = (header.alias || header.columnName || '') as string
      const cellText = key && row[key] != null ? String(row[key]) : ''

      // 绘制单元格背景
      const bgColor = rowIndex % 2 === 0 ? tableStyles.rowBg : tableStyles.rowBgEven
      drawRect(x, y, width, ROWHEIGHT, {
        fillColor: bgColor,
        strokeColor: tableStyles.border,
        lineWidth: 1,
        context: ctx
      })

      // 绘制单元格文本
      drawText(cellText, x + tableStyles.padding, y + ROWHEIGHT / 2, {
        maxWidth: width - tableStyles.padding * 2,
        context: ctx
      })

      x += width
    })
  })
}

/**
 * @desc 绘制可滚动区域
 */
const drawScrollableArea = (columnWidths: number[]) => {
  if (!centerCtx.value) return

  const container = centerCanvasRef.value?.parentElement
  if (!container) return

  const containerHeight = container.clientHeight || 600
  const startIndex = leftFixedCount.value
  const endIndex = columnWidths.length - rightFixedCount.value
  const columns = tableHeaderState.tableHeader.slice(startIndex, endIndex)
  const widths = columnWidths.slice(startIndex, endIndex)

  // 清空画布
  const scrollableCanvasWidth = columnWidths.slice(startIndex, endIndex).reduce((sum, w) => sum + w, 0)
  const leftWidth =
    leftFixedCount.value > 0 ? columnWidths.slice(0, leftFixedCount.value).reduce((sum, w) => sum + w, 0) : 0
  const rightWidth =
    rightFixedCount.value > 0
      ? columnWidths.slice(columnWidths.length - rightFixedCount.value).reduce((sum, w) => sum + w, 0)
      : 0
  const availableWidth = viewportWidth.value - leftWidth - rightWidth
  const actualCanvasWidth = Math.max(scrollableCanvasWidth, availableWidth)

  centerCtx.value.clearRect(0, 0, actualCanvasWidth, containerHeight)

  // 绘制表头
  let x = 0
  columns.forEach((header, index) => {
    const width = widths[index]
    const headerText = header.displayName || header.alias || header.columnName

    // 绘制表头背景
    drawRect(x, 0, width, TABLEHEADERHEIGHT, {
      fillColor: tableStyles.headerBg,
      strokeColor: tableStyles.headerBorder,
      lineWidth: 1,
      context: centerCtx.value
    })

    // 绘制表头文本
    drawText(headerText, x + tableStyles.padding, TABLEHEADERHEIGHT / 2, {
      color: tableStyles.headerText,
      fontWeight: '500',
      maxWidth: width - tableStyles.padding * 2,
      context: centerCtx.value
    })

    x += width
  })

  // 绘制表格内容
  paginatedData.value.forEach((row: ChartDataDao.ChartData[number], rowIndex: number) => {
    const y = TABLEHEADERHEIGHT + rowIndex * ROWHEIGHT
    x = 0

    columns.forEach((header, colIndex) => {
      const width = widths[colIndex]
      const key = (header.alias || header.columnName || '') as string
      const cellText = key && row[key] != null ? String(row[key]) : ''

      // 绘制单元格背景
      const bgColor = rowIndex % 2 === 0 ? tableStyles.rowBg : tableStyles.rowBgEven
      drawRect(x, y, width, ROWHEIGHT, {
        fillColor: bgColor,
        strokeColor: tableStyles.border,
        lineWidth: 1,
        context: centerCtx.value
      })

      // 绘制单元格文本
      drawText(cellText, x + tableStyles.padding, y + ROWHEIGHT / 2, {
        maxWidth: width - tableStyles.padding * 2,
        context: centerCtx.value
      })

      x += width
    })
  })
}

/**
 * @desc 计算列宽
 */
const calculateColumnWidths = (containerWidth: number): number[] => {
  const columns = tableHeaderState.tableHeader
  if (columns.length === 0) return []

  // 如果容器宽度为0，使用默认宽度
  const effectiveWidth = containerWidth || 800
  console.log('计算列宽，容器宽度:', effectiveWidth, '列数:', columns.length)

  // 如果启用平均分剩余宽度，则所有列宽度相等
  if (props.enableEqualWidth) {
    const equalWidth = effectiveWidth / columns.length
    console.log('平均分宽度模式，每列宽度:', equalWidth)
    return new Array(columns.length).fill(equalWidth)
  }

  // 计算每列的最小内容宽度
  const minContentWidths = columns.map((column) => {
    const headerText = column.displayName || column.alias || column.columnName
    const headerWidth = ctx.value?.measureText(headerText).width || 0

    // 计算数据列的最大宽度
    let maxDataWidth = headerWidth
    paginatedData.value.forEach((row: ChartDataDao.ChartData[number]) => {
      const key = (column.alias || column.columnName || '') as string
      const cellText = key && row[key] != null ? String(row[key]) : ''
      const cellWidth = ctx.value?.measureText(cellText).width || 0
      maxDataWidth = Math.max(maxDataWidth, cellWidth)
    })

    return maxDataWidth + tableStyles.padding * 2
  })

  // 计算所有列的最小总宽度
  const totalMinWidth = minContentWidths.reduce((sum, width) => sum + width, 0)

  // 在内容自适应模式下，如果内容总宽度大于容器宽度，则使用内容宽度
  // 如果内容总宽度小于容器宽度，则平均分配剩余宽度
  const finalWidth = Math.max(effectiveWidth, totalMinWidth)

  if (totalMinWidth < finalWidth) {
    const remainingWidth = finalWidth - totalMinWidth
    const extraWidthPerColumn = remainingWidth / columns.length

    return minContentWidths.map((minWidth) => minWidth + extraWidthPerColumn)
  }

  // 如果最小总宽度等于有效宽度，直接返回
  return minContentWidths
}

/**
 * @desc 绘制表头
 */
const drawTableHeader = (columnWidths: number[], totalWidth: number) => {
  let x = 0
  const y = 0

  tableHeaderState.tableHeader.forEach((header, index) => {
    const width = columnWidths[index]
    const headerText = header.displayName || header.alias || header.columnName

    // 绘制表头背景
    drawRect(x, y, width, TABLEHEADERHEIGHT, {
      fillColor: tableStyles.headerBg,
      strokeColor: tableStyles.headerBorder,
      lineWidth: 1
    })

    // 绘制表头文本
    drawText(headerText, x + tableStyles.padding, y + TABLEHEADERHEIGHT / 2, {
      color: tableStyles.headerText,
      fontWeight: '500',
      maxWidth: width - tableStyles.padding * 2
    })

    // 绘制排序图标
    if (header.orderType) {
      const iconX = x + width - tableStyles.padding - 10
      const iconY = y + TABLEHEADERHEIGHT / 2
      const iconText = header.orderType === 'asc' ? '▲' : '▼'
      drawText(iconText, iconX, iconY, {
        color: tableStyles.headerText,
        fontSize: 10
      })
    }

    x += width
  })
}

/**
 * @desc 绘制表格内容
 */
const drawTableBody = (columnWidths: number[], totalWidth: number) => {
  let x = 0
  let y = TABLEHEADERHEIGHT

  paginatedData.value.forEach((row: ChartDataDao.ChartData[number], rowIndex: number) => {
    const rowY = y + rowIndex * ROWHEIGHT

    // 绘制行背景
    const rowBgColor = rowIndex % 2 === 0 ? tableStyles.rowBg : tableStyles.rowBgEven
    drawRect(0, rowY, totalWidth, ROWHEIGHT, {
      fillColor: rowBgColor
    })

    // 绘制单元格
    x = 0
    tableHeaderState.tableHeader.forEach((header, colIndex) => {
      const width = columnWidths[colIndex]
      const key = (header.alias || header.columnName || '') as string
      const cellText = key && row[key] != null ? String(row[key]) : ''

      // 获取单元格样式
      const cellStyle = getComparedStyle(row, header)
      const cellColor = cellStyle.includes('color:')
        ? cellStyle.match(/color:\s*([^;]+)/)?.[1] || tableStyles.text
        : tableStyles.text

      // 绘制单元格文本
      drawText(cellText, x + tableStyles.padding, rowY + ROWHEIGHT / 2, {
        color: cellColor,
        maxWidth: width - tableStyles.padding * 2
      })

      // 绘制单元格边框
      drawRect(x, rowY, width, ROWHEIGHT, {
        strokeColor: tableStyles.border,
        lineWidth: 1
      })

      x += width
    })
  })
}

/**
 * @desc 绘制固定列阴影
 */
const drawFixedColumnShadows = (columnWidths: number[], totalWidth: number) => {
  if (!ctx.value || !canvasRef.value) return

  const canvas = canvasRef.value
  const height = canvas.height / (window.devicePixelRatio || 1)
  const shadowWidth = 8
  const shadowColor = 'rgba(0, 0, 0, 0.1)'

  // 绘制左侧固定列阴影
  if (leftFixedCount.value > 0) {
    const leftFixedEndX = leftFixedWidth.value
    const gradient = ctx.value.createLinearGradient(leftFixedEndX - shadowWidth, 0, leftFixedEndX, 0)
    gradient.addColorStop(0, shadowColor)
    gradient.addColorStop(1, 'transparent')

    ctx.value.fillStyle = gradient
    ctx.value.fillRect(leftFixedEndX - shadowWidth, 0, shadowWidth, height)
  }

  // 绘制右侧固定列阴影
  if (rightFixedCount.value > 0) {
    const rightFixedStartX = viewportWidth.value - rightFixedWidth.value
    const gradient = ctx.value.createLinearGradient(rightFixedStartX, 0, rightFixedStartX + shadowWidth, 0)
    gradient.addColorStop(0, 'transparent')
    gradient.addColorStop(1, shadowColor)

    ctx.value.fillStyle = gradient
    ctx.value.fillRect(rightFixedStartX, 0, shadowWidth, height)
  }
}

/**
 * @desc 获取比较样式
 */
const getComparedStyle = (
  tableDataOption: ChartDataDao.ChartData[number],
  tableHeaderOption: TableChart.TableHeaderOption
): string => {
  const conditions = props.chartConfig?.conditions || chartsConfigStore.getChartConfig?.table?.conditions
  if (!conditions) return ''

  const condition = conditions.find((c) => c.conditionField === tableHeaderOption.columnName)
  if (!condition) return ''

  const { conditionType, conditionSymbol, conditionValue, conditionColor } = condition

  const keyForValue = (tableHeaderOption.alias || tableHeaderOption.columnName || '') as string
  const currentValue = Number(tableDataOption[keyForValue] ?? 0)

  if (conditionType === '单色') {
    type ConditionSymbol = 'gt' | 'lt' | 'eq' | 'ne' | 'ge' | 'le' | 'between'
    const conditions: Record<ConditionSymbol, () => boolean> = {
      gt: () => currentValue > Number(conditionValue || 0),
      lt: () => currentValue < Number(conditionValue || 0),
      eq: () => currentValue === Number(conditionValue),
      ne: () => currentValue !== Number(conditionValue),
      ge: () => currentValue >= Number(conditionValue || 0),
      le: () => currentValue <= Number(conditionValue || 0),
      between: () => false // 传入的chartConfig不支持between条件
    }

    return conditions[conditionSymbol as ConditionSymbol]?.() ? `color: ${conditionColor}` : ''
  }

  if (conditionType === '色阶') {
    const keyForRow = (tableHeaderOption.alias || tableHeaderOption.columnName || '') as string
    const currentRowValueList = props.data.map((t) => Number(t[keyForRow] ?? 0))
    const maxValue = Math.max(...currentRowValueList)
    const minValue = Math.min(...currentRowValueList)
    const valueDif = maxValue - minValue

    if (valueDif === 0) return ''

    const [r, g, b] = conditionColor
      .replace(/rgb\(|\)/g, '')
      .split(',')
      .map(Number) as [number, number, number]
    const R = 256 - (256 - r) * ((currentValue - minValue) / valueDif)
    const G = 256 - (256 - g) * ((currentValue - minValue) / valueDif)
    const B = 256 - (256 - b) * ((currentValue - minValue) / valueDif)

    return `background-color: rgb(${R},${G},${B})`
  }

  return ''
}

/**
 * @desc 处理排序
 */
const handleEmitOrder = (tableHeaderOption: TableChart.TableHeaderOption) => {
  const orderTypes = ['asc', 'desc', null] as OrderStore.OrderType[]
  const currentIndex = orderTypes.indexOf(tableHeaderOption.orderType)
  tableHeaderOption.orderType = orderTypes[(currentIndex + 1) % 3]

  const order = orderStore.getOrders.find((o) => o.columnName === tableHeaderOption.columnName)
  const orderIndex = orderStore.getOrders.findIndex((o) => o.columnName === tableHeaderOption.columnName)

  if (order && !tableHeaderOption.orderType) {
    orderStore.removeOrder(orderIndex)
  } else if (order && tableHeaderOption.orderType) {
    order.orderType = tableHeaderOption.orderType
    orderStore.updateOrder({ order, index: orderIndex })
  } else if (!order && tableHeaderOption.orderType) {
    orderStore.addOrders([
      {
        ...tableHeaderOption,
        orderType: tableHeaderOption.orderType,
        aggregationType: 'raw'
      }
    ])
  }
}

/**
 * @desc 处理页码变化
 */
const handlePageChange = () => {
  if (pageNum.value < 1) pageNum.value = 1
  if (pageNum.value > totalPage.value) pageNum.value = totalPage.value
}

/**
 * @desc 处理上一页
 */
const handlePreviousPage = (page?: number) => {
  if (page === 1) {
    pageNum.value = 1
  } else {
    pageNum.value = Math.max(1, pageNum.value - 1)
  }
}

/**
 * @desc 处理下一页
 */
const handleNextPage = (page?: number) => {
  if (page && page === totalPage.value) {
    pageNum.value = page
  } else {
    pageNum.value = Math.min(totalPage.value, pageNum.value + 1)
  }
}

/**
 * @desc 计算每页条数
 */
const calculatePageSize = () => {
  console.log('计算页面大小')
  console.log('chartHeight:', props.chartHeight)
  console.log('TABLEHEADERHEIGHT:', TABLEHEADERHEIGHT)
  console.log('PAGINATIONHEIGHT:', PAGINATIONHEIGHT)

  const availableHeight = props.chartHeight - TABLEHEADERHEIGHT - PAGINATIONHEIGHT - 10
  console.log('可用高度:', availableHeight)

  pageSize.value = Math.max(1, Math.floor(availableHeight / ROWHEIGHT))
  console.log('页面大小:', pageSize.value)
}

/**
 * @desc 初始化表格头
 */
const initTableHeader = () => {
  console.log('初始化表格头')
  console.log('xAxisFields:', props.xAxisFields)
  console.log('yAxisFields:', props.yAxisFields)

  const fields = [...props.xAxisFields, ...props.yAxisFields]
  console.log('合并后的字段:', fields)

  tableHeaderState.tableHeader = fields.map((field) => {
    const currentOrder = orderStore.getOrders.find((o) => o.columnName === field.columnName)
    return {
      ...field,
      orderType: currentOrder?.orderType || 'asc',
      aggregationType: currentOrder?.aggregationType || 'raw'
    }
  })

  console.log('初始化后的表头:', tableHeaderState.tableHeader)
}

/**
 * @desc 初始化表格数据
 */
const initTableData = () => {
  console.log('初始化表格数据')
  console.log('props.data:', props.data)
  tableDataState.tableData = props.data
  console.log('初始化后的数据:', tableDataState.tableData)
}

/**
 * @desc 处理左侧Canvas点击事件
 */
const handleLeftCanvasClick = (event: MouseEvent) => {
  handleCanvasClick(event, 'left')
}

/**
 * @desc 处理中间Canvas点击事件
 */
const handleCenterCanvasClick = (event: MouseEvent) => {
  handleCanvasClick(event, 'center')
}

/**
 * @desc 处理右侧Canvas点击事件
 */
const handleRightCanvasClick = (event: MouseEvent) => {
  handleCanvasClick(event, 'right')
}

/**
 * @desc 处理Canvas点击事件
 */
const handleCanvasClick = (event: MouseEvent, canvasType: 'left' | 'center' | 'right') => {
  const canvas =
    canvasType === 'left' ? leftCanvasRef.value : canvasType === 'center' ? centerCanvasRef.value : rightCanvasRef.value

  if (!canvas) return

  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top

  // 检查是否点击了表头
  if (y <= TABLEHEADERHEIGHT) {
    const columnWidths = calculateColumnWidths(viewportWidth.value)
    let currentX = 0
    let startIndex = 0

    // 根据Canvas类型确定列的范围
    if (canvasType === 'left') {
      startIndex = 0
    } else if (canvasType === 'center') {
      startIndex = leftFixedCount.value
    } else if (canvasType === 'right') {
      startIndex = columnWidths.length - rightFixedCount.value
    }

    const endIndex =
      canvasType === 'left'
        ? leftFixedCount.value
        : canvasType === 'center'
          ? columnWidths.length - rightFixedCount.value
          : columnWidths.length

    for (let i = startIndex; i < endIndex; i++) {
      const width = columnWidths[i]
      if (x >= currentX && x <= currentX + width) {
        handleEmitOrder(tableHeaderState.tableHeader[i])
        break
      }
      currentX += width
    }
  }
}

/**
 * @desc 处理Canvas鼠标移动事件
 */
const handleCanvasMouseMove = (event: MouseEvent) => {
  if (!canvasRef.value) return

  const rect = canvasRef.value.getBoundingClientRect()
  mousePos.value = {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  }

  // 更新鼠标样式
  if (mousePos.value.y <= TABLEHEADERHEIGHT) {
    canvasRef.value.style.cursor = 'pointer'
  } else {
    canvasRef.value.style.cursor = 'default'
  }
}

/**
 * @desc 处理容器滚动事件
 */
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  scrollPos.value.x = target.scrollLeft
  scrollPos.value.y = target.scrollTop

  // 重新绘制表格以更新固定列位置
  nextTick(() => drawTable())
}

// 监听器
/**
 * @desc 监听表格配置
 */
watch(
  () => tableChartConfig.value?.conditions,
  () => {
    calculatePageSize()
    nextTick(() => drawTable())
  },
  { deep: true }
)

/**
 * @desc 监听数据
 */
watch(
  () => props.data,
  async () => {
    await initTableHeader()
    await initTableData()
    calculatePageSize()
    nextTick(() => drawTable())
  },
  { deep: true }
)

/**
 * @desc 监听表格高度
 */
watch(
  () => props.chartHeight,
  () => {
    calculatePageSize()
    nextTick(() => {
      initCanvas()
      drawTable()
    })
  }
)

/**
 * @desc 监听表格宽度
 */
watch(
  () => props.chartWidth,
  () => {
    nextTick(() => {
      initCanvas()
      drawTable()
    })
  }
)

/**
 * @desc 监听分页数据
 */
watch(
  () => paginatedData.value,
  () => {
    nextTick(() => drawTable())
  }
)

/**
 * @desc 监听表格头
 */
watch(
  () => tableHeaderState.tableHeader,
  () => {
    nextTick(() => drawTable())
  },
  { deep: true }
)

/**
 * @desc 监听平均分宽度配置
 */
watch(
  () => props.enableEqualWidth,
  () => {
    nextTick(() => drawTable())
  }
)

/**
 * @desc 监听固定列配置
 */
watch(
  () => props.fixedColumns,
  () => {
    nextTick(() => drawTable())
  },
  { deep: true }
)

/**
 * @desc 初始化
 */
onMounted(async () => {
  await initTableHeader()
  await initTableData()
  calculatePageSize()

  nextTick(() => {
    initCanvas()
    drawTable()

    // Canvas已经通过Vue事件绑定处理点击事件
  })
})

/**
 * @desc 清理 - Vue会自动处理事件清理
 */
onUnmounted(() => {
  // Vue会自动清理事件监听器
})
</script>

<style scoped lang="scss">
.canvas-table-chart {
  display: flex;
  flex-direction: column;
  height: 100%;

  .table-layout {
    flex: 1;
    display: flex;
    position: relative;

    .fixed-left {
      position: relative;
      z-index: 10;
      background: white;
      border-right: 1px solid #e4e7ed;
    }

    .scroll-container {
      flex: 1;
      overflow: auto;
      position: relative;
      min-width: 0; // 允许flex子项收缩

      .scroll-wrapper {
        position: relative;
        height: 100%;
        min-width: 100%; // 确保至少占满容器宽度
      }

      .scroll-canvas {
        display: block;
        height: 100%;
      }
    }

    .fixed-right {
      position: relative;
      z-index: 10;
      background: white;
      border-left: 1px solid #e4e7ed;
    }

    .fixed-canvas {
      display: block;
      height: 100%;
    }
  }

  .pagination {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 8px 0;
    font-size: 13px;
    color: #606266;

    .pagination-info {
      margin-right: 16px;
    }

    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 8px;

      .el-icon {
        cursor: pointer;
        color: #606266;
        transition: color 0.2s;

        &:hover {
          color: #409eff;
        }
      }

      .page-input {
        width: 40px;
        height: 24px;
        text-align: center;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        color: #606266;
        transition: all 0.2s;

        &:focus {
          border-color: #409eff;
          outline: none;
        }

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }
  }
}
</style>
