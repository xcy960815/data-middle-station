<template>
  <!-- 看板页面的layout布局 -->
  <div class="layout-dashboard-main h-full w-full !flex !flex-col flex-1 border-box">
    <slot name="header"></slot>
    <div class="layout-dashboard-body !flex flex-1 overflow-hidden">
      <div class="h-full w-full overflow-hidden">
        <slot name="content"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scss scoped></style>
