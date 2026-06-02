<template>
  <teleport to="body">
    <div
      ref="filterDropdownRef"
      v-show="filterDropdown.visible"
      class="dms-filter-dropdown"
      :style="filterDropdownStyle"
      @click.stop
      @mousedown.stop
    >
      <div class="dms-filter-dropdown__header">
        <span class="dms-filter-dropdown__title">{{ filterDropdown.colName }}</span>
        <span class="dms-filter-dropdown__count">已选 {{ filterDropdown.selectedValues.length }}</span>
      </div>

      <input
        ref="searchInputRef"
        v-model="searchKeyword"
        class="dms-filter-dropdown__search"
        type="search"
        placeholder="搜索过滤值"
        @keydown.stop
        @keydown.esc.stop="closeFilterDropdown"
      />

      <div class="dms-filter-dropdown__list">
        <label v-for="opt in filteredOptions" :key="opt" class="dms-filter-dropdown__option">
          <input type="checkbox" :value="opt" v-model="filterDropdown.selectedValues" @change="handleSelectedFilter" />
          <span class="dms-filter-dropdown__option-label">{{ formatFilterOptionLabel(opt) }}</span>
        </label>
        <div v-if="filteredOptions.length === 0" class="dms-filter-dropdown__empty">无匹配项</div>
      </div>

      <div class="dms-filter-dropdown__footer">
        <button type="button" class="dms-filter-dropdown__btn" @click="handleClearFilter">清空</button>
        <button type="button" class="dms-filter-dropdown__btn is-primary" @click="closeFilterDropdown">完成</button>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { handleTableData, updateColumnFilter } from '../data-handler'
import { measureTablePerf } from '../perf'
import { type CanvasTableContext, runWithTableContext } from '../parameter'
import { refreshTable, stageVars } from '../stage-handler'
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

const filterDropdownRef = ref<HTMLDivElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const searchKeyword = ref('')
const tableContext = shallowRef<CanvasTableContext | null>(null)
let ignoreOutsideMouseDownUntil = 0

const runInTableContext = (handler: () => void) => {
  if (tableContext.value) {
    runWithTableContext(tableContext.value, handler)
    return
  }

  handler()
}

const setTableContext = (context: CanvasTableContext) => {
  tableContext.value = context
}

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

const filterDropdownStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${filterDropdown.x}px`,
  top: `${filterDropdown.y}px`,
  zIndex: 3000
}))

const filteredOptions = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  if (!keyword) return filterDropdown.options

  return filterDropdown.options.filter((option) => {
    const label = formatFilterOptionLabel(option).toLowerCase()
    return label.includes(keyword)
  })
})

const formatFilterOptionLabel = (option: string) => (option === '' ? '(空)' : option)

const closeFilterDropdown = () => {
  if (!filterDropdown.visible) return
  filterDropdown.visible = false
  searchKeyword.value = ''
}

const updatePositions = () => {
  if (!filterDropdown.visible || !filterDropdownRef.value) return

  const filterDropdownElRect = filterDropdownRef.value.getBoundingClientRect()
  const filterDropdownElHeight = Math.ceil(filterDropdownElRect.height)
  const filterDropdownElWidth = Math.ceil(filterDropdownElRect.width)
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop
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

const openFilterDropdown = (
  event: KonvaEventObject<MouseEvent, Konva.Shape>,
  colName: string,
  options: string[],
  selected: string[]
) => {
  const { clientX, clientY } = event.evt
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop

  filterDropdown.originalClientX = clientX + scrollX
  filterDropdown.originalClientY = clientY + scrollY
  filterDropdown.colName = colName
  filterDropdown.options = options
  filterDropdown.selectedValues = [...selected]
  searchKeyword.value = ''
  ignoreOutsideMouseDownUntil = Date.now() + 300
  filterDropdown.visible = true

  nextTick(() => {
    if (!filterDropdownRef.value) return

    const filterDropdownElRect = filterDropdownRef.value.getBoundingClientRect()
    const { dropdownX, dropdownY } = getDropdownPosition(
      clientX,
      clientY,
      Math.ceil(filterDropdownElRect.width),
      Math.ceil(filterDropdownElRect.height)
    )

    filterDropdown.x = dropdownX
    filterDropdown.y = dropdownY
    searchInputRef.value?.focus()
  })
}

const onGlobalMousedown = (mouseEvent: MouseEvent) => {
  runInTableContext(() => {
    if (Date.now() < ignoreOutsideMouseDownUntil) return
    if (stageVars.stage) stageVars.stage.setPointersPositions(mouseEvent)

    const target = mouseEvent.target as HTMLElement | null
    if (!target || !filterDropdown.visible) return

    if (filterDropdownRef.value?.contains(target)) return

    closeFilterDropdown()
  })
}

const handleSelectedFilter = () => {
  runInTableContext(() => {
    measureTablePerf('applyFilter', () => {
      updateColumnFilter(filterDropdown.colName, filterDropdown.selectedValues || [])
      handleTableData()
      refreshTable(true)
    })
  })
}

const handleClearFilter = () => {
  filterDropdown.selectedValues = []
  handleSelectedFilter()
}

const initListeners = () => {
  window.addEventListener('scroll', updatePositions, true)
  document.addEventListener('scroll', updatePositions, true)
  document.addEventListener('mousedown', onGlobalMousedown, true)
}

const cleanupListeners = () => {
  window.removeEventListener('scroll', updatePositions, true)
  document.removeEventListener('scroll', updatePositions, true)
  document.removeEventListener('mousedown', onGlobalMousedown, true)
}

onMounted(() => {
  initListeners()
})

onBeforeUnmount(() => {
  cleanupListeners()
})

defineExpose({
  setTableContext,
  openFilterDropdown,
  closeFilterDropdown,
  updatePositions
})
</script>

<style lang="scss" scoped>
.dms-filter-dropdown {
  width: 220px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  box-sizing: border-box;
}

.dms-filter-dropdown__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.dms-filter-dropdown__title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dms-filter-dropdown__count {
  flex-shrink: 0;
  font-size: 12px;
  color: #64748b;
}

.dms-filter-dropdown__search {
  width: 100%;
  box-sizing: border-box;
  height: 30px;
  margin-bottom: 8px;
  padding: 0 8px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  outline: none;

  &:focus {
    border-color: #409eff;
  }
}

.dms-filter-dropdown__list {
  max-height: 240px;
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 0;
  margin-bottom: 8px;
}

.dms-filter-dropdown__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  color: #334155;

  &:hover {
    background: #f8fafc;
  }

  input {
    margin: 0;
    flex-shrink: 0;
  }
}

.dms-filter-dropdown__option-label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dms-filter-dropdown__empty {
  padding: 12px 10px;
  text-align: center;
  color: #94a3b8;
  font-size: 12px;
}

.dms-filter-dropdown__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dms-filter-dropdown__btn {
  height: 28px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  color: #334155;
  font-size: 12px;
  cursor: pointer;

  &.is-primary {
    border-color: #409eff;
    background: #409eff;
    color: #fff;
  }
}
</style>
