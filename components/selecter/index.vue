<template>
  <el-popover class="chart-selecter relative" :visible="selecterVisible" popper-class="chart-selecter-popover"
    placement="bottom" width="100px" @hide="handleHidePopover">
    <template #reference>
      <div class="chart-selecter-container" @click="handleClickTag">
        <span class="chart-selecter-name">{{ displayName }}</span>
        <!-- order 进行升降排序的icon -->
        <Icon class="chart-selecter-order-icon" v-if="isOrder" @click="handleClickOrder"
          :icon="orderIconName(orderType)" />
        <!-- 通用icon 删除使用 -->
        <el-icon class="chart-selecter-delete" size="12" @click.stop="handleDeleteTag">
          <Delete />
        </el-icon>
      </div>
    </template>

    <!-- <template v-if="isDimension">dimension</template>
    <template v-if="isGroup">group</template> -->
    <template v-if="isOrder">
      <div class="aggregation-option"
        @click="handleClickOrderAggregation(orderAggregation.value as OrderStore.OrderAggregationsType)"
        v-for="orderAggregation in orderAggregations">
        <!-- 复现用户选择的聚合条件 -->
        <Icon class="aggregation-mark" icon="icon-park-solid:correct" v-if="orderAggregation.value === aggregationType" />
        <span>{{ orderAggregation.label }}</span>
      </div>
    </template>
    <template v-if="isFilter">
      <div class="h-[26px] flex items-center hover:bg-gray-300 hover:text-white"
        v-for="filterAggregation in filterAggregations">{{ filterAggregation.label }}</div>

      <filter-selecter v-bind="$attrs" v-model:selecterVisible="selecterVisible"></filter-selecter>
    </template>
  </el-popover>
</template>

<script lang="ts" setup>
import { initData } from "./init-data"
import { handler } from "./handler"
import type { ElPopover } from "element-plus"
import FilterSelecter from "./components/filter-selecter/index.vue"

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


const {
  filterAggregations,
  orderAggregations,
  selecterVisible,
  isDimension,
  isGroup,
  isFilter,
  isOrder,
  orderIconName
} = initData(props)


const {
  handleClickTag,
  handleDeleteTag,
  handleClickOrder,
  handleClickOrderAggregation
} = handler({
  selecterVisible,
  isDimension,
  isGroup,
  isFilter,
  isOrder,
  index: props.index,
  orderType: props.orderType,
  name: props.name,
  orderAggregations
})


/**
 * @description: 关闭popover
 */
const handleHidePopover = () => {
  // console.log("handleHidePopover");

  // selecterVisible.value = false
}


onMounted(() => {
  if (isFilter.value) {
    // 有值就说明不是拖进来的 不是新的 不用打开
    if (!props.filterType || !props.filterValue) {
      selecterVisible.value = true
    }
  }
  if (isOrder.value) {
    if (!props.orderType) {
      selecterVisible.value = true
    }
  }
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
