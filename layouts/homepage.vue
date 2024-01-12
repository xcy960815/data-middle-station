<template>
  <!-- 首页页面的layout布局 -->
  <el-container
    class="layout-dashboard-main h-full w-full !flex !flex-col flex-1 border-box"
  >
    <slot name="header"></slot>
    <el-container
      class="layout-dashboard-body !flex overflow-hidden"
    >
    <slot name="content"></slot>
    </el-container>
  </el-container>
</template>

<script setup lang="ts"></script>

<style less scoped></style>
