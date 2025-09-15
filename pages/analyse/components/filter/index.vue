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
    <div class="filter__content flex-auto">
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
        <selecter-filter
          class="filter__item__name"
          cast="filter"
          :name="item.columnName"
          v-model:filterType="item.filterType"
          v-model:displayName="item.displayName"
          v-model:filterValue="item.filterValue"
          v-model:aggregationType="item.aggregationType"
          :column-type="item.columnType"
          :index="index"
        >
        </selecter-filter>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
const { clearAll, hasClearAll } = clearAllHandler()

const filterStore = useFiltersStore()
const filterList = computed(() => filterStore.getFilters)
/**
 * @desc addFilter
 * @param filter {FilterStore.FilterOption | Array<FilterStore.FilterOption>}
 * @returns {void}
 */
const addFilter = (filter: FilterStore.FilterOption | Array<FilterStore.FilterOption>) => {
  filter = Array.isArray(filter) ? filter : [filter]
  filterStore.addFilters(filter)
}
/**
 * @desc getTargetIndex
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {number}
 */
const getTargetIndex = (index: number, dragEvent: DragEvent): number => {
  const dropY = dragEvent.clientY // 落点Y
  let ys = [].slice
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

/**
 * @desc dragstartHandler
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
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
/**
 * @desc dragHandler
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragHandler = (_index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}
/**
 * @desc dragoverHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  // dragEvent.dataTransfer.dropEffect = 'move';
}
/**
 * @desc dropHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<FilterStore.FilterOption> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  // 自己处理成自己需要的数据
  const filter = data.value

  switch (data.from) {
    case 'filters': {
      // 调整位置
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const filters = JSON.parse(JSON.stringify(filterStore.filters))
      const target = filters.splice(data.index, 1)[0]
      filters.splice(targetIndex, 0, target)
      filterStore.setFilters(filters)
      break
    }
    default: {
      addFilter(filter)
      break
    }
  }
}
</script>

<style lang="scss" scoped>
.filter {
  pointer-events: initial;

  .filter__content {
    list-style: none;
    overflow: auto;

    .filter__item {
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
