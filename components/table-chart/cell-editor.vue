<template>
  <teleport to="body">
    <div
      v-show="visible"
      ref="editorRef"
      class="dms-cell-editor"
      :style="editorStyle"
      @keydown.enter="handleSaveEditorValue"
      @keydown.esc="handleCancel"
      @click.stop
    >
      <!-- 输入框编辑器 -->
      <el-input
        v-if="editType === 'input'"
        ref="inputRef"
        v-model="editValue"
        @blur="handleSaveEditorValue"
        @keydown.stop
      />

      <!-- 下拉选择编辑器 -->
      <el-select
        v-else-if="editType === 'select'"
        ref="selectRef"
        v-model="editValue"
        @change="handleSaveEditorValue"
        @blur="handleCancel"
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
        @change="handleSaveEditorValue"
        @blur="handleCancel"
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
        @change="handleSaveEditorValue"
        @blur="handleCancel"
        @keydown.stop
      />
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElDatePicker, ElInput, ElOption, ElSelect } from 'element-plus'

interface EditOptions {
  label: string
  value: string | number
}

interface Props {
  visible: boolean
  editType: 'input' | 'select' | 'date' | 'datetime'
  editOptions?: EditOptions[]
  initialValue: any
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

interface Emits {
  (e: 'save', value: number | string): void
  (e: 'cancel'): void
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
    left: `${x}px`,
    top: `${y}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: 9999,
    background: '#fff',
    border: '1px solid #409eff',
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
      console.log('editType', props.editType)

      editValue.value = props.initialValue
      nextTick(() => {
        focusEditor()
      })
    }
  }
)

// 监听初始值变化
watch(
  () => props.initialValue,
  (newValue) => {
    editValue.value = newValue
  }
)

// 聚焦编辑器
const focusEditor = () => {
  nextTick(() => {
    switch (props.editType) {
      case 'input':
        inputRef.value?.focus()
        inputRef.value?.select()
        break
      case 'select':
        selectRef.value?.focus()
        break
      case 'date':
        // Date picker 通过点击打开，不需要手动focus
        break
      case 'datetime':
        // DateTime picker 通过点击打开，不需要手动focus
        break
    }
  })
}

// 保存编辑
const handleSaveEditorValue = () => {
  emits('save', editValue.value)
}

// 取消编辑
const handleCancel = () => {
  emits('cancel')
}

// 点击外部关闭编辑器
const handleClickOutside = (e: MouseEvent) => {
  if (props.visible && editorRef.value && !editorRef.value.contains(e.target as Node)) {
    // 检查是否点击了 Element Plus 的下拉面板
    const target = e.target as HTMLElement
    const isElSelectDropdown = target.closest('.el-select-dropdown, .el-popper, .el-picker-panel')
    if (!isElSelectDropdown) {
      handleCancel()
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
    }

    .el-input__inner {
      height: 100%;
      border: none;
      padding: 0;
      font-size: 14px;
      line-height: 1;
    }
  }

  // 下拉选择样式
  :deep(.el-select) {
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
    }

    .el-input__inner {
      height: 100%;
      border: none;
      padding: 0;
      font-size: 14px;
      line-height: 1;
    }

    .el-input__suffix {
      display: flex;
      align-items: center;
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
    }

    .el-input__inner {
      height: 100%;
      border: none;
      padding: 0;
      font-size: 14px;
      line-height: 1;
    }

    .el-input__prefix,
    .el-input__suffix {
      display: flex;
      align-items: center;
    }
  }
}
</style>
