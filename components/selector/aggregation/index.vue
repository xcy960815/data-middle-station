<template>
  <template v-if="inline">
    <div
      v-for="aggregation in filteredMeasureAggregationOptions"
      :key="aggregation.value"
      class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
      @click="handleChangeMeasureAggregation(aggregation.value)"
    >
      <span class="text-xs">{{ aggregation.label }}</span>
      <icon-park
        v-if="aggregation.value === aggregationType"
        class="aggregation-mark text-xs"
        type="correct"
        size="14"
        fill="#333"
      />
    </div>
  </template>
  <el-popover v-else placement="bottom-start" trigger="click" width="auto" ref="popoverRef">
    <template #reference>
      <el-tooltip :content="tooltip" placement="top">
        <button class="selector-aggregation-trigger" type="button" @click.stop @mousedown.stop>
          {{ activeAggregationLabel }}
        </button>
      </el-tooltip>
    </template>
    <template #default>
      <div
        v-for="aggregation in filteredMeasureAggregationOptions"
        :key="aggregation.value"
        class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
        @click="handleChangeMeasureAggregation(aggregation.value)"
      >
        <span class="text-xs">{{ aggregation.label }}</span>
        <icon-park
          v-if="aggregation.value === aggregationType"
          class="aggregation-mark text-xs"
          type="correct"
          size="14"
          fill="#333"
        />
      </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
import type { AnalyzeMeasureAggregationType } from '@/shared/analyzeConfigTypes'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElPopover } from 'element-plus'

type AggregationOption = {
  label: string
  value: AnalyzeMeasureAggregationType
}

const props = withDefaults(
  defineProps<{
    columnType?: string
    aggregationType?: AnalyzeMeasureAggregationType
    inline?: boolean
    tooltip?: string
    emptyLabel?: string
  }>(),
  {
    columnType: '',
    aggregationType: undefined,
    inline: false,
    tooltip: '聚合方式',
    emptyLabel: '请选择'
  }
)

const emit = defineEmits<{
  'update:aggregationType': [aggregationType: AnalyzeMeasureAggregationType]
}>()

const popoverRef = ref<InstanceType<typeof ElPopover>>()

/**
 * 聚合选项
 */
const measureAggregationOptions: AggregationOption[] = [
  { label: '计数', value: 'count' },
  { label: '计数(去重)', value: 'countDistinct' },
  { label: '总计', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' }
]

const numericDatabaseColumnTypeKeywords = [
  'int',
  'integer',
  'float',
  'double',
  'decimal',
  'numeric',
  'real',
  'tinyint',
  'smallint',
  'bigint',
  'number'
]

const dateDatabaseColumnTypeKeywords = ['date', 'time', 'year']

const filteredMeasureAggregationOptions = computed(() => {
  const columnType = props.columnType?.toLowerCase() || ''
  const nonNumericAggregationValues: AnalyzeMeasureAggregationType[] = ['count', 'countDistinct']

  if (numericDatabaseColumnTypeKeywords.some((type) => columnType.includes(type))) {
    return measureAggregationOptions
  }

  if (dateDatabaseColumnTypeKeywords.some((type) => columnType.includes(type))) {
    return measureAggregationOptions.filter((item) =>
      [...nonNumericAggregationValues, 'max', 'min'].includes(item.value)
    )
  }

  return measureAggregationOptions.filter((item) => nonNumericAggregationValues.includes(item.value))
})

const activeAggregationLabel = computed(() => {
  return measureAggregationOptions.find((item) => item.value === props.aggregationType)?.label || props.emptyLabel
})

const handleChangeMeasureAggregation = (aggregationType: AnalyzeMeasureAggregationType) => {
  emit('update:aggregationType', aggregationType)
  if (!props.inline) {
    popoverRef.value?.hide()
  }
}
</script>

<style scoped lang="scss">
.selector-aggregation-trigger {
  display: inline-flex;
  max-width: 48px;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: #606266;
  cursor: pointer;
  font-size: 11px;
  line-height: 1;
  padding: 0;
  white-space: nowrap;
  margin-right: 10px;
}
</style>
