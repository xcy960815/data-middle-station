<template>
  <div class="canvas-table-chart h-full">
    <client-only>
      <CanvasTable
        :data="data"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        :chart-width="chartWidth"
        :chart-height="chartHeight"
      />
    </client-only>
  </div>
</template>

<script lang="ts" setup>
import CanvasTable from './canvas-table.vue'
const props = defineProps({
  data: {
    type: Array as PropType<ChartDataDao.ChartData>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<GroupStore.GroupOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  chartHeight: {
    type: Number,
    default: () => 0
  },
  chartWidth: {
    type: Number,
    default: () => 0
  },
  // 图表配置
  chartConfig: {
    type: Object as PropType<{
      conditions?: Array<{
        conditionType: string
        conditionField: string
        conditionSymbol: string
        conditionValue: number
        conditionColor: string
      }>
    }>,
    default: () => ({})
  }
})
</script>

<style scoped lang="scss">
.canvas-table-chart {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
