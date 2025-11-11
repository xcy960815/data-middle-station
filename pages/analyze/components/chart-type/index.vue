<template>
  <div class="chart-type-container h-full overflow-y-auto">
    <ul class="chart-type">
      <li
        v-for="(i, index) in chartsType"
        :key="i.name"
        class="chart-type-item"
        :class="{ active: i.name === chartType }"
        @click="handleChangeChartType(i.name, index)"
      >
        <div class="chart-type-content">
          <img :src="i.image" :alt="i.name" class="chart-image" />
          <span class="chart-name">{{ getAnalyzeName(i.name) }}</span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
const analyzeStore = useAnalyzeStore()
const chartType = computed(() => {
  const chartType = analyzeStore.getChartType as AnalyzeStore.ChartType
  return chartType
})
const chartsType = ref<Array<{ name: AnalyzeStore.ChartType; image: string }>>([
  {
    name: 'table',
    image: '//si.geilicdn.com/hz_img_044b00000160691e3f220a02685e_300_200.jpeg'
  },
  {
    name: 'interval',
    image: '//si.geilicdn.com/hz_img_0a6900000160690fba580a026860_150_100_unadjust.png'
  },
  {
    name: 'line',
    image: '//si.geilicdn.com/hz_img_12da00000160690fba720a02685e_150_100_unadjust.png'
  },
  {
    name: 'pie',
    image: '//si.geilicdn.com/hz_img_12d900000160690fba6d0a02685e_300_200.jpeg'
  }
])

/**
 * @desc 切换图表类型
 * @param {AnalyzeStore.ChartType} chartType - 图表类型
 * @param {number} index - 图表类型索引
 * @returns {void}
 */
const handleChangeChartType = (chartType: AnalyzeStore.ChartType, index: number): void => {
  const chartTypeItems = document.querySelectorAll('.chart-type-item')
  chartTypeItems.forEach((item) => {
    item.classList.remove('active')
  })
  chartTypeItems[index].classList.add('active')
  analyzeStore.setChartType(chartType)
}
const nameMap = {
  table: '表格',
  interval: '柱状图',
  line: '折线图',
  pie: '饼图'
}
/**
 * @desc 获取图表名称
 * @param {AnalyzeStore.ChartType} type - 图表类型
 * @returns {string} 图表名称
 */
const getAnalyzeName = (type: AnalyzeStore.ChartType): string => {
  return nameMap[type]
}
</script>

<style lang="scss" scoped>
.chart-type-container {
  padding: 12px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-type {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  padding: 0;
  margin: 0;
}

.chart-type-item {
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.active {
    border-color: #1890ff;
    background-color: rgba(24, 144, 255, 0.1);
  }
}

.chart-type-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}

.chart-image {
  width: 100%;
  height: auto;
  border-radius: 4px;
  object-fit: cover;
}

.chart-name {
  margin-top: 8px;
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.active .chart-name {
  color: #1890ff;
}
</style>
