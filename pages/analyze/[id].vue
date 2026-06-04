<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #title>
          <HeaderTitle
            :title="analyzeName"
            :desc="analyzeDesc"
            title-prompt-title="编辑分析名称"
            title-prompt-message="请输入分析名称"
            desc-prompt-title="编辑分析描述"
            desc-prompt-message="请输入图表描述"
            title-fallback="未命名分析"
            desc-fallback=""
            title-required-message="分析名称不能为空"
            @update:title="updateAnalyzeName"
            @update:desc="updateAnalyzeDesc"
          />
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
    <template #dimension>
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
import ChartType from './components/chart-type/index.vue'
import Chart from './components/chart/index.vue'
import Column from './components/column/index.vue'
import MeasureOption from './components/measure/index.vue'
import Filter from './components/filter/index.vue'
import DimensionOption from './components/dimension/index.vue'
import Order from './components/order/index.vue'
import HeaderTitle from '@/components/header-title/index.vue'
import { useAnalyzeHandler } from './useAnalyzeHandler'

const layoutName = 'analyze'
const { getAnalyze } = useAnalyzeHandler()
const analyzeStore = useAnalyzeStore()

const analyzeName = computed(() => analyzeStore.getAnalyzeName)
const analyzeDesc = computed(() => analyzeStore.getAnalyzeDesc)

const updateAnalyzeName = (value: string) => {
  analyzeStore.setAnalyzeName(value)
}

const updateAnalyzeDesc = (value: string) => {
  analyzeStore.setAnalyzeDesc(value)
}

onMounted(async () => {
  await getAnalyze()
})
</script>

<style scoped lang="scss"></style>
