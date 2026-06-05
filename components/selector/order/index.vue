<template>
  <div class="order-selector" @contextmenu="contextmenuHandler">
    <selector-template v-bind="$attrs" :index="props.index">
      <template #order-aggregation>
        <slot name="order-aggregation"></slot>
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
  cursor: context-menu;
  width: 100%;
}
</style>
