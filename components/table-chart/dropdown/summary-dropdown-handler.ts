import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, reactive, ref, type ExtractPropTypes } from 'vue'
import { konvaStageHandler } from '../konva-stage-handler'
import { chartProps } from '../props'
import { getDropdownPosition } from '../utils'
import { variableHandlder, type Prettify } from '../variable-handlder'
interface SummaryDropdownOption {
  label: string
  value: string
}

export interface SummaryDropdown {
  visible: boolean
  x: number
  y: number
  colName: string
  options: Array<SummaryDropdownOption>
  selectedValue: string
  originalClientX: number
  originalClientY: number
}

/**
 * 汇总行下拉状态
 */
export const summaryDropdown = reactive<SummaryDropdown>({
  visible: false,
  x: 0,
  y: 0,
  colName: '',
  options: [],
  selectedValue: '',
  // 存储原始点击位置，用于滚动时重新计算
  originalClientX: 0,
  originalClientY: 0
})

/**
 * 汇总下拉浮层元素
 */
const summaryDropdownRef = ref<HTMLDivElement | null>(null)

interface SummaryDropdownHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

/**
 * 汇总下拉浮层处理函数
 * @param {SummaryDropdownHandlerProps} props 组件 props
 * @returns 汇总下拉浮层处理函数
 */
export const summaryDropDownHandler = ({ props }: SummaryDropdownHandlerProps) => {
  const { clearGroups } = konvaStageHandler({ props })

  // 注释高亮功能以提升性能
  // const { updateHoverRects } = highlightHandler({ props })

  const { summaryState, tableVars } = variableHandlder({ props })

  const summaryRowHeight = computed(() => (props.enableSummary ? props.summaryRowHeight : 0))

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
   * 更新汇总下拉浮层位置
   */
  const updateSummaryDropdownPositionsInTable = () => {
    // 本次开发先隐藏掉
    if (summaryDropdown.visible && summaryDropdownRef.value) {
      summaryDropdown.visible = false
    }
    // // 如果汇总下拉框可见，重新计算位置
    // if (summaryDropdown.visible && summaryDropdownRef.value) {
    //   const summaryDropdownElRect = summaryDropdownRef.value.getBoundingClientRect()
    //   const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
    //   const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)

    //   // 对于表格内部滚动，使用保存的原始客户端坐标
    //   const { dropdownX, dropdownY } = getDropdownPosition(
    //     summaryDropdown.originalClientX,
    //     summaryDropdown.originalClientY,
    //     summaryDropdownElWidth,
    //     summaryDropdownElHeight
    //   )
    //   summaryDropdown.x = dropdownX
    //   summaryDropdown.y = dropdownY
    // }
  }

  /**
   * 关闭汇总下拉
   * @returns {void}
   */
  const closeSummaryDropdown = () => {
    summaryDropdown.visible = false
  }

  /**
   *
   */
  const updateSummaryDropdownPositionsInPage = () => {
    // 本次开发先隐藏掉
    if (summaryDropdown.visible && summaryDropdownRef.value) {
      summaryDropdown.visible = false
    }
    // // 如果汇总下拉框可见，重新计算位置
    // if (summaryDropdown.visible && summaryDropdownRef.value) {
    //   const summaryDropdownElRect = summaryDropdownRef.value.getBoundingClientRect()
    //   const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
    //   const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)

    //   // 获取当前滚动偏移量
    //   const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    //   const scrollY = window.pageYOffset || document.documentElement.scrollTop

    //   // 将保存的页面坐标转换为当前的视口坐标
    //   const currentClientX = summaryDropdown.originalClientX - scrollX
    //   const currentClientY = summaryDropdown.originalClientY - scrollY

    //   const { dropdownX, dropdownY } = getDropdownPosition(
    //     currentClientX,
    //     currentClientY,
    //     summaryDropdownElWidth,
    //     summaryDropdownElHeight
    //   )
    //   summaryDropdown.x = dropdownX
    //   summaryDropdown.y = dropdownY
    // }
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
    options: Array<SummaryDropdownOption>,
    selected?: string
  ) => {
    // 存储原始点击位置（转换为页面坐标，考虑滚动偏移）
    const { clientX, clientY } = evt.evt
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft
    const scrollY = window.pageYOffset || document.documentElement.scrollTop
    summaryDropdown.originalClientX = clientX + scrollX
    summaryDropdown.originalClientY = clientY + scrollY
    summaryDropdown.visible = true
    nextTick(() => {
      if (!summaryDropdownRef.value) return
      const summaryDropdownEl = summaryDropdownRef.value
      if (!summaryDropdownEl) return
      const summaryDropdownElRect = summaryDropdownEl.getBoundingClientRect()
      const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
      const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)
      const { dropdownX, dropdownY } = getDropdownPosition(
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
      // 注释高亮重置以提升性能
      // tableVars.hoveredRowIndex = null
      // tableVars.hoveredColIndex = null
      // updateHoverRects()
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
    // 通过全局指针调用，避免 import 循环
    tableVars.rebuildGroupsFn && tableVars.rebuildGroupsFn()
    // 选择后关闭弹框
    summaryDropdown.visible = false
  }

  /**
   * 点击外部关闭（允许点击 Element Plus 下拉面板）
   * @param e 鼠标事件
   * @returns {void}
   */
  const onGlobalMousedown = (e: MouseEvent) => {
    if (tableVars.stage) tableVars.stage.setPointersPositions(e)

    const target = e.target as HTMLElement | null
    if (!target) return

    if (!summaryDropdown.visible) return
    const panelSummary = summaryDropdownRef.value
    // 点击自身面板内：不关闭
    if (panelSummary && panelSummary.contains(target)) return
    const inElSelectDropdown = target.closest('.el-select-dropdown, .el-select__popper')
    if (!inElSelectDropdown) {
      summaryDropdown.visible = false
    }
  }

  /**
   * 初始化事件监听器
   */
  const initSummaryDropdownListeners = () => {
    window.addEventListener('mousedown', onGlobalMousedown, true)
    // 添加滚动监听器，监听页面滚动
    window.addEventListener('scroll', updateSummaryDropdownPositionsInPage)
    document.addEventListener('scroll', updateSummaryDropdownPositionsInPage)
  }

  /**
   * 清理事件监听器
   */
  const cleanupSummaryDropdownListeners = () => {
    window.removeEventListener('mousedown', onGlobalMousedown, true)
    window.removeEventListener('scroll', updateSummaryDropdownPositionsInPage)
    document.removeEventListener('scroll', updateSummaryDropdownPositionsInPage)
  }

  return {
    summaryDropdownStyle,
    summaryDropdownRef,
    summaryDropdown,
    updateSummaryDropdownPositionsInPage,
    updateSummaryDropdownPositionsInTable,
    closeSummaryDropdown,
    summaryRowHeight,
    openSummaryDropdown,
    handleSelectedSummary,
    initSummaryDropdownListeners,
    cleanupSummaryDropdownListeners
  }
}
