<template>
  <div
    class="charts relative h-full w-full"
    v-loading="chartLoading"
  >
    <!-- 图表的错误信息 -->
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
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data'
import { handler } from './handler'
const {
  chartLoading,
  chartErrorMessage,
  xAxisFields,
  yAxisFields,
  data,
  chartType
} = initData()
handler()
</script>

<style lang="less" scoped></style>
