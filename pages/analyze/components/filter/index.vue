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
        >
          <template #filter-suffix>
            <button v-if="item.aggregationType" class="chart-selector-meta-label" type="button" @mousedown.stop>
              {{ resolveFilterAggregationLabel(item) }}
            </button>
          </template>
          <template #default="{ closePopover }">
            <template v-if="!item.aggregationType">
              <selector-aggregation
                inline
                :include-raw="true"
                :column-type="item.columnType"
                :aggregation-type="item.aggregationType"
                tooltip="筛选聚合方式"
                empty-label="选择聚合"
                @update:aggregation-type="handleChangeAggregation(item, $event)"
              />
            </template>
            <template v-else>
              <div class="filter-panel w-[200px]">
                <div class="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                  <div
                    class="flex items-center cursor-pointer text-gray-600 hover:text-blue-600 transition-colors group"
                    @click="handleBackToStep1(item)"
                  >
                    <icon-park type="left" size="12" class="mr-1" />
                    <span class="text-xs font-medium">{{ resolveFilterAggregationLabel(item) }}</span>
                  </div>
                </div>
                <div class="space-y-3">
                  <el-select v-model="item.filterType" placeholder="请选择条件" class="w-full" size="small">
                    <el-option
                      v-for="option in getFilterOptions(item.columnType)"
                      :key="option.value"
                      :label="option.label"
                      :value="option.value"
                    />
                  </el-select>
                  <el-input
                    v-if="hasFilterValue(item)"
                    v-model="item.filterValue"
                    placeholder="请输入值"
                    size="small"
                    clearable
                  />
                  <div class="flex justify-end pt-1">
                    <el-button type="primary" size="small" class="w-full" @click="handleConfirm(item, closePopover)">
                      确定
                    </el-button>
                  </div>
                </div>
              </div>
            </template>
          </template>
        </selector-filter>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import SelectorAggregation from '@/components/selector/aggregation/index.vue'
import { FILTER_TYPE_MAP } from '@/shared/domainTypes'
import { getOrderAggregationLabel } from '@/shared/orderAggregationOptions'
import { clearAllHandler } from '../clearAll'

const { clearAll, hasClearAll } = clearAllHandler()

const filterStore = useFiltersStore()
const filterList = computed(() => filterStore.getFilters)

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

const getFilterOptions = (columnType = ''): FilterOptionItem[] => {
  if (columnType === 'string') {
    return [{ label: '包含', value: FILTER_TYPE_MAP.包含 }]
  }
  if (columnType === 'number' || columnType === 'date') {
    return [{ label: '等于', value: FILTER_TYPE_MAP.等于 }]
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

const handleChangeAggregation = (
  item: FilterStore.FilterOption,
  aggregationType: FilterStore.FilterAggregationType
) => {
  item.aggregationType = aggregationType
}

const handleBackToStep1 = (item: FilterStore.FilterOption) => {
  item.aggregationType = '' as FilterStore.FilterAggregationType
}

const handleConfirm = (item: FilterStore.FilterOption, closePopover?: () => void) => {
  const currentFilterOption = getFilterOptions(item.columnType).find((option) => option.value === item.filterType)
  item.displayName = `${item.columnName} ${currentFilterOption?.label || ''} ${item.filterValue || ''}`.trim()
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
      addFilter({
        ...filter,
        aggregationType: filter.aggregationType || ('' as FilterStore.FilterAggregationType),
        filterValue: filter.filterValue || ''
      })
      break
    }
  }
}
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
</style>
