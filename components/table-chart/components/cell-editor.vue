<template>
  <teleport to="body">
    <div
      v-show="editDown.visible"
      ref="editorRef"
      class="dms-cell-editor"
      :style="editorStyle"
      @keydown.esc.stop="closeEditor"
      @click.stop
    >
      <input
        v-if="editDown.editType === 'input'"
        ref="nativeControlRef"
        v-model="editorValue"
        class="dms-cell-native-control"
        :style="nativeControlStyle"
        type="text"
        @keydown.enter.stop="handleSaveEditorValue"
        @blur="handleSaveEditorValue"
      />

      <select
        v-else-if="editDown.editType === 'select'"
        ref="nativeControlRef"
        v-model="editorValue"
        class="dms-cell-native-control dms-cell-native-select"
        :style="nativeControlStyle"
        @change="handleSaveEditorValue"
        @keydown.enter.stop="handleSaveEditorValue"
        @keydown.esc.stop="closeEditor"
      >
        <option v-for="option in selectEditorOptions" :key="String(option.value)" :value="String(option.value)">
          {{ option.label }}
        </option>
      </select>

      <input
        v-else-if="editDown.editType === 'date'"
        ref="nativeControlRef"
        v-model="editorValue"
        class="dms-cell-native-control"
        :style="nativeControlStyle"
        type="date"
        @change="handleSaveEditorValue"
        @keydown.enter.stop="handleSaveEditorValue"
      />

      <input
        v-else-if="editDown.editType === 'datetime'"
        ref="nativeControlRef"
        v-model="editorValue"
        class="dms-cell-native-control"
        :style="nativeControlStyle"
        type="datetime-local"
        step="1"
        @change="handleSaveEditorValue"
        @keydown.enter.stop="handleSaveEditorValue"
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import { commitCellValueChange } from '../data-handler'
import { measureTablePerf } from '../perf'
import { type CanvasTableContext, runWithTableContext } from '../parameter'
import { refreshBodySection, refreshSummarySection, stageVars } from '../stage-handler'

interface EditorStyleOptions {
  align: 'left' | 'center' | 'right'
  fontSize: number
  fontFamily: string
  padding: number
}

interface EditDown {
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  editType: 'input' | 'select' | 'date' | 'datetime'
  editOptions?: EditOptions[]
  originalValue: string | number
  styleOptions?: EditorStyleOptions
  row?: AnalyzeDataVo.AnalyzeData
  columnName: string
  columnType?: string | null
}

interface EditOptions {
  label: string
  value: string | number
}

interface EditContext {
  row: AnalyzeDataVo.AnalyzeData
  columnName: string
  columnType?: string | null
}

const editorRef = ref<HTMLElement>()
const nativeControlRef = ref<HTMLInputElement | HTMLSelectElement>()
const editorValue = ref('')
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

const editDown = reactive<EditDown>({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  editType: 'input',
  originalValue: '',
  row: undefined,
  columnName: '',
  columnType: undefined
})

const isNumericColumnType = (columnType?: string | null): boolean => {
  if (!columnType) return false
  return /(number|int|decimal|numeric|float|double|real)/i.test(columnType)
}

const toNativeDatetimeValue = (value: string | number): string => {
  const text = String(value ?? '').trim()
  if (!text) return ''

  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::(\d{2}))?/)
  if (!match) return normalized

  const [, datePart, hourMinute, secondPart] = match
  return secondPart ? `${datePart}T${hourMinute}:${secondPart}` : `${datePart}T${hourMinute}`
}

const fromNativeDatetimeValue = (value: string): string => {
  const text = value.trim()
  if (!text) return ''

  const normalized = text.replace('T', ' ')
  const match = normalized.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})(?::(\d{2}))?/)
  if (!match) return normalized

  const [, datePart, hourMinute, secondPart] = match
  return `${datePart} ${hourMinute}:${secondPart ?? '00'}`
}

const toEditorValue = (value: string | number, editType: EditDown['editType']): string => {
  if (editType === 'datetime') {
    return toNativeDatetimeValue(value)
  }
  return String(value ?? '')
}

const fromEditorValue = (value: string, editType: EditDown['editType']): string | number => {
  if (editType === 'datetime') {
    return fromNativeDatetimeValue(value)
  }
  return value
}

const normalizeEditedValue = (
  value: string | number,
  columnType?: string | null,
  fallbackValue?: string | number
): string | number => {
  if (!isNumericColumnType(columnType)) {
    return value
  }

  if (value === '') {
    return ''
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : (fallbackValue ?? value)
}

const resetEditState = () => {
  editDown.visible = false
  editDown.editOptions = undefined
  editDown.styleOptions = undefined
  editorValue.value = ''
  editDown.originalValue = ''
  editDown.row = undefined
  editDown.columnName = ''
  editDown.columnType = undefined
}

const editorStyle = computed(() => {
  const { fontSize, fontFamily } = editDown.styleOptions || {}
  return {
    position: 'fixed' as const,
    left: `${editDown.x}px`,
    top: `${editDown.y}px`,
    width: `${editDown.width + 1}px`,
    height: `${editDown.height + 1}px`,
    zIndex: 999999,
    background: '#fff',
    padding: 0,
    margin: 0,
    boxSizing: 'border-box' as const,
    overflow: 'hidden',
    fontSize: fontSize ? `${fontSize}px` : undefined,
    fontFamily: fontFamily
  }
})

const nativeControlStyle = computed(() => ({
  textAlign: editDown.styleOptions?.align || 'left',
  paddingLeft: `${editDown.styleOptions?.padding ?? 8}px`,
  paddingRight: `${editDown.styleOptions?.padding ?? 8}px`
}))

const selectEditorOptions = computed(() => {
  const options = editDown.editOptions ?? []
  const currentValue = String(editorValue.value ?? '')
  if (!currentValue || options.some((option) => String(option.value) === currentValue)) {
    return options
  }

  return [{ label: currentValue, value: currentValue }, ...options]
})

const focusNativeControl = () => {
  const control = nativeControlRef.value
  if (!control) return

  control.focus()

  if (control instanceof HTMLSelectElement) {
    openNativeSelectPicker(control)
    return
  }

  if (editDown.editType === 'input' && control instanceof HTMLInputElement) {
    control.select()
  }
}

const openNativeSelectPicker = (selectElement: HTMLSelectElement) => {
  if (typeof selectElement.showPicker === 'function') {
    try {
      selectElement.showPicker()
      return
    } catch {
      // 部分浏览器在未由用户手势触发时会抛错，回退到 click。
    }
  }

  selectElement.click()
}

const openEditor = (
  evt: KonvaEventObject<MouseEvent, Konva.Rect>,
  editType: 'input' | 'select' | 'date' | 'datetime',
  initialValue: AnalyzeDataVo.AnalyzeData[keyof AnalyzeDataVo.AnalyzeData],
  editOptions?: EditOptions[],
  styleOptions?: EditorStyleOptions,
  editContext?: EditContext
) => {
  const target = evt.target
  const stage = target.getStage()
  const position = target.getClientRect()
  const stageContainer = stage?.container().getBoundingClientRect()!

  const absoluteX = stageContainer?.left + position.x
  const absoluteY = stageContainer?.top + position.y
  const { height, width } = target.attrs
  const safeValue = (initialValue ?? '') as string | number

  editDown.width = width
  editDown.height = height
  editDown.x = absoluteX
  editDown.y = absoluteY
  editDown.editType = editType
  editDown.editOptions = editOptions
  editDown.styleOptions = styleOptions
  editDown.row = editContext?.row
  editDown.columnName = editContext?.columnName || ''
  editDown.columnType = editContext?.columnType
  editDown.originalValue = safeValue
  editorValue.value = toEditorValue(safeValue, editType)
  ignoreOutsideMouseDownUntil = Date.now() + 300
  editDown.visible = true

  nextTick(focusNativeControl)
}

const handleSaveEditorValue = () => {
  runInTableContext(() => {
    if (!editDown.visible) return

    const nextValue = normalizeEditedValue(
      fromEditorValue(editorValue.value, editDown.editType),
      editDown.columnType,
      editDown.originalValue
    )

    if (nextValue !== editDown.originalValue) {
      const didUpdate = commitCellValueChange(editDown.row, editDown.columnName, nextValue)

      if (didUpdate) {
        measureTablePerf('editCell', () => {
          refreshBodySection()
          refreshSummarySection()
        })
      }
    }

    resetEditState()
  })
}

const closeEditor = () => {
  if (!editDown.visible) return
  resetEditState()
}

const updatePositions = () => {
  if (editDown.visible) {
    resetEditState()
  }
}

const onGlobalMousedown = (mouseEvent: MouseEvent) => {
  runInTableContext(() => {
    if (Date.now() < ignoreOutsideMouseDownUntil) return
    if (stageVars.stage) stageVars.stage.setPointersPositions(mouseEvent)
    const target = mouseEvent.target as HTMLElement | null
    if (!target || !editDown.visible) return

    if (editorRef.value?.contains(target)) return

    handleSaveEditorValue()
  })
}

const initListeners = () => {
  window.addEventListener('scroll', updatePositions, true)
  document.addEventListener('mousedown', onGlobalMousedown, true)
}

const cleanupListeners = () => {
  window.removeEventListener('scroll', updatePositions, true)
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
  openEditor,
  closeEditor,
  updatePositions
})
</script>

<style lang="scss" scoped>
.dms-cell-editor {
  border: 1px solid #409eff;
}

.dms-cell-native-control {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  margin: 0;
  font: inherit;
  color: inherit;
  line-height: 1;

  &:focus {
    outline: none;
  }
}

input.dms-cell-native-control {
  appearance: none;
}

select.dms-cell-native-select {
  cursor: pointer;
  appearance: auto;
  padding-right: 20px;
}
</style>
