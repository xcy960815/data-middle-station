<template>
  <NuxtLayout :name="layoutName" :editing="editorMode">
    <template #header>
      <custom-header>
        <template #title>
          <HeaderTitle
            v-model:title="dashboardForm.dashboardName"
            v-model:desc="dashboardForm.dashboardDesc"
            :editable="canEditDashboard"
            title-prompt-title="编辑看板名称"
            title-prompt-message="请输入看板名称"
            desc-prompt-title="编辑看板描述"
            desc-prompt-message="请输入看板描述"
            title-fallback="未命名看板"
            desc-fallback="暂无描述"
            title-required-message="看板名称不能为空"
          />
        </template>
      </custom-header>
    </template>
    <template #bar>
      <DashboardBar
        :editor-mode="editorMode"
        :can-edit-dashboard="canEditDashboard"
        :saving="saving"
        :has-unsaved-changes="hasUnsavedChangesValue"
        @refresh-dashboard="handleRefreshDashboard"
        @enter-editor-mode="handleEnterEditorMode"
        @cancel-editor-mode="handleCancelEditorMode"
        @save-dashboard="handleSaveDashboard"
        @open-version-dialog="handleOpenVersionDialog"
      />
    </template>

    <template #sidebar>
      <div class="dashboard-sidebar__section dashboard-sidebar__section--grow">
        <div class="dashboard-sidebar__title">分析列表</div>
        <el-input
          v-model="analyzeKeyword"
          clearable
          placeholder="搜索分析"
          @keyup.enter="getAnalyzes(1)"
          @clear="getAnalyzes(1)"
        />
        <div v-loading="analyzeListLoading" class="analyze-source-list">
          <div
            v-for="analyze in analyzes"
            :key="analyze.id"
            class="analyze-source-item"
            draggable="true"
            @dragstart="handleAnalyzeDragStart(analyze)"
            @dblclick="handleAddAnalyze(analyze)"
          >
            <div class="analyze-source-item__name">{{ analyze.analyzeName }}</div>
            <div class="analyze-source-item__desc">{{ analyze.analyzeDesc || '暂无描述' }}</div>
          </div>
          <el-empty v-if="!analyzeListLoading && analyzes.length === 0" description="暂无分析" />
        </div>
        <el-pagination
          small
          layout="prev, pager, next"
          :current-page="analyzePage"
          :page-size="analyzePageSize"
          :total="analyzeTotal"
          @current-change="getAnalyzes"
        />
      </div>
    </template>

    <template #canvas-toolbar>
      <div class="dashboard-editor-subtitle">拖拽左侧分析到画布，拖动标题栏调整位置，拖动右下角调整宽高。</div>
    </template>

    <template #canvas>
      <div v-loading="detailLoading" class="dashboard-canvas-loading">
        <div
          ref="canvasRef"
          class="dashboard-canvas"
          @dragover.prevent="handleCanvasDragOver"
          @drop="handleDropAnalyze"
        >
          <div v-if="editorMode" class="dashboard-canvas-spacer" :style="getCanvasSpacerStyle()"></div>
          <div v-for="widget in widgets" :key="widget.localId" class="dashboard-widget" :style="getWidgetStyle(widget)">
            <div class="dashboard-widget__header" @pointerdown="handleWidgetMoveStart($event, widget)">
              <span class="dashboard-widget__title" @click.stop="handleOpenAnalyze(widget)">
                {{ widget.widgetTitle }}
              </span>
              <div class="dashboard-widget__actions">
                <el-tooltip content="打开分析" placement="top">
                  <button
                    class="dashboard-widget__icon-button"
                    type="button"
                    :disabled="!widget.analyzeId"
                    @click.stop="handleOpenAnalyzeInNewTab(widget)"
                    @pointerdown.stop
                  >
                    <icon-park type="PreviewOpen" size="14" fill="currentColor" />
                  </button>
                </el-tooltip>
                <template v-if="editorMode">
                  <el-button text size="small" @click.stop="handleRefreshWidget(widget)">刷新</el-button>
                  <el-button text size="small" type="danger" @click.stop="handleRemoveWidget(widget)">删除</el-button>
                </template>
              </div>
            </div>
            <div class="dashboard-widget__body">
              <DashboardWidgetChart
                :title="widget.widgetTitle"
                :chart-type="widget.chartType"
                :data-source="widget.dataSource"
                :loading="widget.loading"
                :error-message="widget.errorMessage"
                :data="widget.data"
                :x-axis-fields="widget.xAxisFields"
                :y-axis-fields="widget.yAxisFields"
                :private-chart-config="widget.privateChartConfig"
              />
            </div>
            <template v-if="editorMode">
              <div
                v-for="handle in resizeHandles"
                :key="handle"
                class="dashboard-widget__resize"
                :class="`dashboard-widget__resize--${handle}`"
                @pointerdown="handleWidgetResizeStart($event, widget, handle)"
              ></div>
            </template>
          </div>
          <el-empty
            v-if="widgets.length === 0"
            class="dashboard-canvas-empty"
            :description="editorMode ? '拖拽分析到这里创建看板组件' : '暂无看板组件'"
          >
            <template #image>
              <div class="dashboard-canvas-empty__image" aria-hidden="true">
                <span class="dashboard-canvas-empty__panel dashboard-canvas-empty__panel--main"></span>
                <span class="dashboard-canvas-empty__panel dashboard-canvas-empty__panel--side"></span>
                <span class="dashboard-canvas-empty__panel dashboard-canvas-empty__panel--footer"></span>
              </div>
            </template>
          </el-empty>
        </div>
      </div>
    </template>
  </NuxtLayout>

  <el-dialog v-model="versionDialogVisible" title="历史版本" width="760px" :close-on-click-modal="false" append-to-body>
    <div v-loading="versionListLoading">
      <el-table :data="versionList" stripe border>
        <el-table-column prop="versionNo" label="版本号" width="100" />
        <el-table-column label="当前版本" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.id === activeDashboard?.currentConfigId" type="success">当前版本</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="widgetCount" label="组件数" width="100" align="center" />
        <el-table-column prop="createdBy" label="创建人" min-width="120" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="row.id === activeDashboard?.currentConfigId || versionSwitching"
              @click="handleSwitchVersion(row)"
            >
              {{ row.id === activeDashboard?.currentConfigId ? '当前版本' : '切换' }}
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
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox } from 'element-plus'
import HeaderTitle from '@/components/header-title/index.vue'
import DashboardBar from './components/bar/index.vue'
import DashboardWidgetChart from './components/dashboard-widget-chart.vue'

type DashboardWidgetState = DashboardDto.DashboardWidgetPayload & {
  localId: string
  data: AnalyzeDataVo.AnalyzeData[]
  xAxisFields: DimensionStore.DimensionOption[]
  yAxisFields: MeasureStore.MeasureOption[]
  dataSource: string | null
  privateChartConfig: AnalyzeConfigVo.PrivateChartConfigItem | null
  loading: boolean
  errorMessage: string
  analyze: AnalyzeVo.AnalyzeDetailResponse | null
}

type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

const layoutName = 'dashboard'
const route = useRoute()
const router = useRouter()
const GRID_COLUMNS = 24
const ROW_HEIGHT = 60
const GRID_GAP = 12
const CANVAS_BOTTOM_SPACE = 320
const CANVAS_HORIZONTAL_PADDING = 28
const MIN_WIDGET_WIDTH = 2
const MIN_WIDGET_HEIGHT = 2
const resizeHandles: ResizeHandle[] = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']

const dashboardId = computed(() => Number(route.params.id))
const activeDashboard = ref<DashboardVo.DashboardDetailResponse | null>(null)
const editorMode = ref(false)
const detailLoading = ref(false)
const dashboardForm = reactive({
  id: null as number | null,
  dashboardName: '',
  dashboardDesc: ''
})
const widgets = ref<DashboardWidgetState[]>([])
const saving = ref(false)
const versionDialogVisible = ref(false)
const versionListLoading = ref(false)
const versionSwitching = ref(false)
const versionList = ref<DashboardVo.DashboardConfigHistoryItem[]>([])
const lastSavedSnapshot = ref('')
const canvasRef = ref<HTMLElement | null>(null)
const canvasWidth = ref(0)
const resizeObserver = ref<ResizeObserver>()

const analyzes = ref<AnalyzeVo.AnalyzeListItem[]>([])
const analyzeListLoading = ref(false)
const analyzePage = ref(1)
const analyzePageSize = ref(20)
const analyzeTotal = ref(0)
const analyzeKeyword = ref('')
const draggingAnalyze = ref<AnalyzeVo.AnalyzeListItem | null>(null)
const permissionLevelMap: Record<PermissionVo.ResourcePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}
const chartTypeSet = new Set<AnalyzeStore.ChartType>(['table', 'line', 'pie', 'interval'])
const canEditDashboard = computed(() => {
  return permissionLevelMap[activeDashboard.value?.dashboardPermission || 'none'] >= permissionLevelMap.edit
})
const dashboardSnapshot = computed(() =>
  JSON.stringify({
    dashboardName: dashboardForm.dashboardName.trim(),
    dashboardDesc: dashboardForm.dashboardDesc.trim(),
    layoutConfig: {
      columnCount: GRID_COLUMNS,
      rowHeight: ROW_HEIGHT
    },
    widgets: widgets.value.map((widget) => ({
      analyzeId: widget.analyzeId,
      widgetTitle: widget.widgetTitle,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      chartType: widget.chartType,
      refreshInterval: widget.refreshInterval,
      widgetConfig: widget.widgetConfig
    }))
  })
)
const hasUnsavedChangesValue = computed(() => dashboardSnapshot.value !== lastSavedSnapshot.value)

const normalizeChartType = (chartType?: string | null): AnalyzeStore.ChartType => {
  return chartTypeSet.has(chartType as AnalyzeStore.ChartType) ? (chartType as AnalyzeStore.ChartType) : 'table'
}

const columnWidth = computed(() => {
  const width = Math.max(1, (canvasWidth.value || 1) - CANVAS_HORIZONTAL_PADDING)
  return (width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS
})

const canvasContentBottom = computed(() => {
  const maxBottom = widgets.value.length ? Math.max(...widgets.value.map((widget) => widget.y + widget.h)) : 0
  return maxBottom * (ROW_HEIGHT + GRID_GAP)
})

const loadDashboardDetail = async () => {
  if (!dashboardId.value) {
    ElMessage.error('看板 ID 无效')
    router.replace('/dashboard')
    return
  }
  detailLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DashboardVo.DashboardDetailResponse>>('/api/getDashboard', {
      method: 'POST',
      body: {
        id: dashboardId.value
      }
    })
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '获取看板失败')
      router.replace('/dashboard')
      return
    }
    editorMode.value = false
    await applyDashboardDetail(res.data)
  } finally {
    detailLoading.value = false
  }
}

const createWidgetState = (widget: DashboardVo.DashboardWidgetItem): DashboardWidgetState => {
  const chartConfig = widget.analyze?.chartConfig
  return {
    localId: `${widget.id || 'new'}-${widget.analyzeId}-${Date.now()}-${Math.random()}`,
    analyzeId: widget.analyzeId,
    widgetTitle: widget.widgetTitle || widget.analyze?.analyzeName || '未命名分析',
    x: Math.max(0, Math.round(widget.x)),
    y: Math.max(0, Math.round(widget.y)),
    w: Math.min(GRID_COLUMNS, Math.max(MIN_WIDGET_WIDTH, Math.round(widget.w))),
    h: Math.max(MIN_WIDGET_HEIGHT, Math.round(widget.h)),
    chartType: normalizeChartType(widget.chartType || chartConfig?.chartType),
    refreshInterval: widget.refreshInterval || 0,
    widgetConfig: widget.widgetConfig || {},
    analyze: widget.analyze,
    data: [],
    xAxisFields: (chartConfig?.dimensions || []) as DimensionStore.DimensionOption[],
    yAxisFields: (chartConfig?.measures || []) as MeasureStore.MeasureOption[],
    dataSource: chartConfig?.dataSource ?? null,
    privateChartConfig: chartConfig?.privateChartConfig || null,
    loading: false,
    errorMessage: widget.analyze ? '' : '分析不存在或无权访问'
  }
}

const updateLastSavedSnapshot = () => {
  lastSavedSnapshot.value = dashboardSnapshot.value
}

const hasUnsavedChanges = () => {
  return hasUnsavedChangesValue.value
}

const applyDashboardDetail = async (dashboardDetail: DashboardVo.DashboardDetailResponse) => {
  activeDashboard.value = dashboardDetail
  dashboardForm.id = dashboardDetail.id
  dashboardForm.dashboardName = dashboardDetail.dashboardName
  dashboardForm.dashboardDesc = dashboardDetail.dashboardDesc
  widgets.value = dashboardDetail.widgets.map((widget) => createWidgetState(widget))
  updateLastSavedSnapshot()
  await nextTick()
  updateCanvasWidth()
  widgets.value.forEach((widget) => loadWidgetData(widget))
}

const getAnalyzes = async (targetPage = analyzePage.value) => {
  analyzeListLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<AnalyzeVo.AnalyzeListResponse>>('/api/getAnalyzes', {
      method: 'POST',
      body: {
        page: targetPage,
        pageSize: analyzePageSize.value,
        keyword: analyzeKeyword.value.trim(),
        sortField: 'updateTime',
        sortOrder: 'desc'
      }
    })
    if (res.code === 200 && res.data) {
      analyzes.value = res.data.list || []
      analyzePage.value = res.data.page
      analyzeTotal.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取分析列表失败')
    }
  } finally {
    analyzeListLoading.value = false
  }
}

const handleEnterEditorMode = () => {
  editorMode.value = true
  getAnalyzes(1)
  nextTick(updateCanvasWidth)
}

const handleCancelEditorMode = () => {
  if (!activeDashboard.value) return
  editorMode.value = false
  void applyDashboardDetail(activeDashboard.value)
}

const handleAnalyzeDragStart = (analyze: AnalyzeVo.AnalyzeListItem) => {
  draggingAnalyze.value = analyze
}

const handleCanvasDragOver = (event: DragEvent) => {
  if (editorMode.value) {
    event.preventDefault()
  }
}

const handleDropAnalyze = (event: DragEvent) => {
  if (!editorMode.value || !draggingAnalyze.value) return
  handleAddAnalyze(draggingAnalyze.value, getDropGridPosition(event))
  draggingAnalyze.value = null
}

const handleAddAnalyze = async (analyze: AnalyzeVo.AnalyzeListItem, position?: { x: number; y: number }) => {
  const res = await httpRequest<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>('/api/getAnalyze', {
    method: 'POST',
    body: {
      id: analyze.id
    }
  })
  if (res.code !== 200 || !res.data) {
    ElMessage.error(res.message || '获取分析详情失败')
    return
  }
  const nextPosition = position || getNextWidgetPosition()
  const widget = createWidgetState({
    id: 0,
    dashboardId: dashboardForm.id || 0,
    analyzeId: res.data.id,
    widgetTitle: res.data.analyzeName,
    x: nextPosition.x,
    y: nextPosition.y,
    w: 8,
    h: 6,
    chartType: normalizeChartType(res.data.chartConfig?.chartType),
    refreshInterval: 0,
    widgetConfig: {},
    createTime: '',
    updateTime: '',
    createdBy: '',
    updatedBy: '',
    isDeleted: 0,
    analyze: res.data
  })
  widgets.value.push(widget)
  loadWidgetData(widget)
}

const getDropGridPosition = (event: DragEvent) => {
  if (!canvasRef.value) return getNextWidgetPosition()
  const canvasRect = canvasRef.value.getBoundingClientRect()
  const pointerX = event.clientX - canvasRect.left + canvasRef.value.scrollLeft
  const pointerY = event.clientY - canvasRect.top + canvasRef.value.scrollTop
  const gridX = Math.round(pointerX / (columnWidth.value + GRID_GAP))
  const gridY = Math.round(pointerY / (ROW_HEIGHT + GRID_GAP))
  return {
    x: Math.min(GRID_COLUMNS - 8, Math.max(0, gridX)),
    y: Math.max(0, gridY)
  }
}

const getNextWidgetPosition = () => {
  if (widgets.value.length === 0) return { x: 0, y: 0 }
  const maxBottom = Math.max(...widgets.value.map((widget) => widget.y + widget.h))
  return { x: 0, y: maxBottom }
}

const buildWidgetAnalyzeDataParams = (
  chartConfig: AnalyzeConfigVo.ChartConfigResponse
): AnalyzeDataDto.AnalyzeDataQuery => {
  const dataSource = chartConfig.dataSource
  const validation = validateAnalyzeChartConfig({
    chartType: chartConfig.chartType,
    dataSource,
    measures: chartConfig.measures || [],
    dimensions: chartConfig.dimensions || []
  })
  if (!validation.valid) throw new Error(validation.message)
  if (!dataSource) throw new Error('分析数据源不存在')

  return {
    dataSource,
    filters: (chartConfig.filters || []).filter(
      (item) => item.condition.aggregation && (item.condition.operator || item.condition.operand)
    ),
    orders: (chartConfig.orders || []).filter((item) => item.sort.direction),
    dimensions: chartConfig.dimensions || [],
    measures: chartConfig.measures || [],
    commonChartConfig: chartConfig.commonChartConfig
  }
}

const loadWidgetData = async (widget: DashboardWidgetState) => {
  const chartConfig = widget.analyze?.chartConfig
  if (!chartConfig) {
    widget.data = []
    widget.errorMessage = '分析配置不存在'
    return
  }
  widget.loading = true
  widget.errorMessage = ''
  try {
    const res = await httpRequest<ApiResponseI<AnalyzeDataVo.AnalyzeData[]>>('/api/getAnalyzeData', {
      method: 'POST',
      body: buildWidgetAnalyzeDataParams(chartConfig)
    })
    if (res.code === 200) {
      widget.data = res.data || []
    } else {
      widget.data = []
      widget.errorMessage = res.message || '查询失败'
    }
  } catch (error) {
    widget.data = []
    widget.errorMessage = error instanceof Error ? error.message : '查询失败'
  } finally {
    widget.loading = false
  }
}

const handleRefreshWidget = (widget: DashboardWidgetState) => {
  loadWidgetData(widget)
}

const handleRefreshDashboard = () => {
  widgets.value.forEach((widget) => loadWidgetData(widget))
}

const handleRemoveWidget = (widget: DashboardWidgetState) => {
  widgets.value = widgets.value.filter((item) => item.localId !== widget.localId)
}

const handleOpenAnalyze = (widget: DashboardWidgetState, force = false) => {
  if ((!force && editorMode.value) || !widget.analyzeId) return
  router.push(`/analyze/${widget.analyzeId}`)
}

const handleOpenAnalyzeInNewTab = (widget: DashboardWidgetState) => {
  if (!widget.analyzeId) return
  const routeLocation = router.resolve(`/analyze/${widget.analyzeId}`)
  window.open(routeLocation.href, '_blank', 'noopener,noreferrer')
}

const handleSaveDashboard = async () => {
  if (!dashboardForm.id) return
  if (!dashboardForm.dashboardName.trim()) {
    ElMessage.warning('请输入看板名称')
    return
  }
  saving.value = true
  try {
    const res = await httpRequest<ApiResponseI<DashboardVo.DashboardDetailResponse>>('/api/updateDashboard', {
      method: 'POST',
      body: {
        id: dashboardForm.id,
        dashboardName: dashboardForm.dashboardName.trim(),
        dashboardDesc: dashboardForm.dashboardDesc,
        layoutConfig: {
          columnCount: GRID_COLUMNS,
          rowHeight: ROW_HEIGHT
        },
        widgets: widgets.value.map((widget) => ({
          analyzeId: widget.analyzeId,
          widgetTitle: widget.widgetTitle,
          x: widget.x,
          y: widget.y,
          w: widget.w,
          h: widget.h,
          chartType: widget.chartType,
          refreshInterval: widget.refreshInterval,
          widgetConfig: widget.widgetConfig
        }))
      }
    })
    if (res.code === 200 && res.data) {
      ElMessage.success('看板已保存')
      editorMode.value = false
      await applyDashboardDetail(res.data)
    } else {
      ElMessage.error(res.message || '保存看板失败')
    }
  } finally {
    saving.value = false
  }
}

const loadDashboardVersionList = async () => {
  if (!dashboardForm.id) {
    versionList.value = []
    return
  }

  versionListLoading.value = true
  const result = await httpRequest<ApiResponseI<DashboardVo.DashboardConfigHistoryItem[]>>(
    '/api/getDashboardConfigHistory',
    {
      method: 'POST',
      body: {
        dashboardId: dashboardForm.id
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
  await loadDashboardVersionList()
}

const handleSwitchVersion = async (versionItem: DashboardVo.DashboardConfigHistoryItem) => {
  if (!dashboardForm.id || versionItem.id === activeDashboard.value?.currentConfigId) {
    return
  }

  if (hasUnsavedChanges()) {
    versionDialogVisible.value = false
    try {
      await ElMessageBox.confirm('当前看板有未保存的改动，切换版本会丢失这些改动，是否继续？', '未保存改动', {
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
  try {
    const widgetsWithAnalyze = await Promise.all(
      (versionItem.widgetsConfig || []).map(async (widgetConfig, index) => {
        const fallbackWidget: DashboardVo.DashboardWidgetItem = {
          id: index + 1,
          dashboardId: dashboardForm.id!,
          ...widgetConfig,
          createTime: versionItem.createTime,
          updateTime: versionItem.updateTime,
          createdBy: versionItem.createdBy,
          updatedBy: activeDashboard.value?.updatedBy || '',
          isDeleted: 0,
          analyze: null
        }

        try {
          const res = await httpRequest<ApiResponseI<AnalyzeVo.AnalyzeDetailResponse>>('/api/getAnalyze', {
            method: 'POST',
            body: {
              id: widgetConfig.analyzeId
            }
          })
          if (res.code === 200 && res.data) {
            return {
              ...fallbackWidget,
              widgetTitle: widgetConfig.widgetTitle || res.data.analyzeName,
              chartType: normalizeChartType(widgetConfig.chartType || res.data.chartConfig?.chartType),
              analyze: res.data
            }
          }
        } catch (_error) {
          return fallbackWidget
        }

        return fallbackWidget
      })
    )

    await applyDashboardDetail({
      ...(activeDashboard.value as DashboardVo.DashboardDetailResponse),
      currentConfigId: versionItem.id,
      layoutConfig: versionItem.layoutConfig,
      widgets: widgetsWithAnalyze
    })
  } finally {
    versionSwitching.value = false
  }

  ElMessage.success('已切换到该历史版本，是否保存由你决定')
}

const getWidgetStyle = (widget: DashboardWidgetState) => {
  const left = widget.x * (columnWidth.value + GRID_GAP)
  const top = widget.y * (ROW_HEIGHT + GRID_GAP)
  const width = widget.w * columnWidth.value + (widget.w - 1) * GRID_GAP
  const height = widget.h * ROW_HEIGHT + (widget.h - 1) * GRID_GAP
  return {
    transform: `translate(${left}px, ${top}px)`,
    width: `${width}px`,
    height: `${height}px`
  }
}

const getCanvasSpacerStyle = () => {
  return {
    top: `${canvasContentBottom.value}px`,
    height: `${CANVAS_BOTTOM_SPACE}px`
  }
}

const handleWidgetMoveStart = (event: PointerEvent, widget: DashboardWidgetState) => {
  if (!editorMode.value) return
  event.preventDefault()
  const startX = event.clientX
  const startY = event.clientY
  const startGridX = widget.x
  const startGridY = widget.y

  const handleMove = (moveEvent: PointerEvent) => {
    const deltaX = moveEvent.clientX - startX
    const deltaY = moveEvent.clientY - startY
    const nextX = startGridX + Math.round(deltaX / (columnWidth.value + GRID_GAP))
    const nextY = startGridY + Math.round(deltaY / (ROW_HEIGHT + GRID_GAP))
    widget.x = Math.min(GRID_COLUMNS - widget.w, Math.max(0, nextX))
    widget.y = Math.max(0, nextY)
  }

  const handleEnd = () => {
    window.removeEventListener('pointermove', handleMove)
    window.removeEventListener('pointerup', handleEnd)
  }

  window.addEventListener('pointermove', handleMove)
  window.addEventListener('pointerup', handleEnd)
}

const handleWidgetResizeStart = (event: PointerEvent, widget: DashboardWidgetState, handle: ResizeHandle) => {
  if (!editorMode.value) return
  event.preventDefault()
  event.stopPropagation()
  const startX = event.clientX
  const startY = event.clientY
  const startGridX = widget.x
  const startGridY = widget.y
  const startW = widget.w
  const startH = widget.h
  const startRight = startGridX + startW
  const startBottom = startGridY + startH

  const handleMove = (moveEvent: PointerEvent) => {
    const deltaX = moveEvent.clientX - startX
    const deltaY = moveEvent.clientY - startY
    const deltaGridX = Math.round(deltaX / (columnWidth.value + GRID_GAP))
    const deltaGridY = Math.round(deltaY / (ROW_HEIGHT + GRID_GAP))
    let nextX = startGridX
    let nextY = startGridY
    let nextRight = startRight
    let nextBottom = startBottom

    if (handle.includes('e')) {
      nextRight = Math.min(GRID_COLUMNS, Math.max(startGridX + MIN_WIDGET_WIDTH, startRight + deltaGridX))
    }

    if (handle.includes('w')) {
      nextX = Math.min(startRight - MIN_WIDGET_WIDTH, Math.max(0, startGridX + deltaGridX))
    }

    if (handle.includes('s')) {
      nextBottom = Math.max(startGridY + MIN_WIDGET_HEIGHT, startBottom + deltaGridY)
    }

    if (handle.includes('n')) {
      nextY = Math.min(startBottom - MIN_WIDGET_HEIGHT, Math.max(0, startGridY + deltaGridY))
    }

    widget.x = nextX
    widget.y = nextY
    widget.w = nextRight - nextX
    widget.h = nextBottom - nextY
  }

  const handleEnd = () => {
    window.removeEventListener('pointermove', handleMove)
    window.removeEventListener('pointerup', handleEnd)
  }

  window.addEventListener('pointermove', handleMove)
  window.addEventListener('pointerup', handleEnd)
}

const updateCanvasWidth = () => {
  canvasWidth.value = canvasRef.value?.clientWidth || 0
}

onMounted(() => {
  loadDashboardDetail()
  resizeObserver.value = new ResizeObserver(updateCanvasWidth)
  if (canvasRef.value) {
    resizeObserver.value.observe(canvasRef.value)
  }
})

watch(
  () => route.params.id,
  () => {
    loadDashboardDetail()
  }
)

watch(canvasRef, (element) => {
  resizeObserver.value?.disconnect()
  resizeObserver.value = new ResizeObserver(updateCanvasWidth)
  if (element) {
    resizeObserver.value.observe(element)
    updateCanvasWidth()
  }
})

onUnmounted(() => {
  resizeObserver.value?.disconnect()
})
</script>

<style scoped lang="scss">
.dashboard-sidebar__section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.dashboard-sidebar__section--grow {
  flex: 1 1 0;
  min-height: 0;
}

.dashboard-sidebar__title {
  color: #303133;
  font-size: 14px;
  font-weight: 700;
}

.analyze-source-list {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
}

.analyze-source-item {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
  cursor: grab;
}

.analyze-source-item__name {
  color: #303133;
  font-size: 13px;
  font-weight: 700;
}

.analyze-source-item__desc {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}

.dashboard-editor-subtitle {
  color: #909399;
  font-size: 12px;
}

.dashboard-canvas-loading,
.dashboard-canvas {
  position: relative;
  height: 100%;
  min-height: 0;
}

.dashboard-canvas-spacer {
  position: absolute;
  left: 0;
  width: 1px;
  pointer-events: none;
}

.dashboard-widget {
  position: absolute;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgb(15 23 42 / 6%);
}

.dashboard-widget__header {
  display: flex;
  height: 32px;
  flex: 0 0 32px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 10px;
  border-bottom: 1px solid #ebeef5;
  cursor: move;
}

.dashboard-widget__title {
  min-width: 0;
  overflow: hidden;
  color: #303133;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    color: #409eff;
  }
}

.dashboard-widget__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 4px;
}

.dashboard-widget__icon-button {
  display: inline-flex;
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 4px;
  color: #606266;
  background: transparent;
  cursor: pointer;
  transition:
    color 0.15s,
    background 0.15s;

  &:hover {
    color: #409eff;
    background: #ecf5ff;
  }

  &:disabled {
    color: #c0c4cc;
    cursor: not-allowed;
    background: transparent;
  }
}

.dashboard-widget__body {
  flex: 1 1 0;
  min-height: 0;
  padding: 6px;
  overflow: hidden;
}

.dashboard-widget__resize {
  position: absolute;
  z-index: 3;
}

.dashboard-widget__resize--n,
.dashboard-widget__resize--s {
  left: 12px;
  width: calc(100% - 24px);
  height: 8px;
  cursor: ns-resize;
}

.dashboard-widget__resize--n {
  top: -4px;
}

.dashboard-widget__resize--s {
  bottom: -4px;
}

.dashboard-widget__resize--e,
.dashboard-widget__resize--w {
  top: 12px;
  width: 8px;
  height: calc(100% - 24px);
  cursor: ew-resize;
}

.dashboard-widget__resize--e {
  right: -4px;
}

.dashboard-widget__resize--w {
  left: -4px;
}

.dashboard-widget__resize--ne,
.dashboard-widget__resize--nw,
.dashboard-widget__resize--se,
.dashboard-widget__resize--sw {
  width: 14px;
  height: 14px;
}

.dashboard-widget__resize--ne {
  top: -5px;
  right: -5px;
  cursor: nesw-resize;
}

.dashboard-widget__resize--nw {
  top: -5px;
  left: -5px;
  cursor: nwse-resize;
}

.dashboard-widget__resize--se {
  right: -5px;
  bottom: -5px;
  cursor: nwse-resize;
}

.dashboard-widget__resize--sw {
  bottom: -5px;
  left: -5px;
  cursor: nesw-resize;
}

.dashboard-widget__resize--se::after {
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 8px;
  height: 8px;
  border-right: 2px solid #a8abb2;
  border-bottom: 2px solid #a8abb2;
  content: '';
}

.dashboard-canvas-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dashboard-canvas-empty__image {
  position: relative;
  width: 96px;
  height: 72px;
  margin: 0 auto;
}

.dashboard-canvas-empty__panel {
  position: absolute;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #ffffff;
  box-shadow: 0 4px 12px rgb(15 23 42 / 6%);
}

.dashboard-canvas-empty__panel--main {
  top: 8px;
  left: 8px;
  width: 52px;
  height: 38px;
}

.dashboard-canvas-empty__panel--side {
  top: 16px;
  right: 8px;
  width: 28px;
  height: 28px;
}

.dashboard-canvas-empty__panel--footer {
  bottom: 8px;
  left: 22px;
  width: 54px;
  height: 16px;
  background: #f9fafb;
}
</style>
