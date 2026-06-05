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
          cast="filter"
          :columnName="item.columnName"
          :displayName="resolveFilterDisplayName(item)"
          :filter="item"
          :index="index"
          @before-open-where="handlePrepareWherePanel(item)"
        >
          <template #filter-aggregation>
            <span class="chart-selector-meta-label">{{ resolveFilterAggregationLabel(item) }}</span>
          </template>
          <template #filter-action>
            <icon-park class="chart-selector-filter-icon" type="filter-one" size="14" fill="#333" />
          </template>
          <template #context-menu>
            <context-menu-item
              v-for="option in getFilterAggregationOptions(item.columnType, true)"
              :key="option.value"
              @click="handleSelectAggregation(item, option.value)"
            >
              {{ option.label }}
              <span v-if="item.aggregationType === option.value" class="filter-panel__checked">✓</span>
            </context-menu-item>
          </template>
          <template #where-panel="{ closePopover }">
            <div class="filter-panel w-[220px]">
              <el-form label-position="top" size="small" class="filter-panel__form">
                <el-form-item label="条件">
                  <el-select v-model="item.filterType" placeholder="请选择条件" class="w-full">
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
                    v-model="item.filterValue"
                    type="datetime"
                    placeholder="请选择日期时间"
                    class="w-full"
                    value-format="YYYY-MM-DD HH:mm:ss"
                    clearable
                  />
                  <el-input
                    v-else
                    v-model="item.filterValue"
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
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage } from 'element-plus'
import { FILTER_TYPE_MAP } from '@/shared/domainTypes'
import { getOrderAggregationLabel, getOrderAggregationOptions } from '@/shared/orderAggregationOptions'
import { clearAllHandler } from '../clearAll'

const { clearAll, hasClearAll } = clearAllHandler()

const filterStore = useFiltersStore()
const filterList = computed(() => filterStore.getFilters)

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
  return getOrderAggregationLabel(item.aggregationType)
}

const syncFilterDisplayName = (item: FilterStore.FilterOption) => {
  item.displayName = item.columnComment || item.columnName || ''
}

const getFilterAggregationOptions = (columnType: string, includeRaw = true) => {
  return getOrderAggregationOptions(columnType, includeRaw)
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
    return [{ label: '包含', value: FILTER_TYPE_MAP.包含 }]
  }
  if (isDateColumnType(columnType)) {
    return [
      { label: '等于', value: FILTER_TYPE_MAP.等于 },
      { label: '大于', value: FILTER_TYPE_MAP.大于 },
      { label: '大于等于', value: FILTER_TYPE_MAP.大于等于 },
      { label: '小于', value: FILTER_TYPE_MAP.小于 },
      { label: '小于等于', value: FILTER_TYPE_MAP.小于等于 },
      { label: '为空', value: FILTER_TYPE_MAP.为空 },
      { label: '不为空', value: FILTER_TYPE_MAP.不为空 }
    ]
  }
  if (isNumberColumnType(columnType)) {
    return [
      { label: '等于', value: FILTER_TYPE_MAP.等于 },
      { label: '不等于', value: FILTER_TYPE_MAP.不等于 },
      { label: '大于', value: FILTER_TYPE_MAP.大于 },
      { label: '大于等于', value: FILTER_TYPE_MAP.大于等于 },
      { label: '小于', value: FILTER_TYPE_MAP.小于 },
      { label: '小于等于', value: FILTER_TYPE_MAP.小于等于 },
      { label: '为空', value: FILTER_TYPE_MAP.为空 },
      { label: '不为空', value: FILTER_TYPE_MAP.不为空 }
    ]
  }
  return [
    { label: '等于', value: FILTER_TYPE_MAP.等于 },
    { label: '不等于', value: FILTER_TYPE_MAP.不等于 },
    { label: '大于', value: FILTER_TYPE_MAP.大于 },
    { label: '大于等于', value: FILTER_TYPE_MAP.大于等于 },
    { label: '小于', value: FILTER_TYPE_MAP.小于 },
    { label: '小于等于', value: FILTER_TYPE_MAP.小于等于 },
    { label: '包含', value: FILTER_TYPE_MAP.包含 },
    { label: '不包含', value: FILTER_TYPE_MAP.不包含 },
    { label: '为空', value: FILTER_TYPE_MAP.为空 },
    { label: '不为空', value: FILTER_TYPE_MAP.不为空 }
  ]
}

const hasFilterValue = (item: FilterStore.FilterOption) => {
  const currentFilterOption = getFilterOptions(item.columnType).find((option) => option.value === item.filterType)
  if (!currentFilterOption) return false
  return !['为空', '不为空'].includes(currentFilterOption.label)
}

const handlePrepareWherePanel = (item: FilterStore.FilterOption) => {
  if (!item.aggregationType) {
    item.aggregationType = 'raw'
  }
  if (!item.filterType) {
    item.filterType = getFilterOptions(item.columnType)[0]?.value
  }
}

const handleSelectAggregation = (
  item: FilterStore.FilterOption,
  aggregationType: FilterStore.FilterAggregationType
) => {
  item.aggregationType = aggregationType
  syncFilterDisplayName(item)
}

const handleConfirm = (item: FilterStore.FilterOption, closePopover?: () => void) => {
  if (!item.filterType) {
    ElMessage.warning('请选择筛选条件')
    return
  }
  if (hasFilterValue(item) && !String(item.filterValue || '').trim()) {
    ElMessage.warning('请输入筛选值')
    return
  }
  syncFilterDisplayName(item)
  closePopover?.()
}

const addFilter = (filter: FilterStore.FilterOption | Array<FilterStore.FilterOption>) => {
  filter = Array.isArray(filter) ? filter : [filter]
  filterStore.addFilters(filter)
}

const getTargetIndex = (index: number, dragEvent: DragEvent): number => {
  const dropY = dragEvent.clientY
  const ys = [].slice
    .call(document.querySelectorAll('.filter__content > [data-action="drag"]'))
    .map(
      (element: HTMLDivElement) => (element.getBoundingClientRect().top + element.getBoundingClientRect().bottom) / 2
    )
  ys.splice(index, 1)
  let targetIndex = ys.findIndex((e) => dropY < e)
  if (targetIndex === -1) {
    targetIndex = ys.length
  }
  return targetIndex
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
  const data: DragData<FilterStore.FilterOption> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  const filter = data.value

  switch (data.from) {
    case 'filters': {
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const filters = JSON.parse(JSON.stringify(filterStore.filters))
      const target = filters.splice(data.index, 1)[0]
      filters.splice(targetIndex, 0, target)
      filterStore.setFilters(filters)
      break
    }
    default: {
      const filterOption: FilterStore.FilterOption = {
        ...filter,
        aggregationType: 'raw',
        filterValue: filter.filterValue || ''
      }
      syncFilterDisplayName(filterOption)
      addFilter(filterOption)
      break
    }
  }
}

watch(
  filterList,
  (filters) => {
    filters.forEach((item) => syncFilterDisplayName(item))
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

.filter-panel__checked {
  margin-left: 8px;
  color: #409eff;
}
</style>
