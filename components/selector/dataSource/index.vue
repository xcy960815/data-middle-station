<!-- 数据库表选择器 -->
<template>
  <client-only>
    <el-popover
      placement="bottom-start"
      :width="800"
      trigger="click"
      popper-class="table-select-popover"
      v-model:visible="isPopoverVisible"
    >
      <template #reference>
        <div class="select-trigger" :class="{ 'is-active': isPopoverVisible }">
          <span class="selected-value">{{ selectedSourceLabel }}</span>
          <icon-park
            v-if="dataSource"
            class="clear-icon"
            type="CloseOne"
            @click.stop="clearDataSource"
            style="margin-left: 8px; cursor: pointer"
          >
          </icon-park>
        </div>
      </template>

      <div class="source-mode-row">
        <el-segmented v-model="dataSourceMode" :options="sourceModeOptions" />
      </div>

      <div class="search-row">
        <el-input
          v-model="searchKeyword"
          :placeholder="dataSourceMode === 'dataset' ? '搜索数据集名称/描述/物理表' : '搜索表名/备注'"
          clearable
          :prefix-icon="Search"
          style="margin-bottom: 8px; width: 220px"
        />
        <el-button type="primary" style="margin-left: 8px; margin-bottom: 8px" @click="handleSearchTable">
          搜索
        </el-button>
      </div>

      <el-table
        v-if="dataSourceMode === 'table'"
        ref="tableRef"
        :data="dataSourceOptions"
        border
        :style="{ width: '100%' }"
        @row-click="handleSelectedTable"
        highlight-current-row
        max-height="300"
        :row-class-name="rowClassName"
        empty-text="暂无数据"
      >
        <el-table-column prop="tableName" label="表名" min-width="120" />
        <el-table-column prop="tableComment" label="备注" min-width="120" />
      </el-table>

      <el-table
        v-else
        ref="datasetTableRef"
        :data="datasetOptions"
        border
        :style="{ width: '100%' }"
        @row-click="handleSelectedDataset"
        highlight-current-row
        max-height="300"
        :row-class-name="datasetRowClassName"
        empty-text="暂无数据集"
      >
        <el-table-column prop="datasetName" label="数据集" min-width="150" />
        <el-table-column prop="querySql" label="查询 SQL" min-width="180" show-overflow-tooltip />
        <el-table-column prop="fieldCount" label="字段数" width="90" />
      </el-table>
    </el-popover>
  </client-only>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import { Search } from '@element-plus/icons-vue'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElButton, ElInput, ElMessage, ElPopover, ElSegmented, ElTable, ElTableColumn } from 'element-plus'
import { computed, nextTick, ref, watch } from 'vue'
/**
 * @desc 列存储
 */
const columnStore = useColumnsStore()

const sourceModeOptions = [
  { label: '数据集', value: 'dataset' },
  { label: '物理表', value: 'table' }
]
const searchKeyword = ref('')
const tableRef = ref<InstanceType<typeof ElTable>>()
const datasetTableRef = ref<InstanceType<typeof ElTable>>()
const datasetOptions = ref<DatasetVo.DatasetListItem[]>([])
/**
 * @desc 是否显示弹窗
 * @returns {boolean}
 */
const isPopoverVisible = ref(false)
/**
 * @desc 事件
 * @returns {void}
 */
type DataSourceChangePayload =
  | {
      mode: 'table'
      tableName: string
    }
  | {
      mode: 'dataset'
      dataset: DatasetVo.DatasetListItem
    }

const emit = defineEmits<{
  'dataSource-change': [payload: DataSourceChangePayload]
}>()
/**
 * @desc 数据源
 * @returns {string}
 */
const dataSource = computed({
  get: () => {
    return columnStore.getDataSource
  },
  set: (val) => {
    columnStore.setDataSource(val)
  }
})

const selectedSourceLabel = computed(() => {
  if (columnStore.getDataSourceMode === 'dataset' && columnStore.getDatasetName) {
    return columnStore.getDatasetName
  }
  return dataSource.value || '请选择数据集或数据库表'
})

const dataSourceMode = computed({
  get: () => columnStore.getDataSourceMode,
  set: (val: ColumnsStore.DataSourceMode) => {
    columnStore.setDataSourceMode(val)
  }
})

/**
 * @desc 数据源选项
 * @returns {ColumnsStore.dataSourceOption[]}
 */
const dataSourceOptions = computed(() => columnStore.getDataSourceOptions)

/**
 * @desc 搜索按钮点击（目前只做UI，实际过滤仍为输入框实时过滤）
 */
const handleSearchTable = () => {
  handleGetOptions()
}

/**
 * @desc 选择表
 * @param {ColumnsStore.DataSourceOption} row 表数据
 * @returns {void}
 */
const handleSelectedTable = (row: ColumnsStore.DataSourceOption) => {
  dataSource.value = row.tableName
  columnStore.setDataSourceMode('table')
  columnStore.setDatasetId(null)
  columnStore.setDatasetName('')
  isPopoverVisible.value = false
  if (row.tableName) emit('dataSource-change', { mode: 'table', tableName: row.tableName })
}

const handleSelectedDataset = async (row: DatasetVo.DatasetListItem) => {
  columnStore.setDataSourceMode('dataset')
  columnStore.setDatasetId(row.id)
  columnStore.setDatasetName(row.datasetName)
  dataSource.value = ''
  isPopoverVisible.value = false
  emit('dataSource-change', { mode: 'dataset', dataset: row })
}

/**
 * @desc 高亮当前选中行
 * @param {ColumnsStore.DataSourceOption} row 表数据
 * @returns {string}
 */
const rowClassName = ({ row }: { row: ColumnsStore.DataSourceOption }) => {
  return row.tableName === dataSource.value ? 'is-selected' : ''
}

const datasetRowClassName = ({ row }: { row: DatasetVo.DatasetListItem }) => {
  return row.id === columnStore.getDatasetId ? 'is-selected' : ''
}

/**
 * @desc 查询表格列表
 * @returns {Promise<void>}
 */
const handleGetDatabaseTables = async () => {
  const result = await httpRequest('/api/getDatabaseTables', {
    method: 'POST',
    body: {
      tableName: searchKeyword.value || null
    }
  })
  if (result.code === 200) {
    columnStore.setDataSourceOptions(result.data || [])
    nextTick(() => {
      if (dataSource.value && tableRef.value) {
        const currentRow = columnStore.getDataSourceOptions.find((item) => item.tableName === dataSource.value)
        if (currentRow) {
          tableRef.value.setCurrentRow(currentRow)
        }
      }
    })
  } else {
    ElMessage.error(result.message || '获取表列表失败')
    columnStore.setDataSourceOptions([])
  }
}

const handleGetDatasets = async () => {
  const result = await httpRequest<ApiResponseI<DatasetVo.DatasetListResponse>>('/api/getDatasets', {
    method: 'POST',
    body: {
      page: 1,
      pageSize: 100,
      keyword: searchKeyword.value || '',
      sortField: 'updateTime',
      sortOrder: 'desc'
    }
  })
  if (result.code === 200 && result.data) {
    datasetOptions.value = result.data.list || []
    nextTick(() => {
      if (columnStore.getDatasetId && datasetTableRef.value) {
        const currentRow = datasetOptions.value.find((item) => item.id === columnStore.getDatasetId)
        if (currentRow) {
          datasetTableRef.value.setCurrentRow(currentRow)
        }
      }
    })
  } else {
    ElMessage.error(result.message || '获取数据集失败')
    datasetOptions.value = []
  }
}

const handleGetOptions = () => {
  if (dataSourceMode.value === 'dataset') {
    handleGetDatasets()
    return
  }
  handleGetDatabaseTables()
}

/**
 * @desc 清空数据源
 * @returns {void}
 */
const clearDataSource = () => {
  dataSource.value = ''
  columnStore.setDataSourceMode('table')
  columnStore.setDatasetId(null)
  columnStore.setDatasetName('')
}

watch(
  () => isPopoverVisible.value,
  (visible) => {
    if (visible) {
      handleGetOptions()
    }
  }
)

watch(
  () => dataSourceMode.value,
  () => {
    if (isPopoverVisible.value) {
      handleGetOptions()
    }
  }
)
</script>

<style lang="scss" scoped>
.select-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 10px;
  border: 1.5px solid #dcdfe6;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.03);
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:hover,
  &.is-active {
    border-color: #409eff;
    box-shadow: 0 2px 8px 0 rgba(64, 158, 255, 0.08);
  }

  .selected-value {
    color: #303133;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .trigger-icon {
    color: #bfcbd9;
    font-size: 18px;
    margin-left: 8px;
    transition: transform 0.3s;
  }

  &.is-active .trigger-icon {
    transform: rotate(180deg);
  }
}

.search-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
}

.source-mode-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

:deep(.table-select-popover) {
  border-radius: 10px;
  box-shadow: 0 4px 24px 0 rgba(0, 0, 0, 0.1);
  padding: 12px 0 0 0;
}

:deep(.el-table) {
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

:deep(.el-table th) {
  background: #f7fafd;
  color: #606266;
  font-weight: 500;
  border-bottom: none;
}

:deep(.el-table__row) {
  transition: background 0.2s;

  &.is-selected {
    background: #e6f7ff !important;
  }

  &:hover {
    background: #f5f7fa !important;
  }
}

:deep(.el-table td) {
  border-bottom: none;
}

:deep(.el-table__empty-block) {
  background: #fff;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
}

.clear-icon {
  color: #bfcbd9;
  font-size: 16px;
  transition: color 0.2s;

  &:hover {
    color: #409eff;
  }
}
</style>
