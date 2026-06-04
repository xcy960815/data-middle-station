<template>
  <!-- 分析页面下方分组 -->
  <div class="group relative h-full flex items-center" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="group__header flex items-center justify-between">
      <span class="group__title">分组</span>
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('dimensions')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('dimensions')"
      />
    </div>
    <div class="group__content flex items-center flex-1">
      <div
        data-action="drag"
        class="group__item mx-1"
        v-for="(item, index) in dimensionList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
      >
        <selector-dimension
          class="group__item__name"
          cast="dimension"
          :displayName="item.displayName"
          :dimension="item"
          :column-name="item.columnName"
          :index="index"
          :invalid="getDimensionInvalid(item)"
          :invalidMessage="getDimensionInvalidMessage(item)"
        ></selector-dimension>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
const { clearAll, hasClearAll } = clearAllHandler()

const columnStore = useColumnsStore()
const measureStore = useMeasuresStore()
const dimensionStore = useDimensionsStore()
/**
 * @desc dimensionList
 */
const dimensionList = computed(() => {
  return dimensionStore.getDimensions
})

const dimensionColumnCountMap = computed(() => {
  return dimensionList.value.reduce<Record<string, number>>((countMap, item) => {
    if (!item.columnName) return countMap
    countMap[item.columnName] = (countMap[item.columnName] || 0) + 1
    return countMap
  }, {})
})

const measureColumnSet = computed(() => {
  return new Set(measureStore.getMeasures.map((item) => item.columnName).filter(Boolean))
})

const getDimensionInvalid = (dimension: DimensionStore.DimensionOption) => {
  return getDimensionInvalidMessage(dimension) !== ''
}

const getDimensionInvalidMessage = (dimension: DimensionStore.DimensionOption) => {
  if (!dimension.columnName) return ''
  if ((dimensionColumnCountMap.value[dimension.columnName] || 0) > 1) {
    return '该分组已存在'
  }
  if (measureColumnSet.value.has(dimension.columnName)) {
    return '该字段已在值中使用'
  }
  return ''
}

/**
 * @desc addDimension
 * @param {DimensionStore.DimensionOption|Array<DimensionStore.DimensionOption>} dimensions
 */
const addDimension = (dimension: DimensionStore.DimensionOption | Array<DimensionStore.DimensionOption>) => {
  dimension = Array.isArray(dimension) ? dimension : [dimension]
  dimensionStore.addDimensions(dimension)
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
    .call(document.querySelectorAll('.group__content > [data-action="drag"]'))
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
      from: 'dimensions',
      index,
      value: dimensionList.value[index]
    })
  )
  // 不做任何自定义拖影，保持和值字段一致
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
}
/**
 * @desc dropHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnsStore.ColumnOptions> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  const dimensionOption: DimensionStore.DimensionOption = {
    ...data.value,
    fixed: null,
    align: null,
    width: null,
    showOverflowTooltip: false,
    filterable: false,
    sortable: false
  }
  const index = data.index
  switch (data.from) {
    case 'dimensions': {
      // relocate position by dragging
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const dimensions = JSON.parse(JSON.stringify(dimensionStore.getDimensions))
      const target = dimensions.splice(data.index, 1)[0]
      dimensions.splice(targetIndex, 0, target)
      dimensionStore.setDimensions(dimensions)
      break
    }
    default: {
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column: data.value, index })
      addDimension(dimensionOption)
      break
    }
  }
}
</script>

<style lang="scss" scoped>
.group {
  .group__content {
    list-style: none;
    overflow: auto;

    .group__item {
      cursor: move;
      position: relative;
    }
  }
}
</style>
