<template>
  <div
    class="charts relative h-full w-full overflow-hidden"
  >
    <template v-if="chartErrorMessage">
      <div
        class="absolute inset-0 flex justify-center items-center"
      >
        <div class="text-red-500 text-[14px]">
          {{ chartErrorMessage }}
        </div>
      </div>
    </template>
    <template v-else>
      <component
        :is="chartType"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        :data="data"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
        @renderChartStart="handleRenderChartStart"
        @renderChartEnd="handleRenderChartEnd"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data'
import { handler } from './handler'

const {
  chartWidth,
  chartHeight,
  chartResizeObserver,
  chartLoading,
  chartErrorMessage,
  xAxisFields,
  yAxisFields,
  data,
  chartType
} = initData()
const { handleRenderChartStart, handleRenderChartEnd } =
  handler({
    chartWidth,
    chartHeight,
    chartResizeObserver
  })
onMounted(() => {
  // renderChart()
})
</script>

<style lang="scss" scoped></style>
