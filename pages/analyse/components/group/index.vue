<template>
  <!-- 分析页面下方分组 -->
  <div class="group relative h-full flex items-center" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="group__header flex items-center justify-between">
      <span class="group__title">分组</span>
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('group')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('group')"
      />
    </div>
    <div class="group__content flex items-center flex-1">
      <div
        data-action="drag"
        class="group__item mx-1"
        v-for="(item, index) in groupList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
      >
        <selecter-group
          class="group__item__name"
          cast="group"
          :displayName="item.displayName"
          :group="item"
          :column-name="item.columnName"
          :index="index"
          :invalid="item.__invalid"
          :invalidMessage="item.__invalidMessage"
        ></selecter-group>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { clearAllHandler } from '../clearAll'
const { clearAll, hasClearAll } = clearAllHandler()

const columnStore = useColumnStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()
/**
 * @desc groupList
 */
const groupList = computed(() => {
  return groupStore.getGroups
})

/**
 * @desc addGroup
 * @param {GroupStore.GroupOption|Array<GroupStore.GroupOption>} groups
 */
const addGroup = (group: GroupStore.GroupOption | Array<GroupStore.GroupOption>) => {
  group = Array.isArray(group) ? group : [group]
  groupStore.addGroups(group)
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
      from: 'group',
      index,
      value: groupList.value[index]
    })
  )
  // 不做任何自定义拖影，保持和dimension一致
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
  const data: DragData<ColumnStore.ColumnOption> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  const groupOption: GroupStore.GroupOption = {
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
  const isSelected = groupStore.getGroups.find((item) => item.columnName === groupOption.columnName)
  if (isSelected) {
    groupOption.__invalid = true
    groupOption.__invalidMessage = '该分组已存在'
  }
  const isInDimension = dimensionStore.getDimensions.find((item) => item.columnName === groupOption.columnName)
  if (isInDimension) {
    // TODO 提示用户已经选中了
    groupOption.__invalid = true
    groupOption.__invalidMessage = '该分组已存在'
  }
  const index = data.index
  switch (data.from) {
    case 'group': {
      // relocate postion by dragging
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const groups = JSON.parse(JSON.stringify(groupStore.getGroups))
      const target = groups.splice(data.index, 1)[0]
      groups.splice(targetIndex, 0, target)
      groupStore.setGroups(groups)
      break
    }
    default: {
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column: data.value, index })
      addGroup(groupOption)
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
