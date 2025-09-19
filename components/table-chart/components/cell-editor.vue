<template>
  <teleport to="body">
    <div
      v-show="visible"
      ref="editorRef"
      class="dms-cell-editor"
      :style="editorStyle"
      @keydown.enter="handleSaveEditorValue"
      @keydown.esc="handleCloseEditor"
      @click.stop
    >
      <!-- 输入框编辑器 -->
      <el-input
        v-if="editType === 'input'"
        ref="inputRef"
        v-model="editValue"
        @change="handleSaveEditorValue"
        @keydown.stop
      />

      <!-- 下拉选择编辑器 -->
      <el-select
        v-else-if="editType === 'select'"
        ref="selectRef"
        v-model="editValue"
        @change="handleSaveEditorValue"
        @keydown.stop
      >
        <el-option v-for="option in editOptions" :key="option.value" :label="option.label" :value="option.value" />
      </el-select>

      <!-- 日期编辑器 -->
      <el-date-picker
        v-else-if="editType === 'date'"
        ref="dateRef"
        v-model="editValue"
        type="date"
        format="YYYY-MM-DD"
        value-format="YYYY-MM-DD"
        @blur="handleSaveEditorValue"
        @keydown.stop
      />

      <!-- 日期时间编辑器 -->
      <el-date-picker
        v-else-if="editType === 'datetime'"
        ref="datetimeRef"
        v-model="editValue"
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

interface EditOptions {
  label: string
  value: string | number
}

interface Props {
  visible: boolean
  editType: 'input' | 'select' | 'date' | 'datetime'
  editOptions?: EditOptions[]
  initialValue: string | number
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface Emits {
  (eventName: 'save', value: number | string): void
  (eventName: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  editOptions: () => []
})

const emits = defineEmits<Emits>()

const editorRef = ref<HTMLElement>()
const inputRef = ref<InstanceType<typeof ElInput>>()
const selectRef = ref<InstanceType<typeof ElSelect>>()
const dateRef = ref<InstanceType<typeof ElDatePicker>>()
const datetimeRef = ref<InstanceType<typeof ElDatePicker>>()

const editValue = ref<string | number>('')

// 计算编辑器样式
const editorStyle = computed(() => {
  const { x, y, width, height } = props.position
  return {
    position: 'fixed' as const,
    left: `${x + 1}px`,
    top: `${y + 1}px`,
    width: `${width - 3}px`,
    height: `${height - 2}px`,
    zIndex: 999999,

    background: '#fff',
    padding: 0,
    margin: 0,
    boxSizing: 'border-box' as const,
    overflow: 'hidden'
  }
})

// 监听显示状态变化
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      editValue.value = props.initialValue
      nextTick(() => {
        focusEditor()
      })
    }
  },
  { immediate: true }
)

// 聚焦编辑器
const focusEditor = () => {
  nextTick(() => {
    switch (props.editType) {
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
}

// 保存编辑
const handleSaveEditorValue = () => {
  // 只有当值发生变化时才保存
  if (editValue.value !== props.initialValue) {
    emits('save', editValue.value)
  } else {
    // 值没有变化，直接取消编辑
    emits('close')
  }
}

// 取消编辑
const handleCloseEditor = () => {
  emits('close')
}

// 点击外部关闭编辑器
const handleClickOutside = (e: MouseEvent) => {
  if (props.visible && editorRef.value && !editorRef.value.contains(e.target as Node)) {
    // 检查是否点击了 Element Plus 的下拉面板
    const target = e.target as HTMLElement
    const isElSelectDropdown = target.closest('.el-select-dropdown, .el-popper, .el-picker-panel')
    if (!isElSelectDropdown) {
      // 点击外部时保存数据而不是取消
      handleSaveEditorValue()
    }
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleClickOutside, true)
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
