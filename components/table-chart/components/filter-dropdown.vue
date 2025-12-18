<template>
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
</template>

<script setup lang="ts">
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { filterColumns, handleTableData } from '../data-handler'
import { rebuildGroups, stageVars } from '../stage-handler'
import { getDropdownPosition } from '../utils'
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

interface Emits {
  (event: 'update-positions-in-table'): void
}

const emits = defineEmits<Emits>()

// // 获取依赖
// const { filterState, handleTableData, tableVars } = variableHandlder({ props: props.props })
// const { clearGroups } = konvaStageHandler({ props: props.props })

/**
 * 过滤下拉浮层元素
 */
const filterDropdownRef = ref<HTMLDivElement | null>(null)

/**
 * 过滤下拉浮层状态（DOM）
 */
const filterDropdown = reactive<FilterDropdown>({
  visible: false,
  x: 0,
  y: 0,
  colName: '',
  options: [],
  selectedValues: [],
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
 * 关闭过滤下拉浮层
 */
const closeFilterDropdown = () => {
  if (!filterDropdown.visible) return
  filterDropdown.visible = false
}

/**
 * 滚动事件处理函数
 */
const updatePositions = () => {
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
 * @param {KonvaEventObject<MouseEvent, Konva.Shape>} event 事件对象
 * @param {string} colName 列名
 * @param {string[]} options 选项列表
 * @param {string[]} selected 已选中的选项
 */
const openFilterDropdown = (
  event: KonvaEventObject<MouseEvent, Konva.Shape>,
  colName: string,
  options: string[],
  selected: string[]
) => {
  // 存储原始点击位置（转换为页面坐标，考虑滚动偏移）
  const { clientX, clientY } = event.evt
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
  })
}

/**
 * 点击外部关闭（允许点击 Element Plus 下拉面板）
 * @param 「MouseEvent mouseEvent 鼠标事件
 * @param {HTMLElement | null} target 目标元素
 * @returns {void}
 */
const onGlobalMousedown = (mouseEvent: MouseEvent) => {
  if (stageVars.stage) stageVars.stage.setPointersPositions(mouseEvent)
  const target = mouseEvent.target as HTMLElement | null
  if (!target) return

  if (!filterDropdown.visible) return
  const panel = filterDropdownRef.value

  if (panel && panel.contains(target)) return
  const inElSelectDropdown = target.closest('.el-select-dropdown, .el-select__popper')
  if (!inElSelectDropdown) {
    filterDropdown.visible = false
  }
}

/**
 * 应用过滤下拉浮层选中的选项
 */
const handleSelectedFilter = () => {
  const colName = filterDropdown.colName
  const selectedValues = filterDropdown.selectedValues
  if (!selectedValues || selectedValues.length === 0) {
    const filterItem = filterColumns.value.find((f) => f.columnName === colName)
    if (filterItem) {
      filterItem.values.clear()
    }
  } else {
    const filterItem = filterColumns.value.find((f) => f.columnName === colName)
    if (filterItem) {
      filterItem.values = new Set(selectedValues)
    }
  }
  // 重新处理表格数据，应用过滤条件
  handleTableData()
  rebuildGroups()
}

/**
 * 初始化事件监听器
 */
const initListeners = () => {
  window.addEventListener('scroll', updatePositions)
  document.addEventListener('scroll', updatePositions)
  document.addEventListener('mousedown', onGlobalMousedown, true)
}

/**
 * 清理事件监听器
 */
const cleanupListeners = () => {
  window.removeEventListener('scroll', updatePositions)
  document.removeEventListener('scroll', updatePositions)
  document.removeEventListener('mousedown', onGlobalMousedown, true)
}

// 生命周期
onMounted(() => {
  initListeners()
})

onBeforeUnmount(() => {
  cleanupListeners()
})

// 暴露方法供外部使用
defineExpose({
  openFilterDropdown,
  closeFilterDropdown,
  updatePositions
})
</script>

<style lang="scss" scoped>
.dms-filter-dropdown {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  padding: 5px 8px;
  border-radius: 4px;
}
</style>
