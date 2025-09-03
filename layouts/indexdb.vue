<template>
  <div class="layout-indexdb-main h-full w-full !flex !flex-col flex-1 border-box">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'IndexdbLayout'
})
</script>

<style lang="scss" scoped>
.layout-indexdb-main {
  min-height: 100vh;
  background-color: var(--el-bg-color);
}
</style>
