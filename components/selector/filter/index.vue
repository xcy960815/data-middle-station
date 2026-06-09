<template>
  <div class="filter-selector" :class="$attrs.class">
    <selector-template :index="props.index" cast="filter" :display-name="props.displayName">
      <template #filter-aggregation>
        <el-popover
          ref="aggregationPopoverRef"
          placement="bottom-start"
          trigger="click"
          width="auto"
          :disabled="!hasAggregationSlot"
        >
          <template #reference>
            <span class="chart-selector-aggregation-trigger" @click.stop @mousedown.stop @contextmenu.stop>
              <slot name="filter-aggregation"></slot>
            </span>
          </template>
          <div class="filter-aggregation-options">
            <slot name="aggregation-panel" :close-popover="closeAggregationPopover"></slot>
          </div>
        </el-popover>
      </template>
      <template #filter-action>
        <el-popover
          :visible="wherePopoverVisible"
          placement="bottom-start"
          :trigger="'manual' as any"
          width="auto"
          :teleported="true"
        >
          <template #reference>
            <span
              ref="whereTriggerRef"
              class="chart-selector-filter-trigger"
              @click.stop="openWherePopover"
              @contextmenu.prevent="openWherePopover"
            >
              <slot name="filter-action"></slot>
            </span>
          </template>
          <div ref="wherePanelRef" class="filter-where-popover-panel">
            <slot name="where-panel" :close-popover="closeWherePopover"></slot>
          </div>
        </el-popover>
      </template>
    </selector-template>
  </div>
</template>

<script lang="ts" setup>
import { ElPopover } from 'element-plus'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  index: {
    type: Number,
    default: null
  },
  displayName: {
    type: String,
    default: ''
  },
  filter: {
    type: Object as PropType<FilterStore.FilterOption>,
    required: true,
    default: () => ({})
  }
})

const emit = defineEmits<{
  beforeOpenWhere: []
}>()

const wherePopoverVisible = ref(false)
const slots = useSlots()
const aggregationPopoverRef = ref<InstanceType<typeof ElPopover> | null>(null)
const whereTriggerRef = ref<HTMLElement | null>(null)
const wherePanelRef = ref<HTMLElement | null>(null)
const hasAggregationSlot = computed(() => !!slots['aggregation-panel'])

const openWherePopover = () => {
  emit('beforeOpenWhere')
  wherePopoverVisible.value = true
}

const closeWherePopover = () => {
  wherePopoverVisible.value = false
}

const closeAggregationPopover = () => {
  aggregationPopoverRef.value?.hide()
}

const isElementFormPopper = (target: HTMLElement) => {
  return !!target.closest('.el-select-dropdown, .el-picker-panel, .el-time-panel')
}

const handleDocumentMouseDown = (event: MouseEvent) => {
  if (!wherePopoverVisible.value) return
  const target = event.target as HTMLElement | null
  if (!target) return
  if (whereTriggerRef.value?.contains(target)) return
  if (wherePanelRef.value?.contains(target)) return
  if (isElementFormPopper(target)) return
  closeWherePopover()
}

watch(wherePopoverVisible, (visible) => {
  if (visible) {
    document.addEventListener('mousedown', handleDocumentMouseDown)
  } else {
    document.removeEventListener('mousedown', handleDocumentMouseDown)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleDocumentMouseDown)
})

defineExpose({
  openWherePopover,
  closeWherePopover
})
</script>

<style lang="scss" scoped>
.filter-selector {
  width: 100%;
}

.chart-selector-aggregation-trigger {
  display: inline-flex;
  align-items: center;
  cursor: context-menu;
}

.chart-selector-filter-trigger {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
</style>
