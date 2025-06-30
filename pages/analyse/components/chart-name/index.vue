<template>
  <div class="chart-info">
    <h4
      class="chart-name cursor-pointer"
      @click="handleUpdateAnalyseName"
    >
      {{ analyseName }}
      <span class="edit-icon"
        ><i class="icon-park-outline-edit"></i
      ></span>
    </h4>
    <p
      class="chart-desc cursor-pointer"
      @click="handleUpdateChartDesc"
    >
      {{ analyseDesc || '' }}
      <span class="edit-icon"
        ><i class="icon-park-outline-edit"></i
      ></span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ElMessageBox, ElMessage } from 'element-plus'
const chartStore = useAnalyseStore()
const chartId = computed(() => {
  return chartStore.getChartId
})
const analyseName = computed(() => {
  return chartStore.getAnalyseName
})
const analyseDesc = computed(() => {
  return chartStore.getAnalyseDesc
})

const props = defineProps({
  analyseName: {
    type: String,
    default: ''
  }
})

/**
 * 更新图表名称
 * @param {string} value 图表名称
 */
const handleUpdateAnalyseName = () => {
  ElMessageBox.prompt('请输入分析名称', '编辑分析名称', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{1,30}$/,
    inputErrorMessage:
      '分析名称仅支持中英文、数字、下划线，且不能为空',
    inputValue: analyseName.value || '未命名分析',
    autofocus: true
  }).then(({ value }) => {
    if (!value.trim()) {
      ElMessage.error('分析名称不能为空')
      return
    }
    updateAnalyseName(value.trim())
  })
}
/**
 * 更新图表名称
 * @param {string} value 图表名称
 */
const updateAnalyseName = async (value: string) => {
  const result = await $fetch('/api/updateAnalyseName', {
    method: 'POST',
    body: {
      id: chartId.value,
      analyseName: value
    }
  })
  if (result.code === 200) {
    ElMessage({
      type: 'success',
      message: '更新成功'
    })
    chartStore.setAnalyseName(value)
  }
}
/**
 * 更新图表描述
 * @param {string} value 图表描述
 */
const handleUpdateChartDesc = () => {
  ElMessageBox.prompt('请输入图表描述', '编辑分析描述', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{0,100}$/,
    inputErrorMessage: '描述仅支持中英文、数字、下划线',
    inputValue: analyseDesc.value || '未填写描述',
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
  const result = await $fetch('/api/updateAnalyseDesc', {
    method: 'POST',
    body: {
      id: chartId.value,
      analyseDesc: value
    }
  })
  if (result.code === 200) {
    ElMessage({
      type: 'success',
      message: '更新成功'
    })
    chartStore.setAnalyseDesc(value)
  }
}
</script>

<style lang="scss" scoped>
.chart-info {
  display: flex;
  flex-direction: column;
  padding: 4px 0;
}

.chart-name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover .edit-icon {
    opacity: 1;
  }
}

.chart-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  gap: 8px;

  &:hover .edit-icon {
    opacity: 1;
  }
}

.edit-icon {
  opacity: 0;
  transition: opacity 0.2s;
  color: #909399;
  font-size: 14px;

  &:hover {
    color: #409eff;
  }
}
</style>
