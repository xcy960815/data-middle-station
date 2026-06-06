<template>
  <div class="order-selector" :class="$attrs.class">
    <selector-template
      :index="props.index"
      cast="order"
      :display-name="props.displayName"
      :invalid="props.invalid"
      :invalid-message="props.invalidMessage"
    >
      <template #order-aggregation>
        <el-popover
          ref="aggregationPopoverRef"
          placement="bottom-start"
          trigger="click"
          width="auto"
          :disabled="!hasAggregationSlot"
        >
          <template #reference>
            <span class="chart-selector-aggregation-trigger" @click.stop @mousedown.stop @contextmenu.stop>
              <slot name="order-aggregation"></slot>
            </span>
          </template>
          <div class="order-aggregation-options">
            <slot name="aggregation-panel" :close-popover="closeAggregationPopover"></slot>
          </div>
        </el-popover>
      </template>
      <template #order-direction>
        <slot name="order-direction"></slot>
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
  invalid: {
    type: Boolean,
    default: false
  },
  invalidMessage: {
    type: String,
    default: ''
  },
  order: {
    type: Object as PropType<OrderStore.OrderOption>,
    required: true,
    default: () => ({})
  }
})

const slots = useSlots()
const aggregationPopoverRef = ref<InstanceType<typeof ElPopover> | null>(null)
const hasAggregationSlot = computed(() => !!slots['aggregation-panel'])

const closeAggregationPopover = () => {
  aggregationPopoverRef.value?.hide()
}
</script>

<style lang="scss" scoped>
.order-selector {
  width: 100%;
}

.chart-selector-aggregation-trigger {
  display: inline-flex;
  align-items: center;
  cursor: context-menu;
}
</style>
