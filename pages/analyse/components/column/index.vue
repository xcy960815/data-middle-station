<template>
  <div
    class="column"
    @dragover="dragoverHandler"
    @drop="dropHandler"
  >
    <!-- 数据源 -->
    <TableSelecter />

    <div class="column__title pt-2 pb-2">维度</div>
    <div class="column__content">
      <div
        @contextmenu="contextmenuHandler(column)"
        class="flex items-center"
        :class="columnClasses(column)"
        v-for="(column, index) in columnList"
        :key="index"
        draggable="true"
        @dragstart="dragstartHandler(column, index, $event)"
        @dragend="dragendHandler"
        @mousedown.stop
      >
        <Icon
          class="mt-[1px] mr-[1px]"
          width="14"
          height="14"
          :rotate="2"
          :horizontalFlip="true"
          :verticalFlip="true"
          :icon="columnIconName(column)"
        />
        <span class="column__item__name">{{
          column.columnName
        }}</span>
      </div>
    </div>
    <!-- v-contextmenu:contextmenu -->
    <!-- 字段的操作选项 -->
    <context-menu ref="contextmenu">
      <context-menu-item @click="setDataModel">
        商家ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        买家ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        商品ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        作者ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        动态ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        视频ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        图片Url
      </context-menu-item>
      <context-menu-divider> </context-menu-divider>
      <context-menu-submenu title="时间">
        <context-menu-item @click="setDataModel"
          >时间</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >日期</context-menu-item
        >
      </context-menu-submenu>
      <context-menu-divider> </context-menu-divider>
      <context-menu-submenu title="地理角色">
        <context-menu-item @click="setDataModel"
          >经度</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >纬度</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >位置</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >关联值</context-menu-item
        >
      </context-menu-submenu>
    </context-menu>
  </div>
</template>

<script setup lang="ts">
import TableSelecter from '@/components/selecter/table/index.vue'
import Icon from '@/components/context-menu/Icon.vue'
import ContextMenu from '@/components/context-menu/index.vue'
import { ref, computed } from 'vue'
import { useColumnStore } from '@/stores/analyse/column'
import { useDimensionStore } from '@/stores/analyse/dimension'
import { useGroupStore } from '@/stores/analyse/group'
import { useFilterStore } from '@/stores/analyse/filter'
import { useOrderStore } from '@/stores/analyse/order'

// 常量定义
const NUMBER_ICON_NAME = 'ant-design:number-outlined'

const DATE_ICON_NAME = 'ant-design:calendar-outlined'

const STRING_ICON_NAME = 'ant-design:field-string-outlined'

/**
 * @desc 列类名
 * @param column {ColumnStore.ColumnOption} 列选项
 * @returns {string} 类名
 */
const columnClasses = computed(
  () => (column: ColumnStore.ColumnOption) => {
    const dimensionChoosed =
      useDimensionStore().getDimensions.find(
        (dimensionOption: DimensionStore.DimensionOption) =>
          dimensionOption.columnName === column.columnName
      )
    const groupChoosed = useGroupStore().getGroups.find(
      (groupOption: GroupStore.GroupOption) =>
        groupOption.columnName === column.columnName
    )
    return {
      column__item: true, // 默认类名
      column__item_dimension_choosed: dimensionChoosed, // 维度选中
      column__item_group_choosed: groupChoosed // 分组选中
    }
  }
)

/**
 * @desc 根据列类型返回对应的图标名称
 * @param column {ColumnStore.ColumnOption} 列选项
 * @returns {string} 图标名称
 */
const columnIconName = computed(
  () => (column: ColumnStore.ColumnOption) => {
    const { columnType } = column
    if (columnType === 'number') {
      return NUMBER_ICON_NAME
    } else if (columnType === 'date') {
      return DATE_ICON_NAME
    } else if (columnType === 'string') {
      return STRING_ICON_NAME
    } else {
      return ''
    }
  }
)

const columnStore = useColumnStore()

/**
 * @desc 列列表
 */
const columnList = computed(() => {
  return columnStore.getColumns
})

/**
 * @desc 当前选中的列
 */
const currentColumn = ref<ColumnStore.ColumnOption>()

/**
 * @desc 拖拽开始事件
 * @param column {ColumnStore.ColumnOption} 列选项
 * @param index {number} 列索引
 * @param event {DragEvent} 拖拽事件
 */
const dragstartHandler = (
  column: ColumnStore.ColumnOption,
  index: number,
  event: DragEvent
) => {
  event.dataTransfer?.setData(
    'text/plain',
    JSON.stringify({
      from: 'column',
      type: 'single',
      index,
      value: column
    })
  )
}

/**
 * @desc 拖拽结束事件
 * @param event {DragEvent} 拖拽事件
 */
const dragendHandler = (event: DragEvent) => {
  event.preventDefault()
}

/**
 * @desc 拖拽悬停事件
 * @param dragEvent {DragEvent} 拖拽事件
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

/**
 * @desc 拖拽放下事件
 * @param dragEvent {DragEvent} 拖拽事件
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnStore.ColumnOption> =
    JSON.parse(
      dragEvent.dataTransfer?.getData('text') || '{}'
    )
  const columnIndex = columnStore.getColumns.findIndex(
    (column: ColumnStore.ColumnOption) =>
      column.columnName === data.value.columnName
  )

  switch (data.from) {
    case 'dimension':
      const dimensionSrore = useDimensionStore()
      dimensionSrore.removeDimension(data.index)
      break
    case 'filter':
      const filterStore = useFilterStore()
      filterStore.removeFilter(data.index)
      break
    case 'order':
      const orderStore = useOrderStore()
      orderStore.removeOrder(data.index)
      break
    case 'group':
      const groupStore = useGroupStore()
      groupStore.removeGroup(data.index)
      columnStore.updateColumn({
        column: data.value,
        index: columnIndex
      })
      break
    case 'column':
      break
    default:
      console.error('未知拖拽类型', data.from)
      break
  }
}

/**
 * @desc 右键点击事件
 * @param column {ColumnStore.ColumnOption} 列选项
 */
const contextmenuHandler = (
  column: ColumnStore.ColumnOption
) => {
  currentColumn.value = column
}

/**
 * @desc 设置数据模型
 */
const setDataModel = () => {
  console.log('column', currentColumn.value)
}
</script>

<style scoped lang="scss">
.column {
  height: 100%;
  pointer-events: initial;
  display: flex;
  flex-direction: column;

  .column__content {
    flex: 1;
    overflow-y: auto;
    list-style: none;
    // overflow: auto;

    .column__item {
      padding: 0 10px;
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 5px;

      &.column__item_dimension_choosed::before {
        position: absolute;
        left: 5px;
        top: 13px;
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #54c32a;
      }

      &.column__item_group_choosed::after {
        position: absolute;
        left: 0px;
        top: 14px;
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #1292f7;
      }
    }
  }
}
</style>
