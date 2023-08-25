<template>
  <!-- 折线图 -->
  <div id="container-line"></div>
</template>
<script setup lang="ts">
import { Chart } from '@antv/g2'
const initChart = () => {
  const data = [
    {
      division: 'Bethesda-Rockville-Frederick, MD Met Div',
      date: '2000-01-01T00:00:00.000Z',
      unemployment: 2.6
    },
    {
      division: 'Bethesda-Rockville-Frederick, MD Met Div',
      date: '2000-02-01T00:00:00.000Z',
      unemployment: 2.6
    },
    {
      division: 'Bethesda-Rockville-Frederick, MD Met Div',
      date: '2000-03-01T00:00:00.000Z',
      unemployment: 2.6
    }
  ]
  const chart = new Chart({
    container: 'container-line',
    theme: 'classic'
  })

  chart
    .line()
    .data(data)
    .encode('x', 'date')
    .encode('y', 'unemployment')
    .encode('series', 'division')
    .encode('color', 'steelblue')
  // @ts-ignore
  chart.interaction('tooltip', { filter: (d, i) => i < 10 })
  chart.render()
}
onMounted(() => {
  initChart()
})
</script>
<style lang="less"></style>
