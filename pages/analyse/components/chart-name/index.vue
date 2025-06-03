<template>
  <h4
    :title="chartDesc"
    class="chart-name cursor-pointer"
    @click="handleUpdateChartName"
    @contextmenu="handleUpdateChartDesc"
  >
    {{ chartName }}
  </h4>
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
const chartDesc = computed(() => {
  return chartStore.getChartDesc
})

const props = defineProps({
  chartName: {
    type: String,
    default: ''
  }
})

/**
 * 更新图表名称
 * @param {string} value 图表名称
 */
const handleUpdateChartName = () => {
  ElMessageBox.prompt('请输入分析名称', '编辑分析名称', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{1,30}$/,
    inputErrorMessage:
      '分析名称仅支持中英文、数字、下划线，且不能为空',
    inputValue: chartName.value || '未命名分析',
    autofocus: true
  }).then(({ value }) => {
    if (!value.trim()) {
      ElMessage.error('分析名称不能为空')
      return
    }
    updateChartName(value.trim())
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
    chartStore.setChartName(value)
  }
}
/**
 * 更新图表描述
 * @param {string} value 图表描述
 */
const handleUpdateChartDesc = (event: MouseEvent) => {
  // 阻止右键菜单
  event.preventDefault()
  ElMessageBox.prompt('请输入图表描述', '编辑分析描述', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{0,100}$/,
    inputErrorMessage: '描述仅支持中英文、数字、下划线',
    inputValue: chartDesc.value || '未填写描述',
    autofocus: true
  }).then(({ value }) => {
    if (!value.trim()) {
      ElMessage.error('描述不能为空')
      return
    }
    updateChartDesc(value.trim())
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
    chartStore.setChartDesc(value)
  }
}
</script>

<style lang="scss" scoped></style>
