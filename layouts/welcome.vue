<template>
  <!-- 欢迎页面的layout布局 -->
  <el-container
    class="layout-welcome-main h-full w-full !flex !flex-col flex-1 border-box"
  >
    <template v-slot:default>
      <slot />
    </template>
  </el-container>
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
