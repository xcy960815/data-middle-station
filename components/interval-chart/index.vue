<template>
  <!-- 柱状图 -->
  <div id="container-interval" class="h-full w-full"></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'
import DataSet from '@antv/data-set';

const props = defineProps({
  data: {
    type: Array as PropType<
      Array<Chart.ChartData>
    >,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<
      Array<Chart.XAxisFields>
    >,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<
      Array<Chart.YAxisFields>
    >,
    default: () => []
  }
})
const initChart = () => {
  const dv = new DataSet.View().source(props.data)
  dv.transform({
    type: 'fold',
    fields: props.yAxisFields.map(
      (item) => item.alias || item.name
    ),
    key: 'key',
    value: 'value'
  })

  // 初始化图表实例
  const chart = new Chart({
    container: 'container-interval',
    theme: 'classic',
    autoFit: true
  })

  // 声明可视化
  chart
    .interval() // 创建一个 Interval 标记
    .data(dv.rows) // 绑定数据
    .encode('x', 'key') // 编码 x 通道
    .encode('y', 'value') // 编码 y 通道

  // 渲染可视化
  chart.render()
}

onMounted(() => {
  initChart() 
})
</script>
<style lang="less" scoped></style>
