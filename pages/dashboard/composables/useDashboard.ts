import { httpRequest } from '@/composables/useHttpRequest'
import { validateAnalyzeChartConfig } from '@/utils/validateAnalyzeChartConfig'
import { ElMessage, ElMessageBox } from 'element-plus'

export type DashboardWidgetState = DashboardDto.DashboardWidgetPayload & {
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

export type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

/**
 * Composable for dashboard business logic including API calls, widget state
 * management, version switching, dirty tracking, and analyze list management.
 *
 * After calling this composable AND `useWidgetDragResize`, assign
 * `getDropGridPosition` and `updateCanvasWidth` on the returned object
 * so that drag-and-drop and canvas-width refresh work correctly.
 */
export function useDashboard() {
  const route = useRoute()
  const router = useRouter()

  // --- Constants ---
  const GRID_COLUMNS = 24
  const ROW_HEIGHT = 60
  const MIN_WIDGET_WIDTH = 2
  const MIN_WIDGET_HEIGHT = 2

  // Bridge callbacks — assigned by the page after useWidgetDragResize initialises,
  // so that cross-composable functions are available when user events fire.
  let _getDropGridPosition: ((event: DragEvent) => { x: number; y: number }) | null = null
  let _updateCanvasWidth: (() => void) | null = null

  // --- State ---
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

  // Analyze list state
  const analyzes = ref<AnalyzeVo.AnalyzeListItem[]>([])
  const analyzeListLoading = ref(false)
  const analyzePage = ref(1)
  const analyzePageSize = ref(20)
  const analyzeTotal = ref(0)
  const analyzeKeyword = ref('')
  const draggingAnalyze = ref<AnalyzeVo.AnalyzeListItem | null>(null)

  // --- Internal maps ---
  const permissionLevelMap: Record<PermissionVo.ResourcePermissionType, number> = {
    none: 0,
    view: 1,
    edit: 2,
    manage: 3
  }
  const chartTypeSet = new Set<AnalyzeStore.ChartType>(['table', 'line', 'pie', 'interval'])

  // --- Computed ---
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

  // --- Functions ---

  const normalizeChartType = (chartType?: string | null): AnalyzeStore.ChartType => {
    return chartTypeSet.has(chartType as AnalyzeStore.ChartType) ? (chartType as AnalyzeStore.ChartType) : 'table'
  }

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
    _updateCanvasWidth?.()
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
    const position = _getDropGridPosition ? _getDropGridPosition(event) : getNextWidgetPosition()
    handleAddAnalyze(draggingAnalyze.value, position)
    draggingAnalyze.value = null
  }

  const getNextWidgetPosition = () => {
    if (widgets.value.length === 0) return { x: 0, y: 0 }
    const maxBottom = Math.max(...widgets.value.map((widget) => widget.y + widget.h))
    return { x: 0, y: maxBottom }
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
        (item) => item.filterRule.aggregation && (item.filterRule.operator || item.filterRule.operand)
      ),
      orders: (chartConfig.orders || []).filter((item) => item.orderRule.direction),
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

  const result = Object.assign({
    // State
    activeDashboard,
    editorMode,
    detailLoading,
    dashboardForm,
    widgets,
    saving,
    versionDialogVisible,
    versionListLoading,
    versionSwitching,
    versionList,
    lastSavedSnapshot,
    analyzes,
    analyzeListLoading,
    analyzePage,
    analyzePageSize,
    analyzeTotal,
    analyzeKeyword,
    draggingAnalyze,

    // Computed
    canEditDashboard,
    hasUnsavedChangesValue,

    // Functions
    normalizeChartType,
    loadDashboardDetail,
    createWidgetState,
    updateLastSavedSnapshot,
    hasUnsavedChanges,
    applyDashboardDetail,
    getAnalyzes,
    handleEnterEditorMode,
    handleCancelEditorMode,
    handleAnalyzeDragStart,
    handleCanvasDragOver,
    handleDropAnalyze,
    handleAddAnalyze,
    buildWidgetAnalyzeDataParams,
    loadWidgetData,
    handleRefreshWidget,
    handleRefreshDashboard,
    handleRemoveWidget,
    handleOpenAnalyze,
    handleOpenAnalyzeInNewTab,
    handleSaveDashboard,
    loadDashboardVersionList,
    handleOpenVersionDialog,
    handleSwitchVersion
  })

  // Mutable bridge properties — the page assigns these after useWidgetDragResize
  // initialises so that the closures above can call them at event time.
  Object.defineProperty(result, 'getDropGridPosition', {
    get: () => _getDropGridPosition,
    set: (fn: ((event: DragEvent) => { x: number; y: number }) | null) => {
      _getDropGridPosition = fn
    }
  })
  Object.defineProperty(result, 'updateCanvasWidth', {
    get: () => _updateCanvasWidth,
    set: (fn: (() => void) | null) => {
      _updateCanvasWidth = fn
    }
  })

  return result
}
