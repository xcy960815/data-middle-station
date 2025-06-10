<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #header-right>
          <icon-park
            type="newlybuild"
            size="30"
            fill="#333"
            class="cursor-pointer"
            @click="handleCreateAnalyse"
          ></icon-park>
        </template>
      </custom-header>
    </template>
    <template #content>
      <div class="homepage-container relative" ref="container">
        <chart-card
          ref="cards"
          class="card-chart"
          v-for="chart in analyseList"
          :create-time="chart.createTime"
          :update-time="chart.updateTime"
          :created-by="chart.createdBy"
          :updated-by="chart.updatedBy"
          :analyse-name="chart.analyseName"
          :id="chart.id"
          :key="chart.id"
          :view-count="chart.viewCount"
          @delete="handleDeleteAnalyse"
        >
        </chart-card>
      </div>
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessageBox, ElMessage } from 'element-plus'
const layoutName = 'homepage'
import ChartCard from './components/chart-card.vue'
const HomePageStore = useHomepageStore()

/**
 * @desc 分析列表
 */
const analyseList = computed(() => {
  return HomePageStore.getAnalyses
})
const container = ref<HTMLDivElement>()
/**
 * @description 获取所有的分析
 */
const getAnalyses = async () => {
  const res = await $fetch('/api/getAnalyses', {
    method: 'POST',
  })
  if (res.code === 200) {
    HomePageStore.setAnalyses(res.data || [])
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

/**
 * @desc 删除分析
 */
const handleDeleteAnalyse = (id: number, analyseName: string) => {
  console.log('删除分析', id, analyseName)
  ElMessageBox.confirm(`确定删除【${analyseName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
  }).then(async () => {
    const res = await $fetch('/api/deleteAnalyse', {
      method: 'DELETE',
      body: {
        id,
      },
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getAnalyses()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

/**
 * @desc 创建分析
 */
const handleCreateAnalyse = () => {
  console.log('创建分析')
}

onMounted(() => {
  getAnalyses()
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
