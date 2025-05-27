<template>
  <!-- 首页页面的layout布局 -->
  <div
    class="layout-dashboard-main h-full w-full !flex !flex-col flex-1 border-box"
  >
    <slot name="header"></slot>
    <div
      class="layout-dashboard-body !flex overflow-hidden"
    >
      <slot name="content"></slot>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scss scoped></style>
