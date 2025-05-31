<template>
  <div
    class="dimension relative h-full flex flex-col"
    @dragover="dragoverHandler"
    @drop="dropHandler"
  >
    <div class="dimension__title my-1">值</div>
    <div class="dimension__content flex-1">
      <div
        data-action="drag"
        class="dimension__item my-1"
        v-for="(item, index) in dimensionList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selecter-dimension
          class="dimension__item__name"
          cast="dimension"
          :name="item.columnName"
          v-model:displayName="item.displayName"
          :index="index"
          :invalid="item.__invalid"
        ></selecter-dimension>
      </div>
    </div>
    <!-- v-contextmenu:contextmenu -->
    <!-- 字段的操作选项 -->
    <!-- <context-menu ref="contextmenu">
        <context-menu-item @click="handleCreateComputedField">
          创建计算字段
        </context-menu-item>
      </context-menu> -->
    <!-- <client-only>
        <el-dialog
          v-model="createComputedFieldVisible"
          title="创建计算字段"
          width="30%"
        >
          <monaco-editor></monaco-editor>
          <template #footer>
            <span class="dialog-footer">
              <el-button
                @click="createComputedFieldVisible = false"
              >
                取消
              </el-button>
            </span>
          </template>
</el-dialog>
</client-only> -->
  </div>
</template>

<script setup lang="ts">
import SelecterDimension from '@/components/selecter/dimension/index.vue'

// 初始化数据
const columnStore = useColumnStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()

/**
 * @desc dimensionList
 * @returns {ComputedRef<DimensionStore.DimensionOption[]>}
 */
const dimensionList = computed(() => {
  return dimensionStore.getDimensions
})

/**
 * @desc groupList
 */
const groupList = computed<GroupStore.GroupState['groups']>(
  () => {
    return groupStore.getGroups
  }
)

const createComputedFieldVisible = ref<boolean>(false)

/**
 * @desc addDimension
 * @param {DimensionStore.DimensionOption|Array<DimensionStore.DimensionOption>} dimensions
 */
const addDimension = (
  dimension:
    | DimensionStore.DimensionOption
    | Array<DimensionStore.DimensionOption>
) => {
  dimension = Array.isArray(dimension)
    ? dimension
    : [dimension]
  dimensionStore.addDimensions(dimension)
}

/**
 * @desc addGroup
 * @param {GroupStore.GroupOption|Array<GroupStore.GroupOption>} groups
 */
const addGroup = (
  group:
    | GroupStore.GroupOption
    | Array<GroupStore.GroupOption>
) => {
  group = Array.isArray(group) ? group : [group]
  groupStore.addGroups(group)
}

/**
 * @desc getTargetIndex
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {number}
 */
const getTargetIndex = (
  index: number,
  dragEvent: DragEvent
): number => {
  const dropY = dragEvent.clientY // 落点Y
  let ys = [].slice
    .call(
      document.querySelectorAll(
        '.dimension__content > [data-action="drag"]'
      )
    )
    .map(
      (element: HTMLDivElement) =>
        (element.getBoundingClientRect().top +
          element.getBoundingClientRect().bottom) /
        2
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
const dragstartHandler = (
  index: number,
  dragEvent: DragEvent
) => {
  dragEvent.dataTransfer?.setData(
    'text',
    JSON.stringify({
      from: 'dimension',
      index,
      value: dimensionList.value[index]
    })
  )
}

/**
 * @desc 结束拖拽
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragHandler = (
  index: number,
  dragEvent: DragEvent
) => {
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
  // get drag data
  const data: DragData<
    | DimensionStore.DimensionOption
    | ColumnStore.ColumnOption
  > = JSON.parse(
    dragEvent.dataTransfer?.getData('text') || '{}'
  )
  const dimension =
    data.value as DimensionStore.DimensionOption
  const isSelected = dimensionStore.getDimensions.find(
    (item) => item.columnName === dimension.columnName
  )
  if (isSelected) {
    // 提示用户已经选中了
    return
  }
  // 判断是否跟groupList中的字段相同
  const isGroup = groupList.value.find(
    (item) => item.columnName === dimension.columnName
  )
  if (isGroup) {
    return
  }
  dimension.__invalid = false
  const column = data.value as ColumnStore.ColumnOption
  const index = data.index
  switch (data.from) {
    case 'dimension':
      // 移动位置
      const targetIndex = getTargetIndex(
        data.index,
        dragEvent
      )
      if (targetIndex === data.index) return
      const dimensions = JSON.parse(
        JSON.stringify(dimensionStore.dimensions)
      )
      const target = dimensions.splice(data.index, 1)[0]
      dimensions.splice(targetIndex, 0, target)
      dimensionStore.setDimensions(dimensions)
      break
    default:
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column, index })
      addDimension(dimension)
      break
  }
}

/**
 * @desc 创建计算字段
 * @return void
 */
const handleCreateComputedField = () => {
  console.log('创建计算字段')
  createComputedFieldVisible.value = true
}

/**
 * @desc 右键点击事件
 * @param {DimensionStore.DimensionOption} dimension
 */
const contextmenuHandler = (
  dimension: DimensionStore.DimensionOption
) => {
  console.log('dimension', dimension)
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
