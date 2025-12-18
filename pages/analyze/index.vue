<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #chart-name>
          <AnalyzeName></AnalyzeName>
        </template>
      </custom-header>
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
      <DimensionOption></DimensionOption>
    </template>
    <template #group>
      <GroupOption></GroupOption>
    </template>
    <template #bar>
      <Bar />
    </template>
    <template #chart>
      <Chart />
    </template>
    <template #chart-type>
      <ChartType></ChartType>
    </template>
    <template #chart-config>
      <ChartConfig></ChartConfig>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { onActivated, onMounted } from 'vue'
import Bar from './components/bar/index.vue'
import ChartConfig from './components/chart-config/index.vue'
import AnalyzeName from './components/chart-name/index.vue'
import ChartType from './components/chart-type/index.vue'
import Chart from './components/chart/index.vue'
import Column from './components/column/index.vue'
import DimensionOption from './components/dimension/index.vue'
import Filter from './components/filter/index.vue'
import GroupOption from './components/group/index.vue'
import Order from './components/order/index.vue'
import { getAnalyzeHandler } from './getAnalyze'
import { getAnalyzeDataHandler } from './getAnalyzeData'
onMounted(() => {
  getAnalyzeHandler()
  getAnalyzeDataHandler()
})
onActivated(() => {
  getAnalyzeHandler()
  getAnalyzeDataHandler()
})
const layoutName = 'analyze'
</script>

<style scoped lang="scss"></style>
