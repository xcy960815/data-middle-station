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
    <template #measure>
      <MeasureOption></MeasureOption>
    </template>
    <template #group>
      <DimensionOption></DimensionOption>
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
import Bar from './components/bar/index.vue'
import ChartConfig from './components/chart-config/index.vue'
import AnalyzeName from './components/chart-name/index.vue'
import ChartType from './components/chart-type/index.vue'
import Chart from './components/chart/index.vue'
import Column from './components/column/index.vue'
import MeasureOption from './components/measure/index.vue'
import Filter from './components/filter/index.vue'
import DimensionOption from './components/dimension/index.vue'
import Order from './components/order/index.vue'
import { useAnalyzeHandler } from './useAnalyzeHandler'

const layoutName = 'analyze'
const { getAnalyze } = useAnalyzeHandler()
onMounted(async () => {
  await getAnalyze()
})
</script>

<style scoped lang="scss"></style>
