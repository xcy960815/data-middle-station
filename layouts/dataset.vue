<template>
  <!-- 数据资产页面的layout布局，供数据集和数据源列表页复用 -->
  <div class="layout-dataset-main h-full w-full !flex !flex-col flex-1 border-box">
    <slot name="header"></slot>
    <div v-if="$slots.bar" class="layout-dataset-bar">
      <slot name="bar"></slot>
    </div>
    <div class="layout-dataset-body">
      <template v-if="$slots.content">
        <slot name="content"></slot>
      </template>
      <template v-else>
        <div v-if="$slots.toolbar" class="layout-dataset-toolbar">
          <slot name="toolbar"></slot>
        </div>
        <div class="layout-dataset-list">
          <slot name="list"></slot>
        </div>
        <div v-if="$slots.pagination" class="layout-dataset-pagination">
          <slot name="pagination"></slot>
        </div>
      </template>
    </div>
    <slot name="dialogs"></slot>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped lang="scss">
.layout-dataset-bar {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 16px;
  border-bottom: 1px solid #dcdfe6;
  background: #ffffff;
}

.layout-dataset-body {
  display: flex;
  flex: 1 1 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.layout-dataset-toolbar {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.layout-dataset-list {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 20px;
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.layout-dataset-pagination {
  display: flex;
  flex: 0 0 auto;
  justify-content: flex-end;
  padding: 12px 16px;
}
</style>
