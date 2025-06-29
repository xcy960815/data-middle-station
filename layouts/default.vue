<template>
  <div class="layout-default-main">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'DefaultLayout'
})
</script>

<style lang="scss" scoped>
.layout-default-main {
  min-height: 100vh;
  width: 100%;
}
</style>
