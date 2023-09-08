<template>
  <el-popover
    class="chart-tag relative"
    placement="bottom"
    trigger="click"
  >
    <template #reference>
      <div class="tag-name">{{ name }}</div>
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
    type: String as PropType<
      'dimension' | 'group' | 'order' | 'filter'
    >
  }
})

const isDimension = computed(() => props.cast === 'dimension')

const isGroup = computed(() => props.cast === 'group')

const isFilter = computed(() => props.cast === 'filter')

const isOrder = computed(() => props.cast === 'order')

</script>

<style lang="less" scoped>
.tag-name {
  position: relative;
  padding: 0 35px 0 5px;
  height: 26px;
  line-height: 24px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
  font-size: 14px;
}
</style>
