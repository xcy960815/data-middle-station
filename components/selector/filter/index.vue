<template>
  <selector-template v-bind="$attrs" :display-name="displayName" ref="selectorTemplateRef">
    <template #default>
      <!-- Step 1: 聚合方式列表 -->
      <template v-if="!aggregationType">
        <div
          class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 px-1 justify-between transition-colors"
          @click="handleChangeAggregation(filterAggregation.value)"
          v-for="filterAggregation in filterAggregations"
          :key="filterAggregation.value"
        >
          <span class="text-xs">{{ filterAggregation.label }}</span>
          <icon-park class="aggregation-mark text-xs" type="right" size="12" theme="outline" />
        </div>
      </template>

      <!-- Step 2: 过滤条件设置 -->
      <template v-else>
        <div class="filter-selector w-[200px]">
          <!-- 头部：返回按钮 + 当前聚合方式 -->
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <div
              class="flex items-center cursor-pointer text-gray-600 hover:text-blue-600 transition-colors group"
              @click="handleBackToStep1"
            >
              <icon-park type="left" size="12" class="mr-1" />
              <span class="text-xs font-medium">{{ currentAggregationLabel }}</span>
            </div>
          </div>

          <!-- 表单区域 -->
          <div class="space-y-3">
            <el-select v-model="localFilterType" placeholder="请选择条件" class="w-full" size="small">
              <el-option v-for="item in filterOptions" :key="item.value" :label="item.label" :value="item.value" />
            </el-select>

            <el-input
              v-if="hasFilterValue()"
              v-model="localFilterValue"
              placeholder="请输入值"
              size="small"
              clearable
            />

            <div class="flex justify-end pt-1">
              <el-button type="primary" size="small" @click="handleConfirm" class="w-full">确定</el-button>
            </div>
          </div>
        </div>
      </template>
    </template>
  </selector-template>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'

const props = defineProps({
  /**
   * @desc 名称
   */
  name: {
    type: String,
    default: ''
  },
  /**
   * @desc 显示名称
   */
  displayName: {
    type: String,
    default: ''
  },
  /**
   * @desc 过滤类型
   */
  filterType: {
    type: String,
    default: ''
  },
  /**
   * @desc 过滤值
   */
  filterValue: {
    type: String,
    default: ''
  },
  /**
   * @desc 聚合方式
   */
  aggregationType: {
    type: String as PropType<FilterStore.FilterAggregationType>,
    default: ''
  },
  /**
   * @desc 列类型
   */
  columnType: {
    type: String,
    default: ''
  }
})
const emits = defineEmits(['update:filterType', 'update:filterValue', 'update:displayName', 'update:aggregationType'])

/**
 * @desc 聚合方式
 */
const filterAggregations = ref<
  Array<{
    label: string
    value: FilterStore.FilterAggregationType
  }>
>([
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

/**
 * @desc 是否存在过滤值
 */
const hasFilterValue = computed(() => () => {
  const currentFilterType = filterOptions.value.find((item) => item.value === localFilterType.value)
  return currentFilterType ? (['为空', '不为空'].includes(currentFilterType.label) ? false : true) : false
})

/**
 * @desc 点击聚合方式
 */
const handleChangeAggregation = (aggregationType: FilterStore.FilterAggregationType) => {
  emits('update:aggregationType', aggregationType)
}

/**
 * @desc 返回第一步
 */
const handleBackToStep1 = () => {
  emits('update:aggregationType', '')
}

/**
 * @desc 当前聚合方式的显示名称
 */
const currentAggregationLabel = computed(() => {
  return filterAggregations.value.find((item) => item.value === props.aggregationType)?.label || '选择聚合'
})

/**
 * @desc 过滤选项
 */
const filterOptions = computed(() => {
  if (props.columnType === 'string') {
    // 字符串类型
    return [
      {
        label: '包含',
        value: 'like'
      }
    ]
  } else if (props.columnType === 'number') {
    return [
      {
        label: '等于',
        value: '='
      }
    ]
  } else if (props.columnType === 'date') {
    return [
      {
        label: '等于',
        value: '='
      }
    ]
  } else {
    return [
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
  }
})

/**
 * @desc 本地过滤类型
 */
const localFilterType = ref('')

/**
 * @desc 本地过滤值
 */
const localFilterValue = ref('')

/**
 * @desc 点击确认按钮
 */
const handleConfirm = () => {
  // 修改父组件的显示的name
  const currentFilterOption = filterOptions.value.find((item) => item.value === localFilterType.value)
  emits(
    'update:displayName',
    `${props.name} ${currentFilterOption?.label} ${localFilterValue.value ? localFilterValue.value : ''}`
  )
  emits('update:filterType', localFilterType.value)
  emits('update:filterValue', localFilterValue.value)
  selectorTemplateRef.value?.closePopover()
}

/**
 * @desc selector-template ref
 */
const selectorTemplateRef = ref()

onMounted(() => {
  localFilterType.value = props.filterType
  localFilterValue.value = props.filterValue
})
</script>

<style lang="scss" scoped>
.filter-selector {
  position: reactive;

  .handle-box {
    text-align: right;
  }
}
</style>
