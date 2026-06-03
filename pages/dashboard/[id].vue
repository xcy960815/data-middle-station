<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #chart-name>
          <div class="dashboard-header-title">
            <h4
              class="dashboard-header-title__name"
              :class="{ 'is-editable': editorMode }"
              @click="handleUpdateDashboardName"
            >
              {{ dashboardForm.dashboardName || '未命名看板' }}
              <span v-if="editorMode" class="dashboard-header-title__edit"><i class="icon-park-outline-edit"></i></span>
            </h4>
            <p
              class="dashboard-header-title__desc"
              :class="{ 'is-editable': editorMode }"
              @click="handleUpdateDashboardDesc"
            >
              {{ dashboardForm.dashboardDesc || '暂无描述' }}
              <span v-if="editorMode" class="dashboard-header-title__edit"><i class="icon-park-outline-edit"></i></span>
            </p>
          </div>
        </template>
        <template #header-right>
          <div class="dashboard-header-actions">
            <el-button @click="handleBackToList">返回列表</el-button>
            <el-button v-if="!editorMode && canEditDashboard" type="primary" @click="handleEnterEditorMode"
              >编辑看板</el-button
            >
            <el-button v-if="editorMode" @click="handleCancelEditorMode">退出编辑</el-button>
            <el-button v-if="editorMode" type="primary" :loading="saving" @click="handleSaveDashboard"
              >保存看板</el-button
            >
          </div>
        </template>
      </custom-header>
    </template>

    <template #content>
      <div v-loading="detailLoading" class="dashboard-editor" :class="{ 'dashboard-editor--editing': editorMode }">
        <aside v-if="editorMode" class="dashboard-sidebar">
          <div class="dashboard-sidebar__section">
            <div class="dashboard-sidebar__title">看板信息</div>
            <el-input v-model="dashboardForm.dashboardName" placeholder="看板名称" />
            <el-input
              v-model="dashboardForm.dashboardDesc"
              class="dashboard-sidebar__desc"
              type="textarea"
              :rows="3"
              placeholder="看板描述"
            />
          </div>

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
        </aside>

        <main class="dashboard-canvas-wrap">
          <div v-if="editorMode" class="dashboard-canvas-toolbar">
            <div class="dashboard-editor-subtitle">拖拽左侧分析到画布，拖动标题栏调整位置，拖动右下角调整宽高。</div>
          </div>
          <div
            ref="canvasRef"
            class="dashboard-canvas"
            :class="{ 'dashboard-canvas--editing': editorMode }"
            @dragover.prevent="handleCanvasDragOver"
            @drop="handleDropAnalyze"
          >
            <div v-if="editorMode" class="dashboard-canvas-spacer" :style="getCanvasSpacerStyle()"></div>
            <div
              v-for="widget in widgets"
              :key="widget.localId"
              class="dashboard-widget"
              :style="getWidgetStyle(widget)"
            >
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
            />
          </div>
        </main>
      </div>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox } from 'element-plus'
import DashboardWidgetChart from './components/dashboard-widget-chart.vue'

type DashboardWidgetState = DashboardDto.DashboardWidgetPayload & {
  localId: string
  data: AnalyzeDataVo.AnalyzeData[]
  xAxisFields: GroupStore.GroupOption[]
  yAxisFields: DimensionStore.DimensionOption[]
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
    activeDashboard.value = res.data
    dashboardForm.id = res.data.id
    dashboardForm.dashboardName = res.data.dashboardName
    dashboardForm.dashboardDesc = res.data.dashboardDesc
    widgets.value = res.data.widgets.map((widget) => createWidgetState(widget))
    await nextTick()
    updateCanvasWidth()
    widgets.value.forEach((widget) => loadWidgetData(widget))
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
    xAxisFields: (chartConfig?.groups || []) as GroupStore.GroupOption[],
    yAxisFields: (chartConfig?.dimensions || []) as DimensionStore.DimensionOption[],
    privateChartConfig: chartConfig?.privateChartConfig || null,
    loading: false,
    errorMessage: widget.analyze ? '' : '分析不存在或无权访问'
  }
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

const handleBackToList = () => {
  router.push('/dashboard')
}

const handleEnterEditorMode = () => {
  editorMode.value = true
  getAnalyzes(1)
  nextTick(updateCanvasWidth)
}

const handleCancelEditorMode = () => {
  if (!activeDashboard.value) return
  editorMode.value = false
  dashboardForm.dashboardName = activeDashboard.value.dashboardName
  dashboardForm.dashboardDesc = activeDashboard.value.dashboardDesc
  widgets.value = activeDashboard.value.widgets.map((widget) => createWidgetState(widget))
  widgets.value.forEach((widget) => loadWidgetData(widget))
  nextTick(updateCanvasWidth)
}

const handleUpdateDashboardName = () => {
  if (!editorMode.value) return
  ElMessageBox.prompt('请输入看板名称', '编辑看板名称', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{1,30}$/,
    inputErrorMessage: '看板名称仅支持中英文、数字、下划线，且不能为空',
    inputValue: dashboardForm.dashboardName || '未命名看板',
    autofocus: true
  }).then(({ value }) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      ElMessage.error('看板名称不能为空')
      return
    }
    dashboardForm.dashboardName = normalizedValue
  })
}

const handleUpdateDashboardDesc = () => {
  if (!editorMode.value) return
  ElMessageBox.prompt('请输入看板描述', '编辑看板描述', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{0,100}$/,
    inputErrorMessage: '描述仅支持中英文、数字、下划线',
    inputValue: dashboardForm.dashboardDesc || '',
    autofocus: true
  }).then(({ value }) => {
    dashboardForm.dashboardDesc = value.trim()
  })
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
  return {
    dataSource: chartConfig.dataSource,
    filters: (chartConfig.filters || []).filter(
      (item) => item.aggregationType && (item.filterType || item.filterValue)
    ),
    orders: (chartConfig.orders || []).filter((item) => item.aggregationType || item.orderType),
    groups: chartConfig.groups || [],
    dimensions: chartConfig.dimensions || [],
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
      activeDashboard.value = res.data
      dashboardForm.dashboardName = res.data.dashboardName
      dashboardForm.dashboardDesc = res.data.dashboardDesc
      widgets.value = res.data.widgets.map((widget) => createWidgetState(widget))
      widgets.value.forEach((widget) => loadWidgetData(widget))
    } else {
      ElMessage.error(res.message || '保存看板失败')
    }
  } finally {
    saving.value = false
  }
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
.dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-header-title {
  display: flex;
  min-width: 0;
  max-width: 520px;
  flex-direction: column;
  align-items: center;
  padding: 2px 0;
}

.dashboard-header-title__name {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  margin: 0;
  overflow: hidden;
  color: #303133;
  font-size: 17px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-editable {
    cursor: pointer;
  }
}

.dashboard-header-title__desc {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 6px;
  margin: 2px 0 0;
  overflow: hidden;
  color: #606266;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-editable {
    cursor: pointer;
  }
}

.dashboard-header-title__edit {
  color: #909399;
  font-size: 13px;
}

.dashboard-editor {
  display: flex;
  height: 100%;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: #f3f4f6;
}

.dashboard-sidebar {
  display: flex;
  width: 320px;
  min-width: 320px;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  padding: 16px;
  border-right: 1px solid #dcdfe6;
  background: #ffffff;
}

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

.dashboard-sidebar__desc {
  width: 100%;
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

.dashboard-canvas-wrap {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-canvas-toolbar {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #dcdfe6;
  background: #ffffff;
}

.dashboard-editor-subtitle {
  color: #909399;
  font-size: 12px;
}

.dashboard-canvas {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px;
  background: #f3f4f6;
}

.dashboard-canvas--editing {
  padding: 12px 16px 12px 12px;
  background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
  background-size: 32px 32px;
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
</style>
