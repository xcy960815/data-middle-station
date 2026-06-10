<template>
  <div class="column" @dragover="dragoverHandler" @drop="dropHandler">
    <DataSourceSelector @dataset-change="handleDatasetChange" />
    <div class="column__header flex items-center justify-between py-2">
      <span class="column__title">维度</span>
      <icon-park
        class="cursor-pointer"
        type="Refresh"
        size="14"
        fill="#333"
        title="刷新维度"
        @click="handleRefreshColumns"
      />
    </div>
    <div class="column__content">
      <column-option
        v-for="(column, index) in columnList"
        :key="index"
        :column="column"
        :display-name="columnDisplayNames(column)"
        :icon-name="columnIconName(column)"
        :classes="columnClasses(column)"
        :draggable="true"
        @dragstart="dragstartHandler(column, index, $event)"
        @dragend="dragendHandler"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ColumnOption from '@/components/column-option/index.vue'
import DataSourceSelector from '@/components/selector/dataSource/index.vue'
import { httpRequest } from '@/composables/useHttpRequest'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage } from 'element-plus'
import { computed, watch } from 'vue'
import { useAnalyzeStore } from '~/stores/analyze'
import { useChartConfigStore } from '~/stores/chart-config'
import { useColumnsStore } from '~/stores/columns'
import { useMeasuresStore } from '~/stores/measures'
import { useFiltersStore } from '~/stores/filters'
import { useDimensionsStore } from '~/stores/dimensions'
import { useOrdersStore } from '~/stores/orders'

const NUMBER_ICON_NAME = 'ListNumbers'
const DATE_ICON_NAME = 'calendar-thirty'
const STRING_ICON_NAME = 'text'

const columnDisplayNames = (column: ColumnsStore.ColumnOptions) => {
  return column.displayName || column.columnName
}

const columnClasses = computed(() => (column: ColumnsStore.ColumnOptions) => {
  const measureSelected = useMeasuresStore().getMeasures.find(
    (measureOption: MeasureStore.MeasureOption) => measureOption.columnName === column.columnName
  )
  const dimensionSelected = useDimensionsStore().getDimensions.find(
    (dimensionOption: DimensionStore.DimensionOption) => dimensionOption.columnName === column.columnName
  )
  return {
    column__item: true,
    column__item_measure_selected: Boolean(measureSelected),
    column__item_dimension_selected: Boolean(dimensionSelected)
  }
})

const columnIconName = computed(() => (column: ColumnsStore.ColumnOptions) => {
  const { columnType } = column
  const NumberTypes = [
    'tinyint',
    'smallint',
    'mediumint',
    'int',
    'bigint',
    'decimal',
    'float',
    'double',
    'real',
    'bit',
    'boolean',
    'serial'
  ]

  const DateTypes = ['date', 'datetime', 'timestamp', 'time', 'year', 'datetime2', 'datetimeoffset', 'smalldatetime']

  if (NumberTypes.includes(columnType)) {
    return NUMBER_ICON_NAME
  } else if (DateTypes.includes(columnType)) {
    return DATE_ICON_NAME
  } else {
    return STRING_ICON_NAME
  }
})

const analyzeStore = useAnalyzeStore()
const columnStore = useColumnsStore()
const measureStore = useMeasuresStore()
const filterStore = useFiltersStore()
const dimensionStore = useDimensionsStore()
const orderStore = useOrdersStore()
const chartConfigStore = useChartConfigStore()

const columnList = computed(() => columnStore.getColumns)

const dragstartHandler = (column: ColumnsStore.ColumnOptions, index: number, event: DragEvent) => {
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
  const target = event.target as HTMLElement
  if (target) {
    const parent = target.closest('.column-option') as HTMLElement
    if (parent) {
      const dragNode = parent.cloneNode(true) as HTMLElement
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

const dragendHandler = (event: DragEvent) => {
  event.preventDefault()
}

const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}

const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnsStore.ColumnOptions> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  const columnIndex = columnStore.getColumns.findIndex(
    (column: ColumnsStore.ColumnOptions) => column.columnName === data.value.columnName
  )

  switch (data.from) {
    case 'measures':
      measureStore.removeMeasure(data.index)
      break
    case 'filters':
      filterStore.removeFilter(data.index)
      break
    case 'orders':
      orderStore.removeOrder(data.index)
      break
    case 'dimensions':
      dimensionStore.removeDimension(data.index)
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

watch(
  () => columnStore.getDatasetId,
  async (datasetId) => {
    if (!datasetId) {
      analyzeStore.setAnalyzeData([])
      filterStore.resetFilters()
      orderStore.resetOrders()
      dimensionStore.resetDimensions()
      measureStore.resetMeasures()
      chartConfigStore.setPrivateChartConfig(null)
      columnStore.resetDataset()
    }
  }
)

const mapDatasetFieldToColumn = (field: DatasetDao.DatasetFieldConfigItem): ColumnsStore.ColumnOptions => {
  return {
    columnName: field.sourceColumnName,
    columnType: field.dataType,
    columnComment: field.displayName || field.sourceColumnName,
    displayName: field.displayName || field.sourceColumnName,
    fieldRole: field.fieldType
  }
}

const queryDatasetColumns = async (datasetId: number) => {
  const result = await httpRequest<ApiResponseI<DatasetVo.DatasetDetailResponse>>('/api/getDataset', {
    method: 'POST',
    body: {
      id: datasetId
    }
  })
  if (result.code === 200 && result.data) {
    const columns = (result.data.fieldsConfig || []).filter((field) => field.visible).map(mapDatasetFieldToColumn)
    columnStore.setDatasetId(result.data.id)
    columnStore.setDatasetName(result.data.datasetName)
    columnStore.setColumns(columns)
    return
  }
  columnStore.setColumns([])
}

const clearAnalyzeSelections = () => {
  analyzeStore.setAnalyzeData([])
  filterStore.resetFilters()
  orderStore.resetOrders()
  dimensionStore.resetDimensions()
  measureStore.resetMeasures()
}

const handleRefreshColumns = async () => {
  const datasetId = columnStore.getDatasetId
  if (!datasetId) {
    ElMessage.warning('请先选择数据集')
    return
  }
  await queryDatasetColumns(datasetId)
}

watch(
  () => analyzeStore.getEditorHydrating,
  async (hydrating, wasHydrating) => {
    if (!wasHydrating || hydrating) return
    if (!columnStore.getDatasetId || columnStore.getColumns.length > 0) return
    await handleRefreshColumns()
  }
)

const handleDatasetChange = async (dataset: DatasetVo.DatasetListItem) => {
  clearAnalyzeSelections()
  await queryDatasetColumns(dataset.id)
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
  }
}
</style>
