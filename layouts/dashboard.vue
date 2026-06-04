<template>
  <!-- 看板页面的layout布局 -->
  <div class="layout-dashboard-main h-full w-full !flex !flex-col flex-1 border-box">
    <slot name="header"></slot>
    <div v-if="$slots.bar" class="layout-dashboard-bar">
      <slot name="bar"></slot>
    </div>
    <div class="layout-dashboard-body !flex flex-1 overflow-hidden">
      <template v-if="$slots.content">
        <div class="h-full w-full overflow-hidden">
          <slot name="content"></slot>
        </div>
      </template>
      <template v-else>
        <div class="layout-dashboard-editor" :class="{ 'layout-dashboard-editor--editing': editing }">
          <aside v-if="editing && $slots.sidebar" class="layout-dashboard-sidebar">
            <slot name="sidebar"></slot>
          </aside>

          <main class="layout-dashboard-canvas-wrap">
            <div v-if="editing && $slots['canvas-toolbar']" class="layout-dashboard-canvas-toolbar">
              <slot name="canvas-toolbar"></slot>
            </div>
            <div class="layout-dashboard-canvas" :class="{ 'layout-dashboard-canvas--editing': editing }">
              <slot name="canvas"></slot>
            </div>
          </main>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    editing?: boolean
  }>(),
  {
    editing: false
  }
)
</script>

<style lang="scss" scoped>
.layout-dashboard-bar {
  min-height: 36px;
  padding: 0 16px;
  border-bottom: 1px solid #dcdfe6;
  background: #ffffff;
}

.layout-dashboard-editor {
  display: flex;
  height: 100%;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: #f3f4f6;
}

.layout-dashboard-sidebar {
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

.layout-dashboard-canvas-wrap {
  display: flex;
  flex: 1 1 0;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.layout-dashboard-canvas-toolbar {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #dcdfe6;
  background: #ffffff;
}

.layout-dashboard-canvas {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px;
  background: #f3f4f6;
}

.layout-dashboard-canvas--editing {
  padding: 12px 16px 12px 12px;
  background-image: linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px);
  background-size: 32px 32px;
}
</style>
