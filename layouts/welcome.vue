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

// 初始化数据
const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const fontColors = [
  '#33B5E5',
  '#0099CC',
  '#AA66CC',
  '#9933CC',
  '#99CC00',
  '#669900',
  '#FFBB33',
  '#FF8800',
  '#FF4444',
  '#CC0000'
]
const fontSizeMultiplier = 1
const setIntervalId = ref<number | null>(null)
</script>

<style lang="scss" scoped>
.layout-welcome-main {
  min-height: 100vh;
  background-color: var(--el-bg-color);
}
</style>
