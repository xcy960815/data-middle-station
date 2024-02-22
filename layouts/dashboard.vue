<template>
  <!-- 看板页面的layout布局 -->
  <el-container
    class="layout-dashboard-main h-full w-full !flex !flex-col flex-1 border-box"
  >
    <slot name="header"></slot>
    <el-container
      class="layout-dashboard-body !flex overflow-hidden"
    >
    </el-container>
  </el-container>
</template>

<script setup lang="ts"></script>

<style scss scoped></style>
