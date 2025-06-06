<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header></custom-header>
    </template>
    <template #content>
      <div class="homepage-container relative" ref="container">
        <chart-card
          ref="cards"
          class="card-chart"
          v-for="chart in chartsList"
          :create-time="chart.createTime"
          :update-time="chart.updateTime"
          :created-by="chart.createdBy"
          :updated-by="chart.updatedBy"
          :analyse-name="chart.analyseName"
          :id="chart.id"
          :key="chart.id"
          :view-count="chart.viewCount"
        >
        </chart-card>
      </div>
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
const layoutName = 'homepage'
import ChartCard from './components/chart-card.vue'
const HomePageStore = useHomepageStore()
const chartsList = computed(() => {
  return HomePageStore.getCharts
})
const container = ref<HTMLDivElement>()
/**
 * @description 获取所有的图表
 */
const getCharts = async () => {
  const res = await $fetch('/api/getAnalyses', {
    method: 'POST',
  })
  if (res.code === 200) {
    HomePageStore.setCharts(res.data || [])
    nextTick(() => {
      // 添加window 日历效果
      const cards = container.value!.querySelectorAll<HTMLDivElement>('.card-chart')

      container.value!.onmousemove = e => {
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

onUnmounted(() => {})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/theme-util.scss' as theme;

.homepage-container {
  @include theme.useTheme {
    background-color: theme.getVar('bgColor');
  }
  display: flex;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  justify-content: flex-start;
  align-items: flex-start;
}

.card-chart {
  margin: 1rem;
}
</style>
