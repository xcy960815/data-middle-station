<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header></custom-header>
    </template>
    <template #cloumn>
      <Column></Column>
    </template>
    <template #filter>
      <Filter></Filter>
    </template>
    <template #order>
      <Order></Order>
    </template>
    <template #dimension>
      <Dimension></Dimension>
    </template>
    <template #group>
      <Gorup></Gorup>
    </template>
    <template #bar>
      <Bar></Bar>
    </template>
    <template #charts>
      <Charts></Charts>
    </template>
    <template #charts-type>
      <ChartsType></ChartsType>
    </template>
    <template #charts-config>
      <ChartsConfig></ChartsConfig>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import Column from './components/column/index.vue'
import Dimension from './components/dimension/index.vue'
import Filter from './components/filter/index.vue'
import Order from './components/order/index.vue'
import Gorup from './components/group/index.vue'
import Bar from './components/bar/index.vue'
import Charts from './components/charts/index.vue'
import ChartsType from './components/charts-type/index.vue'
import ChartsConfig from './components/charts-config/index.vue'
const layoutName = 'analyse'
</script>

<style scoped lang="less"></style>
