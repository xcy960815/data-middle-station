<template>
  <div v-loading="loading" class="dashboard-canvas-loading">
    <div
      :ref="bindCanvasRef"
      class="dashboard-canvas"
      @dragover.prevent="emit('dragover', $event)"
      @drop="emit('drop', $event)"
    >
      <div v-if="editorMode" class="dashboard-canvas-spacer" :style="getCanvasSpacerStyle()"></div>
      <div v-for="widget in widgets" :key="widget.localId" class="dashboard-widget" :style="getWidgetStyle(widget)">
        <div class="dashboard-widget__header" @pointerdown="emit('widget-move-start', $event, widget)">
          <span class="dashboard-widget__title" @click.stop="emit('open-analyze', widget)">
            {{ widget.widgetTitle }}
          </span>
          <div class="dashboard-widget__actions">
            <el-tooltip content="打开分析" placement="top">
              <button
                class="dashboard-widget__icon-button"
                type="button"
                :disabled="!widget.analyzeId"
                @click.stop="emit('open-analyze-in-new-tab', widget)"
                @pointerdown.stop
              >
                <icon-park type="PreviewOpen" size="14" fill="currentColor" />
              </button>
            </el-tooltip>
            <template v-if="editorMode">
              <el-button text size="small" @click.stop="emit('refresh-widget', widget)">刷新</el-button>
              <el-button text size="small" type="danger" @click.stop="emit('remove-widget', widget)">删除</el-button>
            </template>
          </div>
        </div>
        <div class="dashboard-widget__body">
          <DashboardChart
            :title="widget.widgetTitle"
            :chart-type="widget.chartType"
            :dataset-id="widget.datasetId"
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
            @pointerdown="emit('widget-resize-start', $event, widget, handle)"
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

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import DashboardChart from '../chart/index.vue'
import type { DashboardWidgetState, ResizeHandle } from '../../composables/useDashboard'

defineProps<{
  loading: boolean
  editorMode: boolean
  widgets: DashboardWidgetState[]
  resizeHandles: ResizeHandle[]
  bindCanvasRef: (el: HTMLElement | null) => void
  getWidgetStyle: (widget: DashboardWidgetState) => Record<string, string>
  getCanvasSpacerStyle: () => Record<string, string>
}>()

const emit = defineEmits<{
  dragover: [event: DragEvent]
  drop: [event: DragEvent]
  'widget-move-start': [event: PointerEvent, widget: DashboardWidgetState]
  'widget-resize-start': [event: PointerEvent, widget: DashboardWidgetState, handle: ResizeHandle]
  'open-analyze': [widget: DashboardWidgetState]
  'open-analyze-in-new-tab': [widget: DashboardWidgetState]
  'refresh-widget': [widget: DashboardWidgetState]
  'remove-widget': [widget: DashboardWidgetState]
}>()
</script>

<style scoped lang="scss">
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
