<template>
  <teleport to="body">
    <div ref="filterDropdownRef" v-show="visible" class="dms-filter-dropdown" :style="dropdownStyle">
      <el-select
        v-model="selectedValues"
        multiple
        filterable
        collapse-tags
        collapse-tags-tooltip
        size="small"
        placeholder="选择过滤值"
        style="width: 160px"
        @change="handleChange"
        @blur="handleBlur"
        @keydown.stop
      >
        <el-option v-for="opt in options" :key="opt" :label="opt === '' ? '(空)' : opt" :value="opt" />
      </el-select>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
  options: string[]
  selectedValues: string[]
  dropdownStyle: Record<string, any>
}

interface Emits {
  (e: 'change', values: string[]): void
  (e: 'blur'): void
}

const props = defineProps<Props>()
const emits = defineEmits<Emits>()

const filterDropdownRef = ref<HTMLElement>()
const selectedValues = ref(props.selectedValues)

const handleChange = (values: string[]) => {
  emits('change', values)
}

const handleBlur = () => {
  emits('blur')
}

defineExpose({
  filterDropdownRef
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
