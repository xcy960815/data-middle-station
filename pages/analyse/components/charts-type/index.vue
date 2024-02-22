<template>
  <ul class="charts-type pl-[10px] w-[120px] relative">
    <li
      class="chart-type-item w-[120px] p-[5px] mb-[5px] cursor-pointer"
      v-for="(i, index) in chartsType"
      :class="{ active: i.name === chartType }"
      @click="changeChartType(i.name, index)"
    >
      <img :src="i.image" />
    </li>
  </ul>
</template>

<script setup lang="ts">
import { initData } from './init-data';
import { handler } from './handler';
const { chartType, chartsType } = initData();
const { changeChartType } = handler();
</script>

<style lang="scss" scoped>
.charts-type {
  .active {
    border: 2px solid #f60;
  }
}
</style>
