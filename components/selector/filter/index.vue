<template>
  <div class="filter-selector">
    <selector-template v-bind="$attrs" :index="props.index">
      <template #filter-aggregation>
        <span class="chart-selector-aggregation-trigger" @contextmenu="aggregationContextmenuHandler">
          <slot name="filter-aggregation"></slot>
        </span>
      </template>
      <template #filter-action>
        <el-popover
          v-model:visible="wherePopoverVisible"
          placement="bottom-start"
          trigger="manual"
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
  <context-menu ref="aggregationContextmenuRef">
    <slot name="context-menu"></slot>
  </context-menu>
</template>

<script lang="ts" setup>
import { ElPopover } from 'element-plus'
import ContextMenu from '../../context-menu/index.vue'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  index: {
    type: Number,
    default: null
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
const aggregationContextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

const openWherePopover = () => {
  emit('beforeOpenWhere')
  wherePopoverVisible.value = true
}

const closeWherePopover = () => {
  wherePopoverVisible.value = false
}

const aggregationContextmenuHandler = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  aggregationContextmenuRef.value?.show(event)
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
