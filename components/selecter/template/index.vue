<template>
  <!-- selecter 公共模版 -->
  <el-popover
    class="chart-selecter relative"
    :visible="selecterVisible"
    trigger="click"
    popper-class="chart-selecter-template-popover"
    placement="bottom"
    width="100px"
  >
    <template #reference>
      <div
        class="chart-selecter-container"
        :class="invalidClass"
        @click="selecterVisible = true"
        v-click-outside="onClickOutside"
      >
        <span class="chart-selecter-name mr-1">{{
          displayName
        }}</span>
        <slot
          class="chart-selecter-order-icon"
          name="order-icon"
        ></slot>
        <!-- 无效字段标志 -->
        <el-tooltip
          class="box-item"
          effect="dark"
          :content="invalidContent"
          placement="top"
        >
          <iconify-icon
            v-if="hasInvalidIcon()"
            class="chart-selecterinvalid-icon"
            icon="mingcute:warning-fill"
          />
        </el-tooltip>
        <icon-park
          class="chart-selecter-delete"
          type="DeleteTwo"
          size="14"
          fill="#333"
          @click.stop="handleDeleteSelecter"
        />
      </div>
    </template>
    <template #default>
      <slot></slot>
    </template>
  </el-popover>
</template>

<script lang="ts" setup>
import {
  ClickOutside as vClickOutside,
  ElTooltip,
  ElPopover
} from 'element-plus'

const props = defineProps({
  // 通用参数
  invalid: {
    type: Boolean,
    default: false
  },
  // 通用参数
  displayName: {
    type: String,
    default: ''
  },
  // 通用参数
  cast: {
    type: String as PropType<
      'dimension' | 'group' | 'order' | 'filter'
    >,
    default: ''
  },
  // 通用参数
  index: {
    type: Number,
    default: null,
    required: true
  }
})
const filterStore = useFilterStore()
const orderStore = useOrderStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()
const selecterVisible = ref(false)
/**
 * @desc 无效样式
 */
const invalidClass = computed(() => {
  return props.invalid ? 'invalid' : ''
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
 * @desc 点击外部隐藏 TODO 不知道为什么触发了两次
 */
const onClickOutside = () => {
  if (props.cast === 'filter') return
  selecterVisible.value = false
}

/**
 * @desc 删除标签
 */
const handleDeleteSelecter = () => {
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

onMounted(() => {
  // 如果cast为filter或order，则默认显示
  if (props.cast === 'filter' || props.cast === 'order') {
    selecterVisible.value = true
  }
})
</script>

<style lang="scss">
.chart-selecter-template-popover {
  padding: 5px 0 !important;

  .aggregation-option {
    height: 26px;
    line-height: 26px;
    padding: 0 15px 0 30px;
    display: flex;
    align-items: center;
    cursor: pointer;
    position: relative;

    .aggregation-mark {
      position: absolute;
      left: 10px;
      top: 4px;
    }

    &:hover {
      background-color: #eee;
      color: #fff;
    }
  }
}
</style>

<style lang="scss" scoped>
.chart-selecter-container {
  position: relative;
  padding: 0 5px 0 5px;
  height: 26px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;

  // 无效字段样式
  &.invalid {
    border-color: #ff4d4f;
  }

  .chart-selecter-name {
    flex-grow: 1;
    // 超出部分隐藏 并且显示省略号
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .chart-selecter-delete,
  :deep(.chart-selecter-order-icon) {
    cursor: pointer;
    flex-shrink: 0;
    margin-left: auto;
  }

  .chart-selecter-order-icon {
    margin-right: 6px;
    font-size: 14px;
  }

  .chart-selecterinvalid-icon {
    color: #ff4d4f;
    margin-right: 6px;
    cursor: help;
  }
}
</style>
