<template>
  <div class="bar relative flex">
    <el-button link @click="handleClickRefresh" class="mr-auto"> 刷新 </el-button>
    <el-button link @click="handleClickAlarm">报警</el-button>
    <el-button link @click="handleOpenVersionDialog">历史版本</el-button>
    <el-button link @click="handleClickSetting">设置</el-button>
    <el-button link @click="handleClickFullScreen">全屏</el-button>
    <el-button link @click="handleDownload">下载</el-button>
    <el-button link @click="handleClickSendEmailDto">邮件</el-button>
    <el-button link @click="handleAnalyze" :loading="editorSaving" :disabled="!editorDirty && !editorSaving"
      >保存</el-button
    >
    <el-tag v-show="editorDirty" size="small" class="pr-[10px] ml-[10px]" type="warning">未保存</el-tag>
    <el-tag v-show="!editorDirty && lastSavedAt" size="small" class="pr-[10px] ml-[10px]" type="success"
      >已保存：{{ lastSavedAt }}</el-tag
    >
    <el-tag v-show="chartUpdateTakesTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新耗时 ：{{ chartUpdateTakesTime }}</el-tag
    >
    <el-tag v-show="chartUpdateTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新时间 ：{{ chartUpdateTime }}</el-tag
    >
  </div>

  <!-- 邮件发送对话框 -->
  <SendEmailDtoDialog v-model:visible="emailDialogVisible" ref="emailDialogRef" />

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
        <el-table-column prop="dataSource" label="数据源" min-width="140" show-overflow-tooltip />
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
import { useChartDownload } from '@/composables/useChartDownload'
import { httpRequest } from '@/composables/useHttpRequest'
import { ElButton, ElDialog, ElEmpty, ElMessage, ElMessageBox, ElTable, ElTableColumn, ElTag } from 'element-plus'
import { onBeforeRouteLeave } from 'vue-router'
import { updateAnalyzeHandler } from '../../updateAnalyze'
import { useAnalyzeDataHandler } from '../../useAnalyzeDataHandler'
import SendEmailDtoDialog from './components/send-email-dialog.vue'
const { handleUpdateAnalyze, serializeAnalyzeDraft } = updateAnalyzeHandler()
const { getAnalyzeData } = useAnalyzeDataHandler()
const analyzeStore = useAnalyzeStore()
const columnStore = useColumnsStore()
const measureStore = useMeasuresStore()
const filterStore = useFiltersStore()
const dimensionStore = useDimensionsStore()
const orderStore = useOrdersStore()
const chartConfigStore = useChartConfigStore()
const { handleDownload } = useChartDownload()
const chartUpdateTime = computed(() => analyzeStore.getChartUpdateTime)
const chartUpdateTakesTime = computed(() => analyzeStore.getChartUpdateTakesTime)
const editorDirty = computed(() => analyzeStore.getEditorDirty)
const editorSaving = computed(() => analyzeStore.getEditorSaving)
const lastSavedAt = computed(() => analyzeStore.getLastSavedAt)
const draftSnapshot = computed(() => serializeAnalyzeDraft())

// 发送邮件对话框相关状态
const emailDialogVisible = ref(false)
const versionDialogVisible = ref(false)
const versionListLoading = ref(false)
const versionSwitching = ref(false)
const versionList = ref<AnalyzeConfigVo.AnalyzeConfigResponse[]>([])

const emailDialogRef = ref<InstanceType<typeof SendEmailDtoDialog> | null>(null)

const emits = defineEmits<{
  requestChartRef: []
}>()

watch(
  draftSnapshot,
  (snapshot) => {
    if (analyzeStore.getEditorHydrating) return
    analyzeStore.setEditorDirty(snapshot !== analyzeStore.getLastSavedSnapshot)
  },
  {
    immediate: true
  }
)

/**
 * @desc 键盘事件处理
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Cmd+S (Mac) 或 Ctrl+S (Windows/Linux) 快捷键
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault() // 阻止浏览器默认的保存行为
    void handleAnalyze()
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!analyzeStore.getEditorDirty || analyzeStore.getEditorSaving) return
  event.preventDefault()
  event.returnValue = ''
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (!analyzeStore.getEditorDirty || analyzeStore.getEditorSaving) {
    return true
  }

  try {
    await ElMessageBox.confirm('当前分析有未保存的改动，确认要离开当前页面吗？', '未保存改动', {
      type: 'warning',
      confirmButtonText: '仍然离开',
      cancelButtonText: '继续编辑'
    })
    return true
  } catch (_error) {
    return false
  }
})
/**
 * @desc 点刷新按钮
 * @returns void
 */
const handleClickRefresh = async () => {
  getAnalyzeData()
}
/**
 * @desc 点报警按钮
 * @returns void
 */
const handleClickAlarm = () => {
  console.log('handleClickAlarm')
}

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

const handleOpenVersionDialog = async () => {
  versionDialogVisible.value = true
  await loadAnalyzeVersionList()
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
  try {
    analyzeStore.setCurrentConfigId(versionItem.id)
    analyzeStore.setChartType((versionItem.chartType as AnalyzeStore.ChartType) || 'table')
    columnStore.setColumns(versionItem.columns || [])
    measureStore.setMeasures((versionItem.measures as MeasureStore.MeasureOption[]) || [])
    filterStore.setFilters((versionItem.filters as FilterStore.FilterOption[]) || [])
    dimensionStore.setDimensions((versionItem.dimensions as DimensionStore.DimensionOption[]) || [])
    orderStore.setOrders((versionItem.orders as OrderStore.OrderOption[]) || [])
    chartConfigStore.setCommonChartConfig(versionItem.commonChartConfig || chartConfigStore.$state.commonChartConfig)
    chartConfigStore.setPrivateChartConfig(versionItem.privateChartConfig || chartConfigStore.$state.privateChartConfig)
    columnStore.setDataSource(versionItem.dataSource || '')
    columnStore.setDataSourceMode(versionItem.commonChartConfig?.dataSourceMode || 'table')
    columnStore.setDatasetId(versionItem.commonChartConfig?.datasetId || null)
    columnStore.setDatasetName(versionItem.commonChartConfig?.datasetName || '')
  } finally {
    analyzeStore.setEditorHydrating(false)
    versionSwitching.value = false
  }

  analyzeStore.setEditorDirty(serializeAnalyzeDraft() !== analyzeStore.getLastSavedSnapshot)
  ElMessage.success('已切换到该历史版本，是否保存由你决定')
}
/**
 * @desc 点设置按钮
 * @returns void
 */
const handleClickSetting = () => {
  chartConfigStore.setChartConfigDrawer(true)
}
/**
 * @desc 点全屏按钮
 * @returns void
 */
const handleClickFullScreen = () => {
  console.log('handleClickFullScreen')
}

/**
 * @desc 点保存按钮
 * @returns void
 */
const handleAnalyze = async () => {
  if (!analyzeStore.getEditorDirty && !analyzeStore.getEditorSaving) {
    ElMessage.info('当前没有需要保存的改动')
    return
  }

  await handleUpdateAnalyze()
}

/**
 * @desc 发送邮件按钮点击事件
 */
const handleClickSendEmailDto = () => {
  // 确保图表引用可用
  emits('requestChartRef')
  emailDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.bar {
  display: flex;
  align-items: center;
}
</style>
