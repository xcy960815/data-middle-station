<template>
  <el-popover class="chart-selecter relative" :visible="selecterVisible" placement="bottom" width="200px">
    <template #reference>
      <span @click="handleClickTag" class="tag-name">{{ name }}</span>
    </template>
    <template v-if="isOrder">
      <el-icon class="cursor-pointer" :size="14">
        <CaretTop v-if="orderType === 'asc'" />
        <CaretBottom v-if="orderType === 'desc'" />
      </el-icon>
    </template>
    <template v-if="isDimension">dimension</template>
    <template v-if="isGroup">group</template>
    <template v-if="isOrder">order</template>
    <template v-if="isFilter">
      <!--  :filterType="filterType" :filterValue="filterValue" -->
      <filter-selecter v-bind="$attrs"
        v-model:selecterVisible="selecterVisible"></filter-selecter>
    </template>
  </el-popover>
</template>

<script lang="ts" setup>
import { initData } from "./init-data"
import FilterSelecter from "./components/filter-selecter/index.vue"
const props = defineProps({
  name: {
    type: String,
    default: ''
  },
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
})
const {
  selecterVisible,
  isDimension,
  isGroup,
  isFilter,
  isOrder
} = initData(props)

const handleClickTag = () => {
  selecterVisible.value = true
}

onMounted(() => {
  if (isFilter.value) {
    selecterVisible.value = true
  }
})

</script>

<style lang="scss" scoped>
.tag-name {
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
  justify-content: space-between;
}
</style>
