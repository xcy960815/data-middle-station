<template>
  <teleport to="body">
    <div ref="summaryDropdownRef" v-show="visible" class="dms-summary-dropdown" :style="dropdownStyle">
      <el-select
        v-model="selectedValue"
        size="small"
        placeholder="选择汇总"
        style="width: 160px"
        @change="handleChange"
        @blur="handleBlur"
        @keydown.stop
      >
        <el-option v-for="opt in options" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface SummaryOption {
  label: string
  value: string
}

interface Props {
  visible: boolean
  options: SummaryOption[]
  selectedValue: string
  dropdownStyle: Record<string, any>
}

interface Emits {
  (e: 'change', value: string): void
  (e: 'blur'): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const summaryDropdownRef = ref<HTMLElement>()
const selectedValue = ref(props.selectedValue)

const handleChange = (value: string) => {
  emits('change', value)
}

const handleBlur = () => {
  emits('blur')
}

defineExpose({
  summaryDropdownRef
})
</script>

<style lang="scss" scoped>
.dms-summary-dropdown {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid #ebeef5;
  padding: 5px 8px;
  border-radius: 4px;
}
</style>
