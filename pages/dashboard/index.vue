<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header></custom-header>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
const layoutName = 'dashboard'
</script>

<style scoped lang="less"></style>
