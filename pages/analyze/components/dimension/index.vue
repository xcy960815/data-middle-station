<template>
  <div class="dimension relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="dimension__header flex items-center justify-between px-1">
      <span class="dimension__title">值</span>
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('dimensions')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('dimensions')"
      />
    </div>
    <div class="dimension__content flex-1" @contextmenu.prevent="handleContextMenu">
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
        <selector-dimension
          class="dimension__item__name"
          cast="dimension"
          :columnName="dimension.columnName"
          :displayName="dimension.displayName"
          :dimension="dimension"
          :index="index"
          :invalid="dimension.__invalid"
          :invalidMessage="dimension.__invalidMessage"
        >
        </selector-dimension>
      </div>
    </div>
    <context-menu ref="contextmenuRef">
      <context-menu-item @click="handleCreateCustomColumn">创建自定义列</context-menu-item>
    </context-menu>

    <!-- 自定义列弹窗 -->
    <el-dialog v-model="customColumnDialogVisible" title="创建自定义列" width="800px" append-to-body>
      <div class="flex h-[400px] border border-gray-200 overflow-hidden">
        <div class="flex-1 h-full border-r border-gray-200 min-w-0">
          <monaco-editor
            v-model="customColumnSql"
            language="sql"
            height="100%"
            width="100%"
            :databaseOptions="databaseOptions"
            :customKeywords="customKeywords"
          />
        </div>
        <!-- 右侧字段列表 -->
        <div class="w-[200px] h-full overflow-y-auto bg-gray-50">
          <div class="p-2 text-sm font-bold border-b border-gray-200">可用字段</div>
          <div class="p-2">
            <div
              v-for="col in columnStore.getColumns"
              :key="col.columnName"
              class="mb-2 text-xs cursor-pointer hover:bg-gray-200 p-1 rounded"
              @click="insertColumnToEditor(col.columnName)"
            >
              <div class="font-medium text-gray-700">{{ col.displayName }}</div>
              <div class="flex items-center justify-between text-gray-500 mt-1">
                <span>{{ col.columnName }}</span>
                <span class="bg-gray-200 px-1 rounded scale-90 origin-right">{{ getColumnType(col) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="customColumnDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmCustomColumn">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import ContextMenu from '../../../../components/context-menu/index.vue'
import { clearAllHandler } from '../clearAll'

const MonacoEditor = defineAsyncComponent(() => import('../../../../components/monaco-editor/index.vue'))

const { clearAll, hasClearAll } = clearAllHandler()

// 初始化数据
const columnStore = useColumnsStore()
const dimensionStore = useDimensionsStore()
const groupStore = useGroupsStore()

/**
 * @desc dimensions 数据
 * @returns {ComputedRef<DimensionStore.DimensionOption[]>}
 */
const dimensions = computed(() => {
  return dimensionStore.getDimensions
})

/**
 * @desc groupList 数据
 */
const groupList = computed<GroupStore.GroupState['groups']>(() => {
  return groupStore.getGroups
})

/**
 * @desc addDimension 添加维度
 * @param {DimensionStore.DimensionOption|Array<DimensionStore.DimensionOption>} dimensions
 */
const addDimension = (dimension: DimensionStore.DimensionOption | Array<DimensionStore.DimensionOption>) => {
  dimension = Array.isArray(dimension) ? dimension : [dimension]
  dimensionStore.addDimensions(dimension)
}

/**
 * @desc getTargetIndex 获取目标索引
 * @param {number} index 源索引
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {number} 目标索引
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
 * @param {number} index 源索引
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dragstartHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.dataTransfer?.setData(
    'text',
    JSON.stringify({
      from: 'dimensions',
      index,
      value: dimensions.value[index]
    })
  )
}

/**
 * @desc 结束拖拽
 * @param {number} index 源索引
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dragHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

/**
 * @desc 拖拽开始
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

/**
 * @desc 拖拽结束
 * @param {DragEvent} dragEvent 拖拽事件
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnsStore.ColumnOptions> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
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
    dimensionOption.__invalid = true
    dimensionOption.__invalidMessage = '该维度已存在'
  }
  // 判断是否跟groupList中的字段相同
  const isInGroup = groupList.value.find((item) => item.columnName === dimensionOption.columnName)
  if (isInGroup) {
    dimensionOption.__invalid = true
    dimensionOption.__invalidMessage = '该维度已存在'
  }
  const index = data.index
  switch (data.from) {
    case 'dimensions': {
      // 移动位置
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const dimensions = JSON.parse(JSON.stringify(dimensionStore.dimensions))
      const target = dimensions.splice(data.index, 1)[0]
      dimensions.splice(targetIndex, 0, target)
      dimensionStore.setDimensions(dimensions)
      break
    }
    default:
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column: data.value, index })
      addDimension(dimensionOption)
      break
  }
}

/**
 * @desc 右键菜单引用
 */
const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

/**
 * @desc 右键菜单事件
 * @param {MouseEvent} event
 */
const handleContextMenu = (event: MouseEvent) => {
  event.preventDefault()
  if (contextmenuRef.value) {
    contextmenuRef.value.show(event)
  }
}

/**
 * @desc 创建自定义列
 */
const handleCreateCustomColumn = () => {
  customColumnDialogVisible.value = true
}

/**
 * @desc 自定义列弹窗可见性
 */
const customColumnDialogVisible = ref(false)

/**
 * @desc 自定义列 SQL
 */
const customColumnSql = ref('')

/**
 * @desc 确认创建自定义列
 */
const handleConfirmCustomColumn = () => {
  console.log('Custom Column SQL:', customColumnSql.value)
  // TODO: Implement actual creation logic
  customColumnDialogVisible.value = false
  customColumnSql.value = ''
}

/**
 * @desc 数据库选项，用于 SQL 联想
 */
const databaseOptions = computed(() => {
  const columns = columnStore.getColumns
  const fieldOptions = columns.map((col: any) => ({
    fieldName: col.columnName,
    fieldType: col.type || col.dataType || 'string',
    fieldComment: col.displayName,
    databaseName: 'default',
    tableName: 'current_table'
  }))

  return [
    {
      databaseName: 'default',
      tableOptions: [
        {
          tableName: 'current_table',
          tableComment: '当前表',
          fieldOptions: fieldOptions
        }
      ]
    }
  ]
})

/**
 * @desc 自定义关键字，用于 SQL 联想
 */
const customKeywords = computed(() => {
  return ['SUM', 'COUNT', 'AVG', 'MAX', 'MIN']
})

/**
 * @desc 插入字段到编辑器
 * @param {string} columnName 字段名
 */
const insertColumnToEditor = (columnName: string) => {
  customColumnSql.value += ` ${columnName}`
}

/**
 * @desc 获取字段类型
 * @param {any} col 字段对象
 * @returns {string} 字段类型
 */
const getColumnType = (col: any) => {
  return col.columnType || col.type || col.dataType || 'String'
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
