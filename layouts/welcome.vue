<template>
  <!-- 欢迎页面的layout布局 -->
  <div
    class="layout-welcome-main h-full w-full !flex !flex-col flex-1 border-box"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'WelcomeLayout'
})
</script>

<style lang="scss" scoped>
.layout-welcome-main {
  min-height: 100vh;
  background-color: var(--el-bg-color);
}
</style>
