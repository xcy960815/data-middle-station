<!-- 数据集选择器（分析页） -->
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
            v-if="columnStore.getDatasetId"
            class="clear-icon"
            type="CloseOne"
            @click.stop="clearDataset"
            style="margin-left: 8px; cursor: pointer"
          />
        </div>
      </template>

      <div class="search-row">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索数据集名称、描述或 SQL"
          clearable
          :prefix-icon="Search"
          style="margin-bottom: 8px; width: 220px"
        />
        <el-button type="primary" style="margin-left: 8px; margin-bottom: 8px" @click="handleGetDatasets">
          搜索
        </el-button>
      </div>

      <el-table
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
import { ElButton, ElInput, ElMessage, ElPopover, ElTable, ElTableColumn } from 'element-plus'
import { computed, nextTick, ref, watch } from 'vue'

const columnStore = useColumnsStore()

const searchKeyword = ref('')
const datasetTableRef = ref<InstanceType<typeof ElTable>>()
const datasetOptions = ref<DatasetVo.DatasetListItem[]>([])
const isPopoverVisible = ref(false)

const emit = defineEmits<{
  'dataset-change': [dataset: DatasetVo.DatasetListItem]
}>()

const selectedSourceLabel = computed(() => {
  return columnStore.getDatasetName || '请选择数据集'
})

const handleSelectedDataset = async (row: DatasetVo.DatasetListItem) => {
  columnStore.setDatasetId(row.id)
  columnStore.setDatasetName(row.datasetName)
  isPopoverVisible.value = false
  emit('dataset-change', row)
}

const datasetRowClassName = ({ row }: { row: DatasetVo.DatasetListItem }) => {
  return row.id === columnStore.getDatasetId ? 'is-selected' : ''
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

const clearDataset = () => {
  columnStore.resetDataset()
}

watch(
  () => isPopoverVisible.value,
  (visible) => {
    if (visible) {
      handleGetDatasets()
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
}

.search-row {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
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
