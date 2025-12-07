<template>
  <teleport to="body">
    <div
      v-show="editDown.visible"
      ref="editorRef"
      class="dms-cell-editor"
      :style="editorStyle"
      @keydown.enter="handleSaveEditorValue"
      @keydown.esc="closeEditor"
      @click.stop
    >
      <!-- 输入框编辑器 -->
      <el-input
        v-if="editDown.editType === 'input'"
        ref="inputRef"
        v-model="editDown.initialValue"
        @change="handleSaveEditorValue"
        @keydown.stop
      />

      <!-- 下拉选择编辑器 -->
      <el-select
        v-else-if="editDown.editType === 'select'"
        ref="selectRef"
        v-model="editDown.initialValue"
        @change="handleSaveEditorValue"
        @keydown.stop
      >
        <el-option
          v-for="option in editDown.editOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>

      <!-- 日期编辑器 -->
      <el-date-picker
        v-else-if="editDown.editType === 'date'"
        ref="dateRef"
        v-model="editDown.initialValue"
        type="date"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @blur="handleSaveEditorValue"
        @keydown.stop
      />

      <!-- 日期时间编辑器 -->
      <el-date-picker
        v-else-if="editDown.editType === 'datetime'"
        ref="datetimeRef"
        v-model="editDown.initialValue"
        type="datetime"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        @blur="handleSaveEditorValue"
        @keydown.stop
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElDatePicker, ElInput, ElOption, ElSelect } from 'element-plus'
import Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { stageVars } from '../stage-handler'

interface EditDown {
  visible: boolean
  x: number
  y: number
  width: number
  height: number
  editType: 'input' | 'select' | 'date' | 'datetime'
  editOptions?: EditOptions[]
  initialValue: string | number
  originalValue: string | number
}

interface EditOptions {
  label: string
  value: string | number
}

const editorRef = ref<HTMLElement>()
const inputRef = ref<InstanceType<typeof ElInput>>()
const selectRef = ref<InstanceType<typeof ElSelect>>()
const dateRef = ref<InstanceType<typeof ElDatePicker>>()
const datetimeRef = ref<InstanceType<typeof ElDatePicker>>()

const editDown = reactive<EditDown>({
  visible: false,
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  editType: 'input',
  initialValue: '',
  originalValue: ''
})

// 计算编辑器样式
const editorStyle = computed(() => {
  return {
    position: 'fixed' as const,
    left: `${editDown.x + 1}px`,
    top: `${editDown.y + 1}px`,
    width: `${editDown.width - 3}px`,
    height: `${editDown.height - 2}px`,
    zIndex: 999999,
    background: '#fff',
    padding: 0,
    margin: 0,
    boxSizing: 'border-box' as const,
    overflow: 'hidden'
  }
})

/**
 * 打开编辑器
 * @param {KonvaEventObject<MouseEvent, Konva.Shape>} evt 事件对象
 * @param {string} editType 编辑类型
 * @param {string | number} initialValue 初始值
 * @param {EditOptions[]} editOptions 编辑选项
 */
const openEditor = (
  evt: KonvaEventObject<MouseEvent, Konva.Rect>,
  editType: 'input' | 'select' | 'date' | 'datetime',
  initialValue: AnalyzeDataVo.AnalyzeData[keyof AnalyzeDataVo.AnalyzeData],
  editOptions?: EditOptions[]
) => {
  const target = evt.target
  // 假设 rect 是 Konva.Rect 实例
  const stage = target.getStage()
  const position = target.getClientRect()
  const stageContainer = stage?.container().getBoundingClientRect()!

  // 计算 rect 在浏览器窗口中的坐标
  const absoluteX = stageContainer?.left + position.x
  const absoluteY = stageContainer?.top + position.y
  const attr = target.attrs
  const { height, width } = attr
  editDown.width = width
  editDown.height = height
  editDown.visible = true

  nextTick(() => {
    if (!editorRef.value) return
    editDown.x = absoluteX
    editDown.y = absoluteY
    editDown.editType = editType
    editDown.editOptions = editOptions
    const safeValue = (initialValue ?? '') as string | number
    editDown.initialValue = safeValue
    editDown.originalValue = safeValue

    // 聚焦编辑器
    nextTick(() => {
      switch (editDown.editType) {
        case 'input':
          inputRef.value?.focus()
          break
        case 'select':
          break
        case 'date':
          break
        case 'datetime':
          break
      }
    })
  })
}

/**
 * 保存编辑
 */
const handleSaveEditorValue = () => {
  // 只有当值发生变化时才保存
  if (editDown.initialValue !== editDown.originalValue) {
    // 保存数据
    console.log('保存数据', editDown.initialValue)
    editDown.visible = false
  } else {
    editDown.visible = false
  }
}

// 取消编辑
const closeEditor = () => {
  if (!editDown.visible) return
  editDown.visible = false
}

/**
 * 更新编辑器位置（用于表格内部滚动）
 */
const updatePositions = () => {
  // 本次开发先隐藏掉
  if (editDown.visible && editorRef.value) {
    editDown.visible = false
  }
}

/**
 * 点击外部关闭编辑器（允许点击 Element Plus 下拉面板）
 * @param {MouseEvent} mouseEvent 鼠标事件
 */
const onGlobalMousedown = (mouseEvent: MouseEvent) => {
  if (stageVars.stage) stageVars.stage.setPointersPositions(mouseEvent)
  const target = mouseEvent.target as HTMLElement | null
  if (!target) return

  if (!editDown.visible) return
  const panel = editorRef.value

  if (panel && panel.contains(target)) return
  const inElSelectDropdown = target.closest('.el-select-dropdown, .el-select__popper, .el-popper, .el-picker-panel')
  if (!inElSelectDropdown) {
    // 点击外部时保存数据而不是取消
    handleSaveEditorValue()
  }
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
  openEditor,
  closeEditor,
  updatePositions
})
</script>

<style lang="scss" scoped>
.dms-cell-editor {
  // 输入框样式
  :deep(.el-input) {
    height: 100%;

    .el-input__wrapper {
      height: 100%;
      border: none;
      box-shadow: none;
      background: transparent;
      border-radius: 0;
      padding: 0 8px;
      line-height: 1;
      display: flex;
      align-items: center;

      &:hover,
      &:focus,
      &.is-focus {
        border: none !important;
        box-shadow: none !important;
      }
    }

    .el-input__inner {
      height: 100%;
      border: none;
      padding: 0;
      font-size: 14px;
      line-height: 1;

      &:hover,
      &:focus {
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
    }
  }

  // 下拉选择样式
  :deep(.el-select) {
    height: 100%;
    width: 100%;

    .el-select__wrapper {
      // border: none !important;
      box-shadow: none !important;
      padding-top: 0;
      padding-bottom: 0;
      border-radius: 0;
    }
  }

  // 日期选择器样式
  :deep(.el-date-editor) {
    height: 100%;
    width: 100%;

    .el-input__wrapper {
      height: 100%;
      border: none;
      box-shadow: none;
      background: transparent;
      border-radius: 0;
      padding: 0 8px;
      line-height: 1;
      display: flex;
      align-items: center;

      &:hover,
      &:focus,
      &.is-focus {
        border: none !important;
        box-shadow: none !important;
      }
    }

    .el-input__inner {
      height: 100%;
      border: none;
      padding: 0;
      font-size: 14px;
      line-height: 1;

      &:hover,
      &:focus {
        border: none !important;
        box-shadow: none !important;
        outline: none !important;
      }
    }

    .el-input__prefix,
    .el-input__suffix {
      display: flex;
      align-items: center;
    }
  }
}
</style>
