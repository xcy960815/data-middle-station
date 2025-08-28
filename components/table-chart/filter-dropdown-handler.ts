import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, reactive, ref } from 'vue'
import { getDropdownPosition } from './utils'
import { tableVars } from './variable'

export interface FilterDropdown {
  visible: boolean
  x: number
  y: number
  colName: string
  options: string[]
  selectedValues: string[]
  originalClientX: number
  originalClientY: number
}

interface FilterDropdownHandlerProps {
  updateHoverRects: () => void
  // clearGroups: () => void
  // rebuildGroups: () => void
}

export const filterDropdownHandler = ({
  // rebuildGroups,
  // clearGroups,
  updateHoverRects
}: FilterDropdownHandlerProps) => {
  /**
   * 过滤下拉浮层元素
   */
  const filterDropdownRef = ref<HTMLDivElement | null>(null)

  /**
   * 过滤状态：列名 -> 选中的离散值集合（使用 Set 便于判定）
   */
  const filterState = reactive<Record<string, Set<string>>>({})

  /**
   * 过滤下拉浮层状态（DOM）
   */
  const filterDropdown = reactive<FilterDropdown>({
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
   * 更新过滤下拉浮层位置（用于表格内部滚动）
   */
  const updateFilterDropdownPositionsInTable = () => {
    // 本次开发先隐藏掉
    if (filterDropdown.visible && filterDropdownRef.value) {
      filterDropdown.visible = false
    }
    // // 如果过滤下拉框可见，重新计算位置
    // if (filterDropdown.visible && filterDropdownRef.value) {
    //   const filterDropdownElRect = filterDropdownRef.value.getBoundingClientRect()
    //   const filterDropdownElHeight = Math.ceil(filterDropdownElRect.height)
    //   const filterDropdownElWidth = Math.ceil(filterDropdownElRect.width)
    //   // 对于表格内部滚动，使用保存的原始客户端坐标
    //   const { dropdownX, dropdownY } = getDropdownPosition(
    //     filterDropdown.originalClientX,
    //     filterDropdown.originalClientY,
    //     filterDropdownElWidth,
    //     filterDropdownElHeight
    //   )
    //   filterDropdown.x = dropdownX
    //   filterDropdown.y = dropdownY
    // }
  }

  /**
   * 关闭过滤下拉浮层
   */
  const closeFilterDropdown = () => {
    filterDropdown.visible = false
  }

  /**
   * 滚动事件处理函数
   */
  const updateFilterDropdownPositionsInPage = () => {
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

      const { dropdownX, dropdownY } = getDropdownPosition(
        currentClientX,
        currentClientY,
        filterDropdownElWidth,
        filterDropdownElHeight
      )
      filterDropdown.x = dropdownX
      filterDropdown.y = dropdownY
    }
  }

  /**
   * 打开过滤下拉浮层
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
      const { dropdownX, dropdownY } = getDropdownPosition(
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
      tableVars.hoveredRowIndex = null
      tableVars.hoveredColIndex = null
      updateHoverRects()
    })
  }

  return {
    filterState,
    filterDropdownRef,
    filterDropdownStyle,
    filterDropdown,
    updateFilterDropdownPositionsInTable,
    updateFilterDropdownPositionsInPage,
    closeFilterDropdown,
    openFilterDropdown
  }
}
