<template>
  <selecter-template
    v-bind="$attrs"
    :display-name="displayName"
  >
    <template #default>
      <div
        class="aggregation-option"
        v-if="!aggregationType"
        @click="
          handleChangeAggregation(
            filterAggregation.value as FilterStore.FilterAggregationsType
          )
        "
        v-for="filterAggregation in filterAggregations"
      >
        <icon-park
          class="aggregation-mark"
          type="correct"
          size="14"
          fill="#333"
          v-if="filterAggregation.value === aggregationType"
        />
        <span>{{ filterAggregation.label }}</span>
      </div>
      <div v-else>test</div>
      <!-- <div class='filter-selecter relative'>
                <el-select v-model="localFilterType" placeholder="请选择过滤条件" class="w-full mb-1">
                    <el-option v-for="item in filterOptions" :key="item.value" :label="item.label" :value="item.value" />
                </el-select>
                <el-input v-if="hasFilterValue()" v-model="localFilterValue" placeholder="请输入过滤值"></el-input>
                <div class="handle-box mt-1">
                    <el-button @click="handleConfirm">确定</el-button>
                </div>
            </div> -->
    </template>
  </selecter-template>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
const props = defineProps({
  name: {
    type: String,
    default: ''
  },
  displayName: {
    type: String,
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
  aggregationType: {
    type: String as PropType<FilterStore.FilterAggregationsType>,
    default: ''
  },
  columnType: {
    type: String,
    default: ''
  }
})
const emits = defineEmits([
  'update:filterType',
  'update:filterValue',
  'update:displayName',
  'update:aggregationType'
])

const filterAggregations = ref([
  {
    label: '原始值',
    value: 'raw'
  },
  {
    label: '计数',
    value: 'count'
  },
  {
    label: '计数(去重)',
    value: 'countDistinct'
  },
  {
    label: '总计',
    value: 'sum'
  },
  {
    label: '平均',
    value: 'avg'
  },
  {
    label: '最大值',
    value: 'max'
  },
  {
    label: '最小值',
    value: 'min'
  }
])

// 是否存在过滤值
const hasFilterValue = computed(() => () => {
  const currentFilterType = filterOptions.find(
    (item) => item.value === localFilterType.value
  )
  return currentFilterType
    ? ['为空', '不为空'].includes(currentFilterType.label)
      ? false
      : true
    : false
})

const handleChangeAggregation = (
  aggregationType: FilterStore.FilterAggregationsType
) => {
  emits('update:aggregationType', aggregationType)
}

const filterOptions = [
  {
    label: '等于',
    value: '='
  },
  {
    label: '不等于',
    value: '!='
  },
  {
    label: '大于',
    value: '>'
  },
  {
    label: '大于等于',
    value: '>='
  },
  {
    label: '小于',
    value: '<'
  },
  {
    label: '小于等于',
    value: '<='
  },
  {
    label: '包含',
    value: 'like'
  },
  {
    label: '不包含',
    value: 'notLike'
  },
  {
    label: '为空',
    value: 'is Null'
  },
  {
    label: '不为空',
    value: 'is Not Null'
  }
]

const localFilterType = ref('')

const localFilterValue = ref('')

/**
 * @desc 点击确认按钮
 */
const handleConfirm = () => {
  // 修改父组件的显示的name
  const currentFilterOption = filterOptions.find(
    (item) => item.value === localFilterType.value
  )
  emits(
    'update:displayName',
    `${props.name} ${currentFilterOption?.label} ${localFilterValue.value ? localFilterValue.value : ''}`
  )
  emits('update:filterType', localFilterType.value)
  emits('update:filterValue', localFilterValue.value)
}

onMounted(() => {
  localFilterType.value = props.filterType
  localFilterValue.value = props.filterValue
})
</script>

<style lang="scss" scoped>
.filter-selecter {
  position: reactive;

  .handle-box {
    text-align: right;
  }
}
</style>

<style lang="scss" scoped></style>
