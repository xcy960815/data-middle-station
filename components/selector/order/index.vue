<template>
  <div class="order-selector">
    <selector-template v-bind="$attrs" :display-name="fieldLabel" :cast="cast" :index="index" :order="order">
      <template #selector-name>
        <span class="chart-selector-name mr-1 order-selector__name" @contextmenu="handleContextMenu">
          {{ fieldLabel }}
        </span>
      </template>
      <template #order-aggregation>
        <span class="chart-selector-meta-label order-selector__aggregation" @contextmenu="handleContextMenu">
          {{ aggregationLabel }}
        </span>
      </template>
      <template #order-direction>
        <icon-park
          class="chart-selector-direction-icon"
          v-if="orderType === 'asc'"
          type="arrow-circle-down"
          size="14"
          fill="#333"
          @click.stop="handleToggleDirection"
          @contextmenu.stop
        />
        <icon-park
          class="chart-selector-direction-icon"
          v-else
          type="arrow-circle-up"
          size="14"
          fill="#333"
          @click.stop="handleToggleDirection"
          @contextmenu.stop
        />
      </template>
    </selector-template>
  </div>
  <context-menu ref="contextmenuRef">
    <context-menu-item
      v-for="option in aggregationOptions"
      :key="option.value"
      @click="handleSelectAggregation(option.value)"
    >
      {{ option.label }}
      <span v-if="aggregationType === option.value" class="order-selector__checked">✓</span>
    </context-menu-item>
  </context-menu>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import ContextMenu from '../../context-menu/index.vue'
import { getOrderAggregationLabel, getOrderAggregationOptions } from '@/shared/orderAggregationOptions'

const props = defineProps({
  displayName: {
    type: String,
    default: ''
  },
  cast: {
    type: String as PropType<'measure' | 'dimension' | 'order' | 'filter'>,
    default: ''
  },
  orderType: {
    type: String as PropType<OrderStore.OrderType>,
    default: 'desc'
  },
  index: {
    type: Number,
    default: null,
    required: true
  },
  aggregationType: {
    type: String as PropType<OrderStore.OrderAggregationsType>,
    default: 'raw'
  },
  order: {
    type: Object as PropType<OrderStore.OrderOption>,
    default: () => ({})
  }
})

const emits = defineEmits(['update:orderType', 'update:aggregationType', 'update:displayName'])

const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

const fieldLabel = computed(() => props.order.columnComment || props.order.columnName)

const aggregationOptions = computed(() => getOrderAggregationOptions(props.order.columnType, true))

const aggregationLabel = computed(() => getOrderAggregationLabel(props.aggregationType))

const syncDisplayName = () => {
  emits('update:displayName', fieldLabel.value)
}

const handleToggleDirection = () => {
  emits('update:orderType', props.orderType === 'desc' ? 'asc' : 'desc')
  emits('update:aggregationType', 'raw')
  syncDisplayName()
}

const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  contextmenuRef.value?.show(event)
}

const handleSelectAggregation = (aggregationType: OrderStore.OrderAggregationsType) => {
  emits('update:aggregationType', aggregationType)
  if (!props.orderType) {
    emits('update:orderType', 'desc')
  }
  syncDisplayName()
}

watch(fieldLabel, syncDisplayName, { immediate: true })
</script>

<style lang="scss" scoped>
.order-selector__name,
.order-selector__aggregation {
  cursor: context-menu;
}

.order-selector__checked {
  margin-left: 8px;
  color: #409eff;
}
</style>
