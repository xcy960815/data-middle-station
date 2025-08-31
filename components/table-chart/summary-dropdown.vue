<template>
  <teleport to="body">
    <div v-show="visible" ref="summaryDropdownRef" class="dms-summary-dropdown" :style="dropdownStyle" @click.stop>
      <el-select
        :model-value="selectedValue"
        size="small"
        placeholder="选择汇总"
        style="width: 160px"
        @update:model-value="handleSelectionChange"
        @blur="handleBlur"
        @keydown.stop
      >
        <el-option v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ElOption, ElSelect } from 'element-plus'
import { computed, defineEmits, defineProps, nextTick, onBeforeUnmount, onMounted, ref, watch, withDefaults } from 'vue'

interface SummaryOption {
  label: string
  value: string
}

interface Props {
  visible: boolean
  options: SummaryOption[]
  selectedValue: string
  position: {
    x: number
    y: number
  }
}

interface Emits {
  (eventName: 'change', selectedValue: string): void
  (eventName: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  options: () => [],
  selectedValue: ''
})

const emits = defineEmits<Emits>()

const summaryDropdownRef = ref<HTMLElement>()

// 计算下拉框样式
const dropdownStyle = computed(() => {
  const { x, y } = props.position
  return {
    position: 'fixed' as const,
    left: `${x}px`,
    top: `${y}px`,
    zIndex: 99999,
    backgroundColor: '#fff',
    border: '1px solid #e4e7ed',
    borderRadius: '4px',
    boxShadow: '0 2px 12px 0 rgba(0, 0, 0, 0.1)',
    padding: '6px'
  }
})

// 处理选择变化
const handleSelectionChange = (newValue: string) => {
  emits('change', newValue)
}

// 处理失焦
const handleBlur = () => {
  // 延迟关闭，避免选择项时立即关闭
  setTimeout(() => {
    emits('close')
  }, 150)
}

// 监听显示状态变化
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      nextTick(() => {
        // 可以在这里添加聚焦逻辑
      })
    }
  },
  { immediate: true }
)

// 点击外部关闭下拉框
const handleClickOutside = (e: MouseEvent) => {
  if (props.visible && summaryDropdownRef.value && !summaryDropdownRef.value.contains(e.target as Node)) {
    // 检查是否点击了 Element Plus 的下拉面板
    const target = e.target as HTMLElement
    const isElSelectDropdown = target.closest('.el-select-dropdown, .el-popper')
    if (!isElSelectDropdown) {
      emits('close')
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
.dms-summary-dropdown {
  :deep(.el-select) {
    .el-select__wrapper {
      border: 1px solid #dcdfe6;
      border-radius: 4px;

      &:hover {
        border-color: #c0c4cc;
      }

      &.is-focused {
        border-color: #409eff;
      }
    }
  }
}
</style>
