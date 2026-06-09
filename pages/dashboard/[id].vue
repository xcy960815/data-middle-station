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
import { useDashboard } from './composables/useDashboard'
import { useWidgetDragResize } from './composables/useWidgetDragResize'
import { IconPark } from '@icon-park/vue-next/es/all'
import HeaderTitle from '@/components/header-title/index.vue'
import DashboardBar from './components/bar/index.vue'
import DashboardWidgetChart from './components/dashboard-widget-chart.vue'

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
  canEditDashboard,
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
  canvasHorizontalPadding: 28,
  canvasBottomSpace: 320
})

// Wire bridge callbacks so useDashboard closures can call useWidgetDragResize functions
dashboard.getDropGridPosition = getDropGridPosition
dashboard.updateCanvasWidth = updateCanvasWidth

watch(
  () => route.params.id,
  () => {
    loadDashboardDetail()
  }
)
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
