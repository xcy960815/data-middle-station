<template>
  <div class="chart-name">
    <h4
      @click="handleUpdateChartName"
      @contextmenu="handleUpdateChartDesc"
    >
      {{ chartName }}
    </h4>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox, ElMessage } from 'element-plus'
const chartStore = useChartStore()
const chartId = computed(() => {
  return chartStore.getChartId
})
const chartName = computed(() => {
  return chartStore.getChartName
})
/**
 * 更新图表名称
 * @param {string} value 图表名称
 */
const handleUpdateChartName = () => {
  ElMessageBox.prompt('请输入图表名称', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[a-zA-Z0-9]+$/,
    inputErrorMessage: '无效的图表名称'
  })
    .then(({ value }) => {
      updateChartName(value)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}
/**
 * 更新图表名称
 * @param {string} value 图表名称
 */
const updateChartName = async (value: string) => {
  const result = await $fetch('/api/updateChartName', {
    method: 'POST',
    body: {
      id: chartId.value,
      chartName: value
    }
  })
  if (result.code === 200) {
    ElMessage({
      type: 'success',
      message: '更新成功'
    })
  }
}
/**
 * 更新图表描述
 * @param {string} value 图表描述
 */
const handleUpdateChartDesc = () => {
  ElMessageBox.prompt('请输入图表描述', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  })
    .then(({ value }) => {
      updateChartDesc(value)
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
    })
}
/**
 * 更新图表描述
 * @param {string} value 图表描述
 */
const updateChartDesc = async (value: string) => {
  const result = await $fetch('/api/updateChartDesc', {
    method: 'POST',
    body: {
      id: chartId.value,
      chartDesc: value
    }
  })
  if (result.code === 200) {
    ElMessage({
      type: 'success',
      message: '更新成功'
    })
  }
}
</script>

<style lang="scss" scoped>
.chart-name {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}
</style>
