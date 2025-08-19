<template>
  <div class="dimension relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="dimension__header flex items-center justify-between px-1">
      <span class="dimension__title">值</span>
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('dimension')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('dimension')"
      />
    </div>
    <div class="dimension__content flex-1">
      <div
        data-action="drag"
        class="dimension__item my-1"
        v-for="(dimension, index) in dimensions"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selecter-dimension
          class="dimension__item__name"
          cast="dimension"
          :columnName="dimension.columnName"
          :displayName="dimension.displayName"
          :dimension="dimension"
          :index="index"
          :invalid="dimension.__invalid"
          :invalidMessage="dimension.__invalidMessage"
        >
        </selecter-dimension>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SelecterDimension from '@/components/selecter/dimension/index.vue'
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
const { clearAll, hasClearAll } = clearAllHandler()

// 初始化数据
const columnStore = useColumnStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()

/**
 * @desc dimensions
 * @returns {ComputedRef<DimensionStore.DimensionOption[]>}
 */
const dimensions = computed(() => {
  return dimensionStore.getDimensions
})

/**
 * @desc groupList
 */
const groupList = computed<GroupStore.GroupState['groups']>(() => {
  return groupStore.getGroups
})

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
    .call(document.querySelectorAll('.dimension__content > [data-action="drag"]'))
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
 * @desc 发起拖拽
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragstartHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.dataTransfer?.setData(
    'text',
    JSON.stringify({
      from: 'dimension',
      index,
      value: dimensions.value[index]
    })
  )
}

/**
 * @desc 结束拖拽
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

/**
 * @desc 拖拽开始
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

/**
 * @desc 拖拽结束
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnStore.ColumnOption> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  const dimensionOption: DimensionStore.DimensionOption = {
    ...data.value,
    __invalid: false,
    __invalidMessage: '',
    fixed: null,
    align: null,
    width: null,
    showOverflowTooltip: false,
    filterable: false,
    sortable: false
  }

  const isSelected = dimensionStore.getDimensions.find((item) => item.columnName === dimensionOption.columnName)
  if (isSelected) {
    // TODO 提示用户已经选中了
    dimensionOption.__invalid = true
    dimensionOption.__invalidMessage = '该维度已存在'
  }
  // 判断是否跟groupList中的字段相同
  const isInGroup = groupList.value.find((item) => item.columnName === dimensionOption.columnName)
  if (isInGroup) {
    // TODO 提示用户已经选中了
    dimensionOption.__invalid = true
    dimensionOption.__invalidMessage = '该维度已存在'
  }
  const index = data.index
  switch (data.from) {
    case 'dimension':
      // 移动位置
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const dimensions = JSON.parse(JSON.stringify(dimensionStore.dimensions))
      const target = dimensions.splice(data.index, 1)[0]
      dimensions.splice(targetIndex, 0, target)
      dimensionStore.setDimensions(dimensions)
      break
    default:
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column: data.value, index })
      addDimension(dimensionOption)
      break
  }
}
</script>

<style lang="scss" scoped>
.dimension {
  .dimension__content {
    list-style: none;
    overflow: auto;

    .dimension__item {
      cursor: move;
      position: relative;
    }
  }
}
</style>
