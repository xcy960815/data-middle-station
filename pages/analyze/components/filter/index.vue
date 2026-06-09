<template>
  <div class="filter relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="filter__header flex items-center justify-between px-1">
      <span class="filter__title">筛选</span>
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('filters')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('filters')"
      />
    </div>
    <div class="filter__content flex-1">
      <div
        data-action="drag"
        class="filter__item my-1"
        v-for="(item, index) in filterList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selector-filter
          class="filter__item__name"
          :displayName="resolveFilterDisplayName(item)"
          :filter="item"
          :index="index"
          @before-open-where="handlePrepareWherePanel(item)"
        >
          <template #filter-aggregation>
            <el-tooltip effect="dark" :content="resolveFilterAggregationLabel(item)" placement="top">
              <span class="chart-selector-meta-label">{{ resolveFilterAggregationLabel(item) }}</span>
            </el-tooltip>
          </template>
          <template #filter-action>
            <icon-park class="chart-selector-filter-icon" type="filter-one" size="14" fill="#333" />
          </template>
          <template #aggregation-panel="{ closePopover }">
            <div
              v-for="option in getFilterAggregationOptions(item.columnType, true)"
              :key="option.value"
              class="aggregation-option flex items-center cursor-pointer hover:bg-gray-100 py-1 justify-between px-2"
              @click="handleSelectAggregation(item, option.value, closePopover)"
            >
              <span class="text-xs">{{ option.label }}</span>
              <icon-park
                v-if="item.filterRule.aggregation === option.value"
                class="aggregation-mark text-xs"
                type="correct"
                size="14"
                fill="#333"
              />
            </div>
          </template>
          <template #where-panel="{ closePopover }">
            <div class="filter-panel w-[220px]">
              <el-form label-position="top" size="small" class="filter-panel__form">
                <el-form-item label="条件">
                  <el-select v-model="getEditingFilterRule(item).operator" placeholder="请选择条件" class="w-full">
                    <el-option
                      v-for="option in getFilterOptions(item.columnType)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                </el-form-item>
                <el-form-item v-if="hasFilterValue(item)" label="值">
                  <el-date-picker
                    v-if="isDateColumn(item)"
                    v-model="getEditingFilterRule(item).operand"
                    type="datetime"
                    placeholder="请选择日期时间"
                    class="w-full"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    clearable
                  />
                  <el-input
                    v-else
                    v-model="getEditingFilterRule(item).operand"
                    :placeholder="isNumberColumn(item) ? '请输入数值' : '请输入值'"
                    clearable
                  />
                </el-form-item>
                <el-button type="primary" class="w-full" @click="handleConfirm(item, closePopover)">确定</el-button>
              </el-form>
            </div>
          </template>
        </selector-filter>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  prepareAnalyzeFilterFieldRuleForEdit,
  setAnalyzeFilterFieldAggregation
} from '@/shared/analyzeConfigFieldRules'
import { ANALYZE_FILTER_OPERATOR_MAP } from '@/shared/analyzeConfigTypes'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage } from 'element-plus'
import { getAnalyzeFieldAggregationLabel, getAnalyzeFieldAggregationOptions } from '../analyzeFieldAggregationOptions'
import { clearAllHandler } from '../clearAll'
import {
  addFieldToFilters,
  getAnalyzeFieldDropTargetIndex,
  reorderFilters,
  syncFilterOptionDisplayName
} from '../fieldTransfer'

const { clearAll, hasClearAll } = clearAllHandler()

const filterStore = useFiltersStore()
const filterList = computed(() => filterStore.getFilters)
const editingFilterRuleMap = reactive<Record<number, FilterStore.FilterOption['filterRule']>>({})

const DATE_COLUMN_TYPES = [
  'date',
  'datetime',
  'timestamp',
  'time',
  'year',
  'datetime2',
  'datetimeoffset',
  'smalldatetime'
]
const NUMBER_COLUMN_TYPES = [
  'tinyint',
  'smallint',
  'mediumint',
  'int',
  'integer',
  'bigint',
  'decimal',
  'float',
  'double',
  'real',
  'bit',
  'boolean',
  'serial',
  'number',
  'numeric'
]

type FilterOptionItem = {
  label: string
  value: FilterStore.FilterType
}

const resolveFilterDisplayName = (item: FilterStore.FilterOption) => {
  return item.displayName || item.columnComment || item.columnName || ''
}

const resolveFilterAggregationLabel = (item: FilterStore.FilterOption) => {
  return getAnalyzeFieldAggregationLabel(item.filterRule.aggregation)
}

const getFilterAggregationOptions = (columnType: string, includeRaw = true) => {
  return getAnalyzeFieldAggregationOptions(columnType, includeRaw)
}

const isDateColumnType = (columnType = '') => {
  const normalized = columnType.toLowerCase()
  return DATE_COLUMN_TYPES.some((type) => normalized.includes(type))
}

const isNumberColumnType = (columnType = '') => {
  const normalized = columnType.toLowerCase()
  return NUMBER_COLUMN_TYPES.some((type) => normalized.includes(type))
}

const isDateColumn = (item: FilterStore.FilterOption) => isDateColumnType(item.columnType)

const isNumberColumn = (item: FilterStore.FilterOption) => isNumberColumnType(item.columnType)

const getFilterOptions = (columnType = ''): FilterOptionItem[] => {
  const normalizedColumnType = columnType.toLowerCase()
  if (
    normalizedColumnType === 'string' ||
    normalizedColumnType.includes('char') ||
    normalizedColumnType.includes('text')
  ) {
    return [{ label: '包含', value: ANALYZE_FILTER_OPERATOR_MAP.包含 }]
  }
  if (isDateColumnType(columnType)) {
    return [
      { label: '等于', value: ANALYZE_FILTER_OPERATOR_MAP.等于 },
      { label: '大于', value: ANALYZE_FILTER_OPERATOR_MAP.大于 },
      { label: '大于等于', value: ANALYZE_FILTER_OPERATOR_MAP.大于等于 },
      { label: '小于', value: ANALYZE_FILTER_OPERATOR_MAP.小于 },
      { label: '小于等于', value: ANALYZE_FILTER_OPERATOR_MAP.小于等于 },
      { label: '为空', value: ANALYZE_FILTER_OPERATOR_MAP.为空 },
      { label: '不为空', value: ANALYZE_FILTER_OPERATOR_MAP.不为空 }
    ]
  }
  if (isNumberColumnType(columnType)) {
    return [
      { label: '等于', value: ANALYZE_FILTER_OPERATOR_MAP.等于 },
      { label: '不等于', value: ANALYZE_FILTER_OPERATOR_MAP.不等于 },
      { label: '大于', value: ANALYZE_FILTER_OPERATOR_MAP.大于 },
      { label: '大于等于', value: ANALYZE_FILTER_OPERATOR_MAP.大于等于 },
      { label: '小于', value: ANALYZE_FILTER_OPERATOR_MAP.小于 },
      { label: '小于等于', value: ANALYZE_FILTER_OPERATOR_MAP.小于等于 },
      { label: '为空', value: ANALYZE_FILTER_OPERATOR_MAP.为空 },
      { label: '不为空', value: ANALYZE_FILTER_OPERATOR_MAP.不为空 }
    ]
  }
  return [
    { label: '等于', value: ANALYZE_FILTER_OPERATOR_MAP.等于 },
    { label: '不等于', value: ANALYZE_FILTER_OPERATOR_MAP.不等于 },
    { label: '大于', value: ANALYZE_FILTER_OPERATOR_MAP.大于 },
    { label: '大于等于', value: ANALYZE_FILTER_OPERATOR_MAP.大于等于 },
    { label: '小于', value: ANALYZE_FILTER_OPERATOR_MAP.小于 },
    { label: '小于等于', value: ANALYZE_FILTER_OPERATOR_MAP.小于等于 },
    { label: '包含', value: ANALYZE_FILTER_OPERATOR_MAP.包含 },
    { label: '不包含', value: ANALYZE_FILTER_OPERATOR_MAP.不包含 },
    { label: '为空', value: ANALYZE_FILTER_OPERATOR_MAP.为空 },
    { label: '不为空', value: ANALYZE_FILTER_OPERATOR_MAP.不为空 }
  ]
}

const hasFilterValue = (item: FilterStore.FilterOption) => {
  const currentFilterOption = getFilterOptions(item.columnType).find(
    (option) => option.value === getEditingFilterRule(item).operator
  )
  if (!currentFilterOption) return false
  return !['为空', '不为空'].includes(currentFilterOption.label)
}

const getFilterEditKey = (item: FilterStore.FilterOption) => filterList.value.indexOf(item)

const getEditingFilterRule = (item: FilterStore.FilterOption) => {
  const index = getFilterEditKey(item)
  if (!editingFilterRuleMap[index]) {
    editingFilterRuleMap[index] = prepareAnalyzeFilterFieldRuleForEdit(
      item.filterRule,
      getFilterOptions(item.columnType)[0]?.value
    )
  }
  return editingFilterRuleMap[index]
}

const handlePrepareWherePanel = (item: FilterStore.FilterOption) => {
  const index = getFilterEditKey(item)
  editingFilterRuleMap[index] = prepareAnalyzeFilterFieldRuleForEdit(
    item.filterRule,
    getFilterOptions(item.columnType)[0]?.value
  )
}

const handleSelectAggregation = (
  item: FilterStore.FilterOption,
  aggregationType: FilterStore.FilterAggregationType,
  closePopover?: () => void
) => {
  item.filterRule = setAnalyzeFilterFieldAggregation(item.filterRule, aggregationType)
  syncFilterOptionDisplayName(item)
  closePopover?.()
}

const handleConfirm = (item: FilterStore.FilterOption, closePopover?: () => void) => {
  const editingFilterRule = getEditingFilterRule(item)
  if (!editingFilterRule.operator) {
    ElMessage.warning('请选择筛选条件')
    return
  }
  if (hasFilterValue(item) && !String(editingFilterRule.operand || '').trim()) {
    ElMessage.warning('请输入筛选值')
    return
  }
  item.filterRule = { ...editingFilterRule }
  syncFilterOptionDisplayName(item)
  closePopover?.()
}

const dragstartHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.dataTransfer?.setData(
    'text',
    JSON.stringify({
      from: 'filters',
      index,
      value: filterList.value[index]
    })
  )
}

const dragHandler = (_index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  if (!data.value) return

  switch (data.from) {
    case 'filters': {
      const targetIndex = getAnalyzeFieldDropTargetIndex(
        '.filter__content > [data-action="drag"]',
        data.index,
        dragEvent
      )
      if (targetIndex === data.index) return
      reorderFilters(data.index, targetIndex)
      break
    }
    default: {
      addFieldToFilters(data.value)
      break
    }
  }
}

watch(
  filterList,
  (filters) => {
    filters.forEach((item) => syncFilterOptionDisplayName(item))
  },
  { immediate: true, deep: true }
)
</script>

<style lang="scss" scoped>
.filter {
  .filter__content {
    list-style: none;
    overflow: auto;

    .filter__item {
      cursor: move;
      position: relative;
    }
  }
}

.filter-panel__form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    margin-bottom: 4px;
    padding: 0;
    line-height: 1.2;
    font-size: 12px;
  }
}
</style>
