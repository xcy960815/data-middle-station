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
        :can-manage="canManageDashboard"
        :resource-id="activeDashboard?.id ?? null"
        :resource-name="dashboardForm.dashboardName"
        :saving="saving"
        :has-unsaved-changes="hasUnsavedChangesValue"
        :global-refresh-interval="globalRefreshInterval"
        @change-refresh-interval="handleChangeRefreshInterval"
        @refresh-dashboard="handleRefreshDashboard"
        @enter-editor-mode="handleEnterEditorMode"
        @cancel-editor-mode="handleCancelEditorMode"
        @save-dashboard="handleSaveDashboard"
        @open-version-dialog="handleOpenVersionDialog"
      />
    </template>

    <template #sidebar>
      <DashboardAnalyzeSource
        v-model:keyword="analyzeKeyword"
        :analyzes="analyzes"
        :loading="analyzeListLoading"
        :page="analyzePage"
        :page-size="analyzePageSize"
        :total="analyzeTotal"
        @search="getAnalyzes"
        @dragstart="handleAnalyzeDragStart"
        @add="handleAddAnalyze"
      />
    </template>

    <template #canvas-toolbar>
      <div class="dashboard-editor-subtitle">拖拽左侧分析到画布，拖动标题栏调整位置，拖动右下角调整宽高。</div>
    </template>

    <template #canvas>
      <DashboardCanvas
        :loading="detailLoading"
        :editor-mode="editorMode"
        :widgets="widgets"
        :resize-handles="resizeHandles"
        :bind-canvas-ref="bindCanvasRef"
        :get-widget-style="getWidgetStyle"
        :get-canvas-spacer-style="getCanvasSpacerStyle"
        @dragover="handleCanvasDragOver"
        @drop="handleDropAnalyze"
        @widget-move-start="handleWidgetMoveStart"
        @widget-resize-start="handleWidgetResizeStart"
        @open-analyze="handleOpenAnalyze"
        @open-analyze-in-new-tab="handleOpenAnalyzeInNewTab"
        @refresh-widget="handleRefreshWidget"
        @remove-widget="handleRemoveWidget"
      />
    </template>
  </NuxtLayout>

  <DashboardVersionDialog
    v-model:visible="versionDialogVisible"
    :loading="versionListLoading"
    :switching="versionSwitching"
    :version-list="versionList"
    :current-config-id="activeDashboard?.currentConfigId"
    @switch-version="handleSwitchVersion"
  />
</template>

<script setup lang="ts">
import { useDashboard } from './composables/useDashboard'
import { useWidgetDragResize } from './composables/useWidgetDragResize'
import HeaderTitle from '@/components/header-title/index.vue'
import DashboardBar from './components/bar/index.vue'
import DashboardCanvas from './components/canvas/index.vue'
import DashboardAnalyzeSource from './components/analyze-source/index.vue'
import DashboardVersionDialog from './components/version-dialog/index.vue'

const layoutName = 'dashboard'
const route = useRoute()

const dashboard = useDashboard()

const {
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
  globalRefreshInterval,
  canEditDashboard,
  canManageDashboard,
  hasUnsavedChangesValue,
  analyzes,
  analyzeListLoading,
  analyzePage,
  analyzePageSize,
  analyzeTotal,
  analyzeKeyword,
  loadDashboardDetail,
  getAnalyzes,
  handleEnterEditorMode,
  handleCancelEditorMode,
  handleAnalyzeDragStart,
  handleCanvasDragOver,
  handleDropAnalyze,
  handleAddAnalyze,
  handleRefreshWidget,
  handleRefreshDashboard,
  handleRemoveWidget,
  handleOpenAnalyze,
  handleOpenAnalyzeInNewTab,
  handleSaveDashboard,
  handleOpenVersionDialog,
  handleSwitchVersion
} = dashboard

const canvasRef = ref<HTMLElement | null>(null)
const bindCanvasRef = (el: HTMLElement | null) => {
  canvasRef.value = el
}

const {
  resizeHandles,
  getWidgetStyle,
  getCanvasSpacerStyle,
  handleWidgetMoveStart,
  handleWidgetResizeStart,
  getDropGridPosition,
  updateCanvasWidth
} = useWidgetDragResize({
  widgets,
  editorMode,
  canvasRef,
  gridColumns: 24,
  rowHeight: 60,
  gridGap: 12,
  minWidgetWidth: 2,
  minWidgetHeight: 2,
  canvasHorizontalPadding: 8,
  canvasBottomSpace: 320
})

dashboard.getDropGridPosition = getDropGridPosition
dashboard.updateCanvasWidth = updateCanvasWidth

const handleChangeRefreshInterval = (val: number) => {
  globalRefreshInterval.value = val
}

let refreshTimer: NodeJS.Timeout | null = null

const startRefreshTimer = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
  if (globalRefreshInterval.value > 0) {
    refreshTimer = setInterval(() => {
      handleRefreshDashboard()
    }, globalRefreshInterval.value * 1000)
  }
}

watch(
  () => globalRefreshInterval.value,
  () => {
    startRefreshTimer()
  }
)

onMounted(() => {
  loadDashboardDetail()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})

watch(
  () => route.params.id,
  () => {
    loadDashboardDetail()
  }
)
</script>

<style scoped lang="scss">
.dashboard-editor-subtitle {
  color: #909399;
  font-size: 12px;
}
</style>
