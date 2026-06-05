<template>
  <template v-if="inline">
    <div
      v-for="aggregation in filteredAggregations"
      :key="aggregation.value"
      class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
      @click="handleChangeAggregation(aggregation.value)"
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
        v-for="aggregation in filteredAggregations"
        :key="aggregation.value"
        class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
        @click="handleChangeAggregation(aggregation.value)"
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
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElPopover } from 'element-plus'
import type { MeasureAggregationType } from '@/shared/domainTypes'

type AggregationType = MeasureAggregationType

type AggregationOption = {
  label: string
  value: AggregationType
}

const props = withDefaults(
  defineProps<{
    columnType?: string
    aggregationType?: AggregationType
    includeRaw?: boolean
    inline?: boolean
    tooltip?: string
    emptyLabel?: string
  }>(),
  {
    columnType: '',
    aggregationType: undefined,
    includeRaw: false,
    inline: false,
    tooltip: '聚合方式',
    emptyLabel: '默认'
  }
)

const emit = defineEmits<{
  'update:aggregationType': [aggregationType: AggregationType]
}>()

const popoverRef = ref<InstanceType<typeof ElPopover>>()

const aggregationOptions: AggregationOption[] = [
  { label: '原始值', value: 'raw' },
  { label: '计数', value: 'count' },
  { label: '计数(去重)', value: 'countDistinct' },
  { label: '总计', value: 'sum' },
  { label: '平均', value: 'avg' },
  { label: '最大值', value: 'max' },
  { label: '最小值', value: 'min' }
]

const numericTypes = [
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

const dateTypes = ['date', 'time', 'year']

const filteredAggregations = computed(() => {
  const columnType = props.columnType?.toLowerCase() || ''
  const baseValues: AggregationType[] = props.includeRaw
    ? ['raw', 'count', 'countDistinct']
    : ['count', 'countDistinct']

  if (numericTypes.some((type) => columnType.includes(type))) {
    return aggregationOptions.filter((item) => props.includeRaw || item.value !== 'raw')
  }

  if (dateTypes.some((type) => columnType.includes(type))) {
    return aggregationOptions.filter((item) => [...baseValues, 'max', 'min'].includes(item.value))
  }

  return aggregationOptions.filter((item) => baseValues.includes(item.value))
})

const activeAggregationLabel = computed(() => {
  return aggregationOptions.find((item) => item.value === props.aggregationType)?.label || props.emptyLabel
})

const handleChangeAggregation = (aggregationType: AggregationType) => {
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
