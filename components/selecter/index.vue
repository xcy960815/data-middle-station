<template>
  <el-popover class="chart-tag relative" placement="bottom" trigger="click">
    <template #reference>
      <div class="tag-name">
        <span>{{ name }}</span>
        <template v-if="isOrder">
          <el-icon @click="handleOrderEmit" class="cursor-pointer" :size="14">
            <CaretTop v-if="orderType === 'asc'" />
            <CaretBottom v-else />
          </el-icon>
        </template>
      </div>
    </template>
    <template v-if="isDimension">dimension</template>
    <template v-if="isGroup">group</template>
    <template v-if="isOrder">order</template>
    <template v-if="isFilter">filter</template>
  </el-popover>
</template>

<script lang="ts" setup>

// import DatePicker from '../../../modules/filterBuilder/DatePicker.vue'
// import StringPicker from '../../../modules/filterBuilder/StringPicker.vue'
// import NumberPicker from '../../../modules/filterBuilder/NumberPicker.vue'
// import DatePickerExt from '../../../modules/filterBuilderExt/DatePicker.vue'
// import StringPickerExt from '../../../modules/filterBuilderExt/StringPicker.vue'
// import NumberPickerExt from '../../../modules/filterBuilderExt/NumberPicker.vue'

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
    default: 'default'
  }
})
/**
 * @description 判断当前tag是维度还是度量
 * @returns {boolean}
 */
const isDimension = computed(() => {
  return props.cast === 'dimension'
})

/**
 * @description 判断当前tag是分组还是度量
 * @returns {boolean}
 */
const isGroup = computed(() => props.cast === 'group')

/**
 * @description 判断当前tag是排序还是过滤
 * @returns {boolean}
 */
const isFilter = computed(() => props.cast === 'filter')

/**
 * @description 判断当前tag是排序还是过滤
 * @returns {boolean}
 */
const isOrder = computed(() => props.cast === 'order')

const handleOrderEmit = () => {
  // emit('order', props.name)

}
</script>

<style lang="less" scoped>
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
