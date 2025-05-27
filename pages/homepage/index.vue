<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header></custom-header>
    </template>
    <template #content>
      <Content></Content>
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import Content from './components/content/index.vue'
const layoutName = 'homepage'
</script>

<style scoped lang="scss"></style>
