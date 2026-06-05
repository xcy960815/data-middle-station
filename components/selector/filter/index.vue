<template>
  <div class="filter-selector">
    <selector-template v-bind="$attrs" :display-name="displayName" ref="selectorTemplateRef">
      <template #filter-suffix>
        <slot name="filter-suffix"></slot>
      </template>
      <template #default>
        <!-- Step 1: 聚合方式列表 -->
        <template v-if="!aggregationType">
          <selector-aggregation
            inline
            :include-raw="true"
            :column-type="columnType"
            :aggregation-type="aggregationType"
            tooltip="筛选聚合方式"
            empty-label="选择聚合"
            @update:aggregation-type="handleChangeAggregation"
          />
        </template>

        <!-- Step 2: 过滤条件设置 -->
        <template v-else>
          <div class="filter-selector__panel w-[200px]">
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
  </div>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import SelectorAggregation from '../aggregation/index.vue'

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

const aggregationLabelMap: Record<FilterStore.FilterAggregationType, string> = {
  raw: '原始值',
  count: '计数',
  countDistinct: '计数(去重)',
  sum: '总计',
  avg: '平均',
  max: '最大值',
  min: '最小值'
}

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
  return aggregationLabelMap[props.aggregationType as FilterStore.FilterAggregationType] || '选择聚合'
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
  position: relative;

  .handle-box {
    text-align: right;
  }
}
</style>
