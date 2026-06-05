<template>
  <client-only>
    <el-popover
      placement="bottom-start"
      :trigger="popoverTrigger"
      width="auto"
      :disabled="!isPopoverEnabled"
      ref="popoverRef"
    >
      <template #reference>
        <div class="chart-selector-container px-1" :class="invalidClass">
          <slot name="prefix-icon"></slot>
          <slot name="selector-name">
            <span class="chart-selector-name mr-1">{{ displayName }}</span>
          </slot>
          <div class="chart-selector-trailing">
            <slot name="measure-suffix"></slot>
            <slot name="order-aggregation"></slot>
            <slot name="order-direction"></slot>
            <slot name="dimension-suffix"></slot>
            <slot name="filter-aggregation"></slot>
            <slot name="filter-action"></slot>
            <slot name="filter-suffix"></slot>
            <el-tooltip
              class="box-item"
              effect="dark"
              :content="invalidMessage || invalidContent"
              placement="top"
              v-if="hasInvalidIcon()"
            >
              <icon-park class="chart-selector-invalid-icon" type="error" size="12" fill="#ff4d4f" @contextmenu.stop />
            </el-tooltip>
            <!-- 删除 icon -->
            <icon-park
              class="chart-selector-delete"
              type="DeleteTwo"
              size="14"
              fill="#333"
              @click.stop="handleDeleteSelector"
              @contextmenu.stop
            />
          </div>
        </div>
      </template>
      <div class="chart-selector-options">
        <slot :close-popover="closePopover"></slot>
      </div>
    </el-popover>
  </client-only>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElPopover } from 'element-plus'
const props = defineProps({
  invalid: {
    type: Boolean,
    default: false
  },
  invalidMessage: {
    type: String,
    default: ''
  },
  displayName: {
    type: String,
    default: ''
  },
  cast: {
    type: String as PropType<'measure' | 'dimension' | 'order' | 'filter'>,
    default: ''
  },
  index: {
    type: Number,
    default: null,
    required: true
  }
})
const filterStore = useFiltersStore()
const orderStore = useOrdersStore()
const measureStore = useMeasuresStore()
const dimensionStore = useDimensionsStore()
const isPopoverEnabled = computed(() => {
  return props.cast === 'measure'
})
const popoverTrigger = computed(() => {
  return 'click'
})
const invalidClass = computed(() => {
  return props.invalid ? 'invalid-selector' : ''
})
const invalidContent = computed(() => {
  switch (props.cast) {
    case 'filter':
      return '无效的筛选条件'
    case 'order':
      return '无效的排序条件'
    case 'measure':
      return '无效的值'
    case 'dimension':
      return '无效的分组'
    default:
      return ''
  }
})
const hasInvalidIcon = computed(() => () => {
  return props.invalid
})

const handleDeleteSelector = () => {
  if (props.cast === 'filter') {
    filterStore.removeFilter(props.index)
  } else if (props.cast === 'order') {
    orderStore.removeOrder(props.index)
  } else if (props.cast === 'measure') {
    measureStore.removeMeasure(props.index)
  } else if (props.cast === 'dimension') {
    dimensionStore.removeDimension(props.index)
  }
}

const popoverRef = ref<InstanceType<typeof ElPopover>>()

const closePopover = () => {
  popoverRef.value?.hide()
}

const openPopover = () => {
  popoverRef.value?.show?.()
}

defineExpose({
  closePopover,
  openPopover
})
</script>
<style lang="scss" scoped>
.chart-selector-container {
  position: relative;
  height: 26px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;

  &.invalid-selector {
    border-color: #ff4d4f;
  }

  .chart-selector-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-selector-trailing {
    display: inline-flex;
    align-items: center;
    flex-shrink: 0;
    margin-left: auto;
    gap: 6px;
  }

  .chart-selector-delete {
    cursor: pointer;
    flex-shrink: 0;
  }

  .chart-selector-invalid-icon {
    color: #ff4d4f;
    cursor: help;
    flex-shrink: 0;
  }

  :deep(.chart-selector-meta-label) {
    max-width: 48px;
    color: #606266;
    font-size: 11px;
    line-height: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex-shrink: 0;
    border: 0;
    background: transparent;
    padding: 0;
  }

  :deep(button.chart-selector-meta-label) {
    cursor: pointer;
  }

  :deep(.chart-selector-direction-icon) {
    flex-shrink: 0;
    font-size: 14px;
    cursor: pointer;
  }

  :deep(.chart-selector-filter-icon) {
    flex-shrink: 0;
    font-size: 14px;
    cursor: pointer;
  }
}
</style>
