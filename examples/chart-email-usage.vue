<!--
  图表邮件发送功能使用示例
  这个文件展示了如何在分析页面中使用图表邮件发送功能
-->
<template>
  <div class="chart-email-example">
    <!-- 图表组件 -->
    <div class="chart-container">
      <component
        ref="chartRef"
        :is="currentChartComponent"
        :data="chartData"
        :title="chartTitle"
        :xAxisFields="xAxisFields"
        :yAxisFields="yAxisFields"
        @renderChartEnd="onChartRendered"
      />
    </div>

    <!-- 操作栏 -->
    <AnalyseBar :chart-ref="chartRef" @requestChartRef="handleRequestChartRef" />
  </div>
</template>

<script setup lang="ts">
import PieChart from '~/components/pie-chart/index.vue'
import AnalyseBar from '~/pages/analyse/components/bar/index.vue'

// 图表相关状态
const chartRef = ref()
const chartData = ref([])
const chartTitle = ref('示例图表')
const xAxisFields = ref([])
const yAxisFields = ref([])
const currentChartComponent = ref(PieChart)

// 图表渲染完成回调
const onChartRendered = () => {
  console.log('图表渲染完成')
}

// 处理图表引用请求
const handleRequestChartRef = () => {
  // 确保图表引用已经准备好
  if (chartRef.value) {
    console.log('图表引用已准备好，可以发送邮件')
  }
}

// 使用图表邮件功能的示例方法
const { sendEmailFromChartRef, downloadCharts } = useChartEmail()

// 手动发送邮件的示例
const manualSendEmailDto = async () => {
  try {
    const result = await sendEmailFromChartRef(
      chartRef.value, // 图表引用
      '我的数据分析报告', // 图表标题
      {
        to: ['user@example.com'],
        subject: '数据分析报告',
        additionalContent: '这是一份重要的数据分析报告，请查收。'
      },
      'analysis_report' // 文件名（可选）
    )

    console.log('邮件发送成功:', result)
  } catch (error) {
    console.error('邮件发送失败:', error)
  }
}

// 批量下载图表的示例
const downloadAllCharts = async () => {
  try {
    await downloadCharts([chartRef.value], ['analysis_report'])
    console.log('图表下载完成')
  } catch (error) {
    console.error('图表下载失败:', error)
  }
}
</script>

<style scoped>
.chart-email-example {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chart-container {
  flex: 1;
  padding: 20px;
}
</style>
