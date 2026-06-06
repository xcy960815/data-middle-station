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
          v-model:visible="wherePopoverVisible"
          placement="bottom-start"
          trigger="click"
          width="auto"
          :teleported="true"
        >
          <template #reference>
            <span
              class="chart-selector-filter-trigger"
              @click.stop="openWherePopover"
              @contextmenu.prevent="openWherePopover"
            >
              <slot name="filter-action"></slot>
            </span>
          </template>
          <slot name="where-panel" :close-popover="closeWherePopover"></slot>
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
