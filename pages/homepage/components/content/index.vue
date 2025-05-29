<template>
  <div class="homepage-container relative" ref="container">
    <ChartCard
      ref="cards"
      class="card"
      v-for="chart in chartsList"
      :create-time="chart.createTime"
      :chart-name="chart.chartName"
      :id="chart.id"
      :key="chart.id"
      :visits="chart.visits"
    >
    </ChartCard>
  </div>
</template>

<script lang="ts" setup>
import ChartCard from './components/chart-card/index.vue'
const HomePageStore = useHomepageStore()
const chartsList = computed(() => HomePageStore.getCharts)
const container = ref<HTMLDivElement>()
/**
 * @description 获取所有的图表
 */
const getCharts = async () => {
  const res = await $fetch('/api/homepage/getCharts', {
    method: 'POST'
  })
  if (res.code === 200) {
    HomePageStore.setCharts(res.data || [])
    nextTick(() => {
      // 添加window 日历效果
      const cards =
        container.value!.querySelectorAll<HTMLDivElement>(
          '.card'
        )

      container.value!.onmousemove = (e) => {
        for (const card of cards) {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2
          card.style.setProperty('--x', `${x}px`)
          card.style.setProperty('--y', `${y}px`)
        }
      }
    })
  }
}
onMounted(() => {
  getCharts()
})

onUnmounted(() => {
  // container.value.onmousemove = null
  // console.log("container.value",container.value);
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/theme-util.scss' as theme;

.homepage-container {
  @include theme.useTheme {
    background-color: theme.getVar('bgColor');
  }

  display: flex;
  flex-wrap: wrap;

  .card {
    margin: 1rem;
  }
}
</style>
