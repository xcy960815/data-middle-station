<template>
  <teleport to="body">
    <div
      ref="summaryDropdownRef"
      v-show="summaryDropdown.visible"
      class="dms-summary-dropdown"
      :style="summaryDropdownStyle"
      @click.stop
      @mousedown.stop
    >
      <div class="dms-summary-dropdown__header">
        <span class="dms-summary-dropdown__title">{{ summaryDropdown.colName }}</span>
        <span class="dms-summary-dropdown__subtitle">汇总方式</span>
      </div>

      <div class="dms-summary-dropdown__list">
        <label v-for="opt in summaryDropdown.options" :key="opt.value" class="dms-summary-dropdown__option">
          <input
            type="radio"
            name="summary-rule"
            :value="opt.value"
            v-model="summaryDropdown.selectedValue"
            @change="handleSummaryChange"
          />
          <span>{{ opt.label }}</span>
        </label>
      </div>

      <div class="dms-summary-dropdown__footer">
        <button type="button" class="dms-summary-dropdown__btn is-primary" @click="closeSummaryDropdown">完成</button>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { type CanvasTableContext, runWithTableContext } from '../parameter'
import { refreshSummarySection, stageVars } from '../stage-handler'
import { getSummaryRules } from '../summary-handler'
import { getDropdownPosition } from '../utils'

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

const summaryDropdownRef = ref<HTMLDivElement | null>(null)
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

const summaryDropdown = reactive<SummaryDropdown>({
  visible: false,
  x: 0,
  y: 0,
  colName: '',
  options: [],
  selectedValue: '',
  originalClientX: 0,
  originalClientY: 0
})

const summaryDropdownStyle = computed(() => ({
  position: 'fixed' as const,
  left: `${summaryDropdown.x}px`,
  top: `${summaryDropdown.y}px`,
  zIndex: 3000
}))

const handleSummaryChange = () => {
  runInTableContext(() => {
    getSummaryRules()[summaryDropdown.colName] = summaryDropdown.selectedValue
    refreshSummarySection()
    summaryDropdown.visible = false
  })
}

const closeSummaryDropdown = () => {
  if (!summaryDropdown.visible) return
  summaryDropdown.visible = false
}

const openSummaryDropdown = (
  evt: KonvaEventObject<MouseEvent, Konva.Rect>,
  colName: string,
  options: Array<SummaryDropdownOption>,
  selected?: string
) => {
  const { clientX, clientY } = evt.evt
  const scrollX = window.pageXOffset || document.documentElement.scrollLeft
  const scrollY = window.pageYOffset || document.documentElement.scrollTop

  summaryDropdown.originalClientX = clientX + scrollX
  summaryDropdown.originalClientY = clientY + scrollY
  summaryDropdown.colName = colName
  summaryDropdown.options = options
  summaryDropdown.selectedValue = selected || 'nodisplay'
  ignoreOutsideMouseDownUntil = Date.now() + 300
  summaryDropdown.visible = true

  nextTick(() => {
    if (!summaryDropdownRef.value) return

    const summaryDropdownElRect = summaryDropdownRef.value.getBoundingClientRect()
    const { dropdownX, dropdownY } = getDropdownPosition(
      clientX,
      clientY,
      Math.ceil(summaryDropdownElRect.width),
      Math.ceil(summaryDropdownElRect.height)
    )

    summaryDropdown.x = dropdownX
    summaryDropdown.y = dropdownY
  })
}

const updatePositions = () => {
  if (summaryDropdown.visible) {
    summaryDropdown.visible = false
  }
}

const onGlobalMousedown = (mouseEvent: MouseEvent) => {
  runInTableContext(() => {
    if (Date.now() < ignoreOutsideMouseDownUntil) return
    if (stageVars.stage) stageVars.stage.setPointersPositions(mouseEvent)

    const target = mouseEvent.target as HTMLElement | null
    if (!target || !summaryDropdown.visible) return

    if (summaryDropdownRef.value?.contains(target)) return

    closeSummaryDropdown()
  })
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
  openSummaryDropdown,
  closeSummaryDropdown,
  updatePositions
})
</script>

<style lang="scss" scoped>
.dms-summary-dropdown {
  width: 180px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  box-sizing: border-box;
}

.dms-summary-dropdown__header {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.dms-summary-dropdown__title {
  font-size: 13px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dms-summary-dropdown__subtitle {
  font-size: 12px;
  color: #64748b;
}

.dms-summary-dropdown__list {
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 4px 0;
  margin-bottom: 8px;
}

.dms-summary-dropdown__option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
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

.dms-summary-dropdown__footer {
  display: flex;
  justify-content: flex-end;
}

.dms-summary-dropdown__btn {
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
