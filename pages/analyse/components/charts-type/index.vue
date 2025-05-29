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
const chartStore = useChartStore()
const chartType = computed(() => {
  const chartType =
    chartStore.getChartType as ChartStore.ChartState['chartType']
  return chartType
})
const chartsType = ref<
  Array<{ name: ChartStore.ChartType; image: string }>
>([
  {
    name: 'table',
    image:
      '//si.geilicdn.com/hz_img_044b00000160691e3f220a02685e_300_200.jpeg'
  },
  {
    name: 'interval',
    image:
      '//si.geilicdn.com/hz_img_0a6900000160690fba580a026860_150_100_unadjust.png'
  },
  {
    name: 'line',
    image:
      '//si.geilicdn.com/hz_img_12da00000160690fba720a02685e_150_100_unadjust.png'
  },
  {
    name: 'pie',
    image:
      '//si.geilicdn.com/hz_img_12d900000160690fba6d0a02685e_300_200.jpeg'
  }
])

/**
 * @desc 切换图表类型
 * @param {string} chartType - 图表类型
 * @param {number} index - 图表类型索引
 * @returns {void}
 */

const changeChartType = (
  chartType: ChartStore.ChartType,
  index: number
): void => {
  const chartTypeItems = document.querySelectorAll(
    '.chart-type-item'
  )
  chartTypeItems.forEach((item) => {
    item.classList.remove('active')
  })
  chartTypeItems[index].classList.add('active')
  chartStore.setChartType(chartType)
}
</script>

<style lang="scss" scoped>
.charts-type {
  .active {
    border: 2px solid #f60;
  }
}
</style>
