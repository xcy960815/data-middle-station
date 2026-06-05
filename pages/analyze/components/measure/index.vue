<template>
  <div class="measure relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="measure__header flex items-center justify-between px-1">
      <span class="measure__title">值</span>
      <!-- 清空所有的 icon -->
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('measures')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('measures')"
      />
    </div>
    <div class="measure__content flex-1" @contextmenu.prevent="handleContextMenu">
      <div
        data-action="drag"
        class="measure__item my-1"
        v-for="(measure, index) in measures"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selector-measure
          class="measure__item__name"
          :displayName="measure.displayName"
          :measure="measure"
          :index="index"
          :invalid="getMeasureInvalid(measure)"
          :invalidMessage="getMeasureInvalidMessage(measure)"
        >
          <template #measure-suffix>
            <button
              v-if="isMeasureAggregationEnabled(measure)"
              class="chart-selector-meta-label"
              type="button"
              @mousedown.stop
            >
              {{ resolveMeasureAggregationLabel(measure) }}
            </button>
          </template>
          <template #default="{ closePopover }">
            <selector-aggregation
              v-if="isMeasureAggregationEnabled(measure)"
              inline
              :column-type="measure.columnType"
              :aggregation-type="resolveMeasureAggregationType(measure)"
              @update:aggregation-type="handleChangeAggregationType(index, $event, closePopover)"
            />
          </template>
        </selector-measure>
      </div>
    </div>
    <context-menu ref="contextmenuRef">
      <context-menu-item @click="handleCreateCustomColumn">创建自定义列</context-menu-item>
    </context-menu>

    <!-- 自定义列弹窗 -->
    <el-dialog v-model="customColumnDialogVisible" title="创建自定义列" width="800px" append-to-body>
      <div class="mb-3 flex items-center">
        <span class="text-sm font-medium mr-2">列名：</span>
        <el-input v-model="customColumnName" placeholder="请输入列名 (例如: new_column)" style="width: 240px" />
        <span class="text-xs text-gray-400 ml-2">请输入 SQL 表达式 (如: price * num 或 '文本')，无需包含 AS 别名</span>
      </div>
      <div class="flex h-[400px] border border-gray-200 overflow-hidden">
        <div class="flex-1 h-full border-r border-gray-200 min-w-0">
          <monaco-editor
            ref="monacoEditorRef"
            v-model="customColumnSql"
            language="sql"
            height="100%"
            width="100%"
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
              class="mb-2 text-xs cursor-pointer hover:bg-gray-200 p-1 rounded transition-colors"
              :class="{ 'bg-blue-100 text-blue-600 font-medium': isColumnUsed(col.columnName) }"
              @click="insertColumnToEditor(col.columnName)"
            >
              <div class="font-medium text-gray-700" :class="{ 'text-blue-600': isColumnUsed(col.columnName) }">
                {{ col.displayName }}
              </div>
              <div class="flex items-center justify-between text-gray-500 mt-1">
                <span :class="{ 'text-blue-500': isColumnUsed(col.columnName) }">{{ col.columnName }}</span>
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
import { ElMessage } from 'element-plus'
import { defineAsyncComponent } from 'vue'
import ContextMenu from '../../../../components/context-menu/index.vue'
import SelectorAggregation from '../../../../components/selector/aggregation/index.vue'
import type { MeasureAggregationType } from '@/shared/domainTypes'
import { clearAllHandler } from '../clearAll'
import { moveFieldToMeasures, resolveDefaultMeasureAggregationType } from '../fieldTransfer'

const MonacoEditor = defineAsyncComponent(() => import('../../../../components/monaco-editor/index.vue'))

const { clearAll, hasClearAll } = clearAllHandler()

// 初始化数据
const columnStore = useColumnsStore()
const measureStore = useMeasuresStore()
const dimensionStore = useDimensionsStore()

const monacoEditorRef = ref<InstanceType<typeof MonacoEditor> | null>(null)

/**
 * @desc 值/度量字段数据。历史字段名沿用 measures。
 * @returns {ComputedRef<MeasureStore.MeasureOption[]>}
 */
const measures = computed(() => {
  return measureStore.getMeasures
})

/**
 * @desc dimensionList 数据
 */
const dimensionList = computed<DimensionStore.DimensionState['dimensions']>(() => {
  return dimensionStore.getDimensions
})

const measureColumnCountMap = computed(() => {
  return measures.value.reduce<Record<string, number>>((countMap, item) => {
    if (!item.columnName) return countMap
    countMap[item.columnName] = (countMap[item.columnName] || 0) + 1
    return countMap
  }, {})
})

const dimensionColumnSet = computed(() => {
  return new Set(dimensionList.value.map((item) => item.columnName).filter(Boolean))
})

const getMeasureInvalid = (measure: MeasureStore.MeasureOption) => {
  return getMeasureInvalidMessage(measure) !== ''
}

const getMeasureInvalidMessage = (measure: MeasureStore.MeasureOption) => {
  if (!measure.columnName) return ''
  if ((measureColumnCountMap.value[measure.columnName] || 0) > 1) {
    return '该值已存在'
  }
  if (dimensionColumnSet.value.has(measure.columnName)) {
    return '该字段已在分组中使用'
  }
  return ''
}

const isMeasureAggregationEnabled = (measure: MeasureStore.MeasureOption) => {
  return !!measure.columnName && dimensionList.value.length > 0
}

const resolveMeasureAggregationType = (measure: MeasureStore.MeasureOption): MeasureAggregationType => {
  if (measure.measure.aggregation) return measure.measure.aggregation
  return resolveDefaultMeasureAggregationType(measure)
}

const aggregationLabelMap: Record<MeasureAggregationType, string> = {
  count: '计数',
  countDistinct: '计数(去重)',
  sum: '总计',
  avg: '平均',
  max: '最大值',
  min: '最小值'
}

const resolveMeasureAggregationLabel = (measure: MeasureStore.MeasureOption) => {
  return aggregationLabelMap[resolveMeasureAggregationType(measure)] || '默认'
}

const handleChangeAggregationType = (
  index: number,
  aggregationType: MeasureAggregationType,
  closePopover?: () => void
) => {
  if (aggregationType === 'raw') return
  const measure = measures.value[index]
  if (!measure) return
  measureStore.updateMeasureByIndex(index, {
    ...measure,
    measure: {
      aggregation: aggregationType
    }
  })
  closePopover?.()
}

/**
 * @desc addMeasure 添加值/度量字段
 * @param {MeasureStore.MeasureOption|Array<MeasureStore.MeasureOption>} measures
 */
const addMeasure = (measure: MeasureStore.MeasureOption | Array<MeasureStore.MeasureOption>) => {
  measure = Array.isArray(measure) ? measure : [measure]
  measureStore.addMeasures(measure)
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
    .call(document.querySelectorAll('.measure__content > [data-action="drag"]'))
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
      from: 'measures',
      index,
      value: measures.value[index]
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
  if (!data.value) return

  const index = data.index
  switch (data.from) {
    case 'measures': {
      // 移动位置
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const measures = JSON.parse(JSON.stringify(measureStore.getMeasures))
      const target = measures.splice(data.index, 1)[0]
      measures.splice(targetIndex, 0, target)
      measureStore.setMeasures(measures)
      break
    }
    case 'dimensions':
      moveFieldToMeasures(data.value, { from: data.from, index })
      break
    default:
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column: data.value, index })
      moveFieldToMeasures(data.value, { from: 'columns', index })
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
 * @desc 自定义列名
 */
const customColumnName = ref('')

/**
 * @desc 判断字段是否被使用
 * @param {string} name 字段名
 * @returns {boolean}
 */
const isColumnUsed = (name: string) => {
  if (!customColumnSql.value) return false
  return customColumnSql.value.includes(name)
}

/**
 * @desc 确认创建自定义列
 */
const handleConfirmCustomColumn = () => {
  const sql = customColumnSql.value.trim()
  const alias = customColumnName.value.trim()

  // 1. 别名非空校验
  if (!alias) {
    ElMessage.warning('请输入列名')
    return
  }

  // 2. SQL非空校验
  if (!sql) {
    ElMessage.warning('请输入SQL表达式')
    return
  }

  // 3. 别名格式校验 (不能为纯数字)
  if (/^\d+$/.test(alias)) {
    ElMessage.warning('列名不能为纯数字')
    return
  }

  // 4. 重名校验
  const exists = columnStore.getColumns.some((col) => col.columnName === alias)
  if (exists) {
    ElMessage.warning(`列名 [${alias}] 已存在，请更换列名`)
    return
  }

  // 5. 危险关键字校验
  const forbidden = [';', '--', 'drop ', 'delete ', 'update ', 'insert ', 'alter ', 'truncate ']
  if (forbidden.some((key) => sql.toLowerCase().includes(key))) {
    ElMessage.warning('SQL包含非法字符或关键字')
    return
  }

  const newColumn: ColumnsStore.ColumnOptions = {
    columnName: alias,
    columnType: 'varchar', // 默认类型
    columnComment: '自定义列',
    displayName: alias,
    isCustom: true,
    expression: sql
  }

  // 添加到左侧字段列表
  const currentColumns = JSON.parse(JSON.stringify(columnStore.getColumns))
  currentColumns.push(newColumn)
  columnStore.setColumns(currentColumns)

  // 自动添加到值区域
  addMeasure({
    ...newColumn,
    measure: {
      aggregation: resolveDefaultMeasureAggregationType(newColumn)
    },
    fixed: null,
    align: null,
    width: null,
    showOverflowTooltip: false,
    filterable: false,
    sortable: false
  })

  ElMessage.success('自定义列创建成功')

  customColumnDialogVisible.value = false
  customColumnSql.value = ''
  customColumnName.value = ''
}

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
  monacoEditorRef.value?.insertText(` ${columnName}`)
}

/**
 * @desc 获取字段类型
 * @param {any} col 字段对象
 * @returns {string} 字段类型
 */
const getColumnType = (col: ColumnsStore.ColumnOptions) => {
  return col.columnType
}
</script>

<style lang="scss" scoped>
.measure {
  .measure__content {
    list-style: none;
    overflow: auto;

    .measure__item {
      cursor: move;
      position: relative;
    }
  }
}
</style>
