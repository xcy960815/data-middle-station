<template>
  <!-- selecter 公共模版 -->
  <el-popover class="chart-selecter relative" :visible="selecterVisible" popper-class="chart-selecter-popover"
    placement="bottom" width="100px">
    <template #reference>
      <div class="chart-selecter-container" @click="handleClickTag">
        <span class="chart-selecter-name">{{ displayName }}</span>
        <slot name="order-icon"></slot>
        <!-- 通用icon 删除使用 -->
        <el-icon class="chart-selecter-delete" size="12" @click.stop="handleDeleteTag">
          <Delete />
        </el-icon>
      </div>
    </template>
    <slot></slot>
  </el-popover>
</template>

<script lang="ts" setup>
const props = defineProps({
  name: {
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
  orderType: {
    type: String as PropType<OrderStore.OrderType>,
    default: ''
  },
  filterType: {
    type: String,
    default: ''
  },
  filterValue: {
    type: String,
    default: ''
  },
  // 通用参数
  index: {
    type: Number,
    default: null,
    required: true
  },
  // 聚合方式
  aggregationType: {
    type: String as PropType<OrderStore.OrderAggregationsType | FilterStore.FilterAggregationsType>,
    default: ''
  },
})
const selecterVisible = ref(false)
/**
 * @description: 点击标签
 */
const handleClickTag = () => {
  selecterVisible.value = true
}
const filterStore = useFilterStore();
const orderStore = useOrderStore();
const dimensionStore = useDimensionStore();
const groupStore = useGroupStore();

/**
 * @desc 删除标签
 */
const handleDeleteTag = () => {
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
 console.log(1111);
 
})

</script>

<style lang="scss">
.chart-selecter-popover {
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
      top: 6px;

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
  line-height: 24px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;

  // justify-content: space-between;
  .chart-selecter-name {
    flex-grow: 1;
    // 超出部分隐藏 并且显示省略号
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

  }

  .chart-selecter-delete,
  .chart-selecter-order-icon {
    cursor: pointer;
    flex-shrink: 0;
    margin-left: auto;
  }

  .chart-selecter-order-icon {
    margin-right: 6px;
    font-size: 14px;
  }
}
</style>