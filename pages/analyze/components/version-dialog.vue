<template>
  <el-dialog v-model="versionDialogVisible" title="历史版本" width="760px" :close-on-click-modal="false" append-to-body>
    <div v-loading="versionListLoading">
      <el-table :data="versionList" stripe border>
        <el-table-column prop="versionNo" label="版本号" width="100" />
        <el-table-column label="当前版本" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.id === analyzeStore.getCurrentConfigId" type="success">当前版本</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="chartType" label="图表类型" min-width="120" />
        <el-table-column label="数据集" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.commonChartConfig?.datasetName || (row.datasetId ? `数据集 #${row.datasetId}` : '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="createdBy" label="创建人" min-width="120" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="row.id === analyzeStore.getCurrentConfigId || versionSwitching"
              @click="handleSwitchVersion(row)"
            >
              {{ row.id === analyzeStore.getCurrentConfigId ? '当前版本' : '切换' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!versionListLoading && versionList.length === 0" description="暂无历史版本" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="versionDialogVisible = false">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage, ElMessageBox } from 'element-plus'
import { nextTick, ref } from 'vue'
import { updateAnalyzeHandler } from '../updateAnalyze'

const analyzeStore = useAnalyzeStore()
const columnStore = useColumnsStore()
const measureStore = useMeasuresStore()
const filterStore = useFiltersStore()
const dimensionStore = useDimensionsStore()
const orderStore = useOrdersStore()
const chartConfigStore = useChartConfigStore()

const { serializeAnalyzeDraft } = updateAnalyzeHandler()

const versionDialogVisible = ref(false)
const versionListLoading = ref(false)
const versionSwitching = ref(false)
const versionList = ref<AnalyzeConfigVo.AnalyzeConfigResponse[]>([])

const loadAnalyzeVersionList = async () => {
  if (!analyzeStore.getAnalyzeId) {
    versionList.value = []
    return
  }

  versionListLoading.value = true
  const result = await httpRequest<ApiResponseI<AnalyzeConfigVo.AnalyzeConfigResponse[]>>(
    '/api/getAnalyzeConfigHistory',
    {
      method: 'POST',
      body: {
        analyzeId: analyzeStore.getAnalyzeId
      }
    }
  ).finally(() => {
    versionListLoading.value = false
  })

  if (result.code === 200 && result.data) {
    versionList.value = result.data
    return
  }

  versionList.value = []
  ElMessage.error(result.message || '获取历史版本失败')
}

const handleSwitchVersion = async (versionItem: AnalyzeConfigVo.AnalyzeConfigResponse) => {
  if (versionItem.id === analyzeStore.getCurrentConfigId) {
    return
  }

  if (analyzeStore.getEditorDirty) {
    versionDialogVisible.value = false
    try {
      await ElMessageBox.confirm('当前分析有未保存的改动，切换版本会丢失这些改动，是否继续？', '未保存改动', {
        type: 'warning',
        confirmButtonText: '继续切换',
        cancelButtonText: '继续编辑'
      })
    } catch (_error) {
      versionDialogVisible.value = true
      return
    }
  }

  versionSwitching.value = true
  analyzeStore.setEditorHydrating(true)
  await nextTick()
  try {
    analyzeStore.setCurrentConfigId(versionItem.id)
    analyzeStore.setChartType((versionItem.chartType as AnalyzeStore.ChartType) || 'table')
    measureStore.setMeasures((versionItem.measures as MeasureStore.MeasureOption[]) || [])
    filterStore.setFilters((versionItem.filters as FilterStore.FilterOption[]) || [])
    dimensionStore.setDimensions((versionItem.dimensions as DimensionStore.DimensionOption[]) || [])
    orderStore.setOrders((versionItem.orders as OrderStore.OrderOption[]) || [])
    chartConfigStore.setCommonChartConfig(versionItem.commonChartConfig || chartConfigStore.$state.commonChartConfig)
    chartConfigStore.setPrivateChartConfig(versionItem.privateChartConfig || chartConfigStore.$state.privateChartConfig)
    columnStore.setColumns([])
    columnStore.setDatasetId(versionItem.datasetId || null)
    columnStore.setDatasetName(versionItem.commonChartConfig?.datasetName || '')
  } finally {
    analyzeStore.setEditorHydrating(false)
    versionSwitching.value = false
  }

  analyzeStore.setEditorDirty(serializeAnalyzeDraft() !== analyzeStore.getLastSavedSnapshot)
  ElMessage.success('已切换到该历史版本，是否保存由你决定')
}

defineExpose({
  open: async () => {
    versionDialogVisible.value = true
    await loadAnalyzeVersionList()
  }
})
</script>
