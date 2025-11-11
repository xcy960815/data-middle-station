<template>
  <div class="column" @dragover="dragoverHandler" @drop="dropHandler">
    <!-- 数据源 -->
    <DataSourceSelecter @dataSource-change="queryTableColumn" />
    <div class="column__title py-2">维度</div>
    <div class="column__content">
      <div
        @contextmenu="contextmenuHandler(column, $event)"
        class="flex items-center"
        :class="columnClasses(column)"
        v-for="(column, index) in columnList"
        :key="index"
        draggable="true"
        @dragstart="dragstartHandler(column, index, $event)"
        @dragend="dragendHandler"
        @mousedown.stop
      >
        <icon-park
          class="mx-1"
          v-if="columnIconName(column)"
          :type="columnIconName(column)"
          size="14"
          fill="#333"
        ></icon-park>
        <span class="column__item__name text-ellipsis text-nowrap overflow-hidden">{{
          columnDisplayNames(column)
        }}</span>
      </div>
    </div>
    <!-- 字段的操作选项 -->
    <context-menu ref="contextmenu">
      <context-menu-item @click="setDataModel('测试')"> 测试菜单项 </context-menu-item>
      <context-menu-divider></context-menu-divider>
      <context-menu-submenu title="时间">
        <context-menu-item @click="setDataModel('时间')">时间</context-menu-item>
        <context-menu-item @click="setDataModel('日期')">日期</context-menu-item>
      </context-menu-submenu>
    </context-menu>
  </div>
</template>

<script setup lang="ts">
import ContextMenu from '@/components/context-menu/index.vue'
import DataSourceSelecter from '@/components/selecter/dataSource/index.vue'
import { IconPark } from '@icon-park/vue-next/es/all'
import { computed, ref, watch } from 'vue'
import { useAnalyzeStore } from '~/stores/analyze'
import { useChartConfigStore } from '~/stores/chart-config'
import { useColumnsStore } from '~/stores/columns'
import { useDimensionsStore } from '~/stores/dimensions'
import { useFiltersStore } from '~/stores/filters'
import { useGroupsStore } from '~/stores/groups'
import { useOrdersStore } from '~/stores/orders'

// 数字图标
const NUMBER_ICON_NAME = 'ListNumbers'

// 日期图标
const DATE_ICON_NAME = 'calendar-thirty'

// 字符串图标
const STRING_ICON_NAME = 'text'

const columnDisplayNames = (column: ColumnStore.ColumnOption) => {
  return column.displayName || column.columnName
}

/**
 * @desc 列类名
 * @param column {ColumnStore.ColumnOption} 列选项
 * @returns {string} 类名
 */
const columnClasses = computed(() => (column: ColumnStore.ColumnOption) => {
  const dimensionChoosed = useDimensionsStore().getDimensions.find(
    (dimensionOption: DimensionStore.DimensionOption) => dimensionOption.columnName === column.columnName
  )
  const groupChoosed = useGroupsStore().getGroups.find(
    (groupOption: GroupStore.GroupOption) => groupOption.columnName === column.columnName
  )
  return {
    column__item: true, // 默认类名
    column__item_dimension_choosed: dimensionChoosed, // 维度选中
    column__item_group_choosed: groupChoosed // 分组选中
  }
})

/**
 * @desc 根据列类型返回对应的图标名称
 * @param column {ColumnStore.ColumnOption} 列选项
 * @returns {string} 图标名称
 */
const columnIconName = computed(() => (column: ColumnStore.ColumnOption) => {
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
})

const columnStore = useColumnsStore()
const analyzeStore = useAnalyzeStore()
const filterStore = useFiltersStore()
const orderStore = useOrdersStore()
const chartConfigStore = useChartConfigStore()
const dimensionStore = useDimensionsStore()
const groupStore = useGroupsStore()

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

const contextmenu = ref<InstanceType<typeof ContextMenu> | null>(null)

/**
 * @desc 拖拽开始事件
 * @param column {ColumnStore.ColumnOption} 列选项
 * @param index {number} 列索引
 * @param event {DragEvent} 拖拽事件
 */
const dragstartHandler = (column: ColumnStore.ColumnOption, index: number, event: DragEvent) => {
  if (!event.dataTransfer) return
  event.dataTransfer.setData(
    'text/plain',
    JSON.stringify({
      from: 'columns',
      type: 'single',
      index,
      value: column
    })
  )
  // 克隆.flex.items-center父级容器，保证拖影和原节点样式完全一致
  const target = event.target as HTMLElement
  if (target) {
    const parent = target.closest('.flex.items-center') as HTMLElement
    if (parent) {
      const dragNode = parent.cloneNode(true) as HTMLElement
      // 复制所有 data-v-xxx 属性
      for (const attr of parent.attributes) {
        if (attr.name.startsWith('data-v-')) {
          dragNode.setAttribute(attr.name, attr.value)
        }
      }
      dragNode.style.position = 'absolute'
      dragNode.style.top = '-9999px'
      dragNode.style.left = '-9999px'
      dragNode.style.pointerEvents = 'none'
      dragNode.style.opacity = '0.9'
      dragNode.style.margin = '0'
      dragNode.style.width = `${parent.offsetWidth}px`
      dragNode.style.height = `${parent.offsetHeight}px`
      dragNode.style.background = '#f0f0f0'
      // 同步padding、box-sizing、border-radius、box-shadow、height、line-height、font-size
      const computedStyle = window.getComputedStyle(parent)
      dragNode.style.padding = computedStyle.padding
      dragNode.style.boxSizing = computedStyle.boxSizing
      dragNode.style.borderRadius = computedStyle.borderRadius
      dragNode.style.boxShadow = computedStyle.boxShadow
      dragNode.style.height = computedStyle.height
      dragNode.style.lineHeight = computedStyle.lineHeight
      dragNode.style.fontSize = computedStyle.fontSize
      document.body.appendChild(dragNode)
      event.dataTransfer.setDragImage(dragNode, dragNode.offsetWidth / 2, dragNode.offsetHeight / 2)
      setTimeout(() => document.body.removeChild(dragNode), 0)
    }
  }
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
  const data: DragData<ColumnStore.ColumnOption> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  const columnIndex = columnStore.getColumns.findIndex(
    (column: ColumnStore.ColumnOption) => column.columnName === data.value.columnName
  )

  switch (data.from) {
    case 'dimensions':
      const dimensionSrore = useDimensionsStore()
      dimensionSrore.removeDimension(data.index)
      break
    case 'filters':
      const filterStore = useFiltersStore()
      filterStore.removeFilter(data.index)
      break
    case 'orders':
      const orderStore = useOrdersStore()
      orderStore.removeOrder(data.index)
      break
    case 'groups':
      const groupStore = useGroupsStore()
      groupStore.removeGroup(data.index)
      columnStore.updateColumn({
        column: data.value,
        index: columnIndex
      })
      break
    case 'columns':
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
const contextmenuHandler = (column: ColumnStore.ColumnOption, event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  currentColumn.value = column

  // 显示右键菜单
  if (contextmenu.value) {
    contextmenu.value.show(event)
  }
}

/**
 * @desc 设置数据模型
 */
const setDataModel = (dataType: string) => {
  if (!currentColumn.value) return

  // 这里可以根据不同的数据类型进行相应的处理
  // 例如：更新列的数据模型类型、保存到store等
  switch (dataType) {
    case '商家ID':
    case '买家ID':
    case '商品ID':
    case '作者ID':
    case '动态ID':
    case '视频ID':
      // 处理ID类型
      console.log(`设置 ${currentColumn.value.columnName} 为ID类型: ${dataType}`)
      break
    case '图片Url':
      // 处理URL类型
      console.log(`设置 ${currentColumn.value.columnName} 为URL类型: ${dataType}`)
      break
    case '时间':
    case '日期':
      // 处理时间类型
      console.log(`设置 ${currentColumn.value.columnName} 为时间类型: ${dataType}`)
      break
    case '经度':
    case '纬度':
    case '位置':
    case '关联值':
      // 处理地理类型
      console.log(`设置 ${currentColumn.value.columnName} 为地理类型: ${dataType}`)
      break
    default:
      console.log(`设置 ${currentColumn.value.columnName} 为未知类型: ${dataType}`)
  }
}

/**
 * @desc 监听表格数据源变化
 */
watch(
  () => columnStore.getDataSource,
  async (newDataSource, oldDataSource) => {
    if (!newDataSource) {
      // 如果数据源为空，清空图表数据
      analyzeStore.setChartData([])
      // 如果数据源为空，清空筛选条件
      filterStore.setFilters([])
      // 如果数据源为空，清空排序条件
      orderStore.setOrders([])
      // 如果数据源为空，清空分组条件
      groupStore.setGroups([])
      // 如果数据源为空，清空维度条件
      dimensionStore.setDimensions([])
      // 如果数据源为空，清空图表配置
      chartConfigStore.setPrivateChartConfig(null)
      // 如果数据源为空，清空图表配置条件
      columnStore.setColumns([])
    }
    // else {
    //   await queryTableColumn(newDataSource)
    //   const hasFilter = filterStore.getFilters.length > 0
    //   hasFilter && filterStore.setFilters([])
    //   const hasOrder = orderStore.getOrders.length > 0
    //   hasOrder && orderStore.setOrders([])
    //   const hasGroup = groupStore.getGroups.length > 0
    //   hasGroup && groupStore.setGroups([])
    //   const hasDimension = dimensionStore.getDimensions.length > 0
    //   hasDimension && dimensionStore.setDimensions([])
    // }
  }
)

/**
 * @desc 查询表格列
 * @param tableName
 * @returns {Promise<void>}
 */
const queryTableColumn = async (tableName: string) => {
  const result = await httpRequest('/api/queryTableColumn', {
    params: {
      tableName
    }
  })
  if (result.code === 200) {
    const cloumns = result.data?.map((item) => {
      return {
        ...item,
        columnName: item.columnName || '',
        columnType: item.columnType || '',
        columnComment: item.columnComment || '',
        displayName: item.displayName || ''
      }
    })
    columnStore.setColumns(cloumns || [])
  } else {
    columnStore.setDataSourceOptions([])
  }
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
      font-size: 12px;
      cursor: move;
      height: 24px;
      line-height: 24px;
      position: relative;
      background-color: #f0f0f0;
      border-radius: 4px;
      margin-bottom: 5px;

      &.column__item_dimension_choosed::before {
        position: absolute;
        left: 5px;
        top: 9px;
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #54c32a;
      }

      &.column__item_group_choosed::after {
        position: absolute;
        left: 5px;
        top: 9px;
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
