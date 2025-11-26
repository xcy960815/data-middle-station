<template>
  <!-- 首页页面的layout布局 -->
  <div class="layout-homepaage-main h-full w-full !flex !flex-col flex-1 border-box">
    <slot name="header"></slot>
    <div class="layout-homepage-body !flex flex-1 overflow-hidden">
      <div class="w-full h-full overflow-y-auto overflow-x-hidden">
        <slot name="content"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped></style>
