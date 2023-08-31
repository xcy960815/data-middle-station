<template>
  <!-- 环形图 -->
  <div id="container-pie" class="h-full w-full"></div>
</template>

<script lang="ts" setup>
import { Chart } from '@antv/g2'

import DataSet from '@antv/data-set'
const props = defineProps({
  data: {
    type: Array as PropType<
      Array<Chart.TableDataItem>
    >,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<
      Array<Chart.TableHeaderItem>
    >,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<
      Array<Chart.TableHeaderItem>
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
  const chart = new Chart({
    container: 'container-pie',
    theme: 'classic',
    autoFit: true
  })

  chart.coordinate({ type: 'theta', innerRadius: 0.6 })

  chart
    .interval()
    .transform({ type: 'stackY' })
    .data(dv.rows)
    .encode('y', 'value')
    .encode('color', 'key')
    .style('stroke', 'white')
    .style('inset', 1)
    .style('radius', 10)
    .scale('color', {
      palette: 'spectral',
      offset: (t) => t * 0.8 + 0.1
    })
    .label({
      text: 'name',
      style: { fontSize: 10, fontWeight: 'bold' }
    })
    .label({
      // @ts-ignore
      text: (d, i, data) =>
        i < data.length - 3 ? d.value : '',
      style: {
        fontSize: 9,
        dy: 12
      }
    })
    .animate('enter', { type: 'waveIn' })
    .legend(false)

  chart.render()
}
onMounted(() => {
  initChart()
})
</script>

<style scoped lang="scss"></style>
