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
        <span class="chart-selector-aggregation-trigger" @contextmenu="contextmenuHandler">
          <slot name="order-aggregation"></slot>
        </span>
      </template>
      <template #order-direction>
        <slot name="order-direction"></slot>
      </template>
    </selector-template>
  </div>
  <context-menu ref="contextmenuRef">
    <slot name="context-menu"></slot>
  </context-menu>
</template>

<script lang="ts" setup>
import ContextMenu from '../../context-menu/index.vue'

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

const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

const contextmenuHandler = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  contextmenuRef.value?.show(event)
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
