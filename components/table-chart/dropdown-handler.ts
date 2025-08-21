import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, reactive, ref } from 'vue'

export const dropDownHandler = function ({
  clearGroups,
  rebuildGroups,
  hoveredRowIndex,
  hoveredColIndex,
  createOrUpdateHoverRects,
  stage
}: {
  clearGroups: () => void
  rebuildGroups: () => void
  hoveredRowIndex: number | null
  hoveredColIndex: number | null
  createOrUpdateHoverRects: () => void
  stage: Konva.Stage | null
}) {
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

  // 汇总行下拉状态（DOM）
  const summaryDropdown = reactive({
    visible: false,
    x: 0,
    y: 0,
    colName: '' as string,
    options: [] as Array<{ label: string; value: string }>,
    selectedValue: '' as string
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
   * 汇总下拉浮层样式
   */
  const summaryDropdownStyle = computed(() => {
    return {
      position: 'fixed',
      left: summaryDropdown.x + 'px',
      top: summaryDropdown.y + 'px',
      zIndex: String(3000)
    } as Record<string, string>
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
    evt: KonvaEventObject<MouseEvent, Konva.Circle>,
    colName: string,
    options: string[],
    selected: string[]
  ) => {
    filterDropdown.visible = true

    if (!filterDropdownRef.value) return
    const filterDropdownEl = filterDropdownRef.value
    if (!filterDropdownEl) return
    nextTick(() => {
      const filterDropdownElRect = filterDropdownEl.getBoundingClientRect()
      const filterDropdownElHeight = Math.ceil(filterDropdownElRect.height)
      const filterDropdownElWidth = Math.ceil(filterDropdownElRect.width)
      const { clientX, clientY } = evt.evt
      const { dropdownX, dropdownY } = getWapperPosition(
        clientX,
        clientY,
        filterDropdownElWidth,
        filterDropdownElHeight
      )
      filterDropdown.x = dropdownX
      filterDropdown.y = dropdownY
      filterDropdown.colName = colName
      filterDropdown.options = options
      filterDropdown.selectedValues = [...selected]
      // 打开下拉时取消 hover 高亮，避免视觉干扰
      hoveredRowIndex = null
      hoveredColIndex = null
      createOrUpdateHoverRects()
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
    summaryDropdown.visible = true
    if (!summaryDropdownRef.value) return
    const summaryDropdownEl = summaryDropdownRef.value
    if (!summaryDropdownEl) return
    nextTick(() => {
      const summaryDropdownElRect = summaryDropdownEl.getBoundingClientRect()
      const summaryDropdownElHeight = Math.ceil(summaryDropdownElRect.height)
      const summaryDropdownElWidth = Math.ceil(summaryDropdownElRect.width)
      const { clientX, clientY } = evt.evt
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
      createOrUpdateHoverRects()
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

  return {
    filterState,
    summaryState,
    filterDropdown,
    summaryDropdown,
    filterDropdownRef,
    summaryDropdownRef,
    filterDropdownStyle,
    summaryDropdownStyle,
    getWapperPosition,
    openFilterDropdown,
    closeFilterDropdown,
    openSummaryDropdown,
    closeSummaryDropdown,
    handleSelectedSummary,
    handleSelectedFilter,
    onGlobalMousedown
  }
}
