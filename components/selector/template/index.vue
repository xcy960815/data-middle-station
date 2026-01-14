<template>
  <client-only>
    <el-popover placement="bottom-start" trigger="click" width="auto" :disabled="!isPopoverEnabled" ref="popoverRef">
      <template #reference>
        <div class="chart-selector-container px-1" :class="invalidClass">
          <span class="chart-selector-name mr-1">{{ displayName }}</span>
          <slot class="chart-selector-order-icon" name="order-icon"></slot>
          <!-- 无效排序图标 -->
          <el-tooltip
            class="box-item"
            effect="dark"
            :content="invalidMessage || invalidContent"
            placement="top"
            v-if="hasInvalidIcon()"
          >
            <icon-park class="chart-selector-invalid-icon" type="error" size="12" fill="#ff4d4f" @contextmenu.stop />
          </el-tooltip>
          <!-- 删除图标 -->
          <icon-park
            class="chart-selector-delete"
            type="DeleteTwo"
            size="14"
            fill="#333"
            @click.stop="handleDeleteSelector"
            @contextmenu.stop
          />
        </div>
      </template>
      <!-- 下拉内容 -->
      <div class="chart-selector-options">
        <slot></slot>
      </div>
    </el-popover>
  </client-only>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElPopover } from 'element-plus'
const props = defineProps({
  // 通用参数
  invalid: {
    type: Boolean,
    default: false
  },
  /**
   * @desc 无效信息 默认使用无效内容
   */
  invalidMessage: {
    type: String,
    default: ''
  },
  // 通用参数
  displayName: {
    type: String,
    default: ''
  },
  // 通用参数
  cast: {
    type: String as PropType<'dimension' | 'group' | 'order' | 'filter'>,
    default: ''
  },
  // 通用参数
  index: {
    type: Number,
    default: null,
    required: true
  }
})
const filterStore = useFiltersStore()
const orderStore = useOrdersStore()
const dimensionStore = useDimensionsStore()
const groupStore = useGroupsStore()
const isPopoverEnabled = computed(() => {
  return ['order', 'filter'].includes(props.cast)
})
/**
 * @desc 无效样式
 */
const invalidClass = computed(() => {
  return props.invalid ? 'invalid-selector' : ''
})
/**
 * @desc 无效内容
 */
const invalidContent = computed(() => {
  switch (props.cast) {
    case 'filter':
      return '无效的筛选条件'
    case 'order':
      return '无效的排序条件'
    case 'dimension':
      return '无效的维度'
    case 'group':
      return '无效的分组'
    default:
      return ''
  }
})
/**
 * @desc 是否显示无效图标
 */
const hasInvalidIcon = computed(() => () => {
  return props.invalid
})

/**
 * @desc 删除标签
 */
const handleDeleteSelector = () => {
  if (props.cast === 'filter') {
    filterStore.removeFilter(props.index)
  } else if (props.cast === 'order') {
    orderStore.removeOrder(props.index)
  } else if (props.cast === 'dimension') {
    dimensionStore.removeDimension(props.index)
  } else if (props.cast === 'group') {
    groupStore.removeGroup(props.index)
  }
}

/**
 * @desc popover ref
 */
const popoverRef = ref<InstanceType<typeof ElPopover>>()

/**
 * @desc 关闭 popover
 */
const closePopover = () => {
  popoverRef.value?.hide()
}

defineExpose({
  closePopover
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

  // 无效字段样式
  &.invalid-selector {
    border-color: #ff4d4f;
  }

  .chart-selector-name {
    flex-grow: 1;
    // 超出部分隐藏 并且显示省略号
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-selector-delete,
  :deep(.chart-selector-order-icon) {
    cursor: pointer;
    flex-shrink: 0;
    margin-left: auto;
  }

  .chart-selector-order-icon {
    margin-right: 6px;
    font-size: 14px;
  }

  .chart-selector-invalid-icon {
    color: #ff4d4f;
    margin-right: 6px;
    cursor: help;
  }
}
</style>
