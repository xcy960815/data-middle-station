<template>
  <el-form label-position="top" label-width="auto" :model="pieChartConfigData">
    <el-form-item label="显示说明文字">
      <el-switch
        @change="handleShowLabelChange"
        v-model="pieChartConfigData.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="图表类型">
      <el-select @change="handleChartTypeChange" v-model="pieChartConfigData.chartType" placeholder="展现方式">
        <el-option label="圆环图" value="pie" />
        <el-option label="玫瑰图" value="rose" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { defaultAnalyzePieChartConfig } from '~/shared/analyzeChartConfigDefaults'

const chartsConfigStore = useChartConfigStore()

const pieChartConfigData = computed<ChartConfigStore.PieChartConfig>(() => {
  return chartsConfigStore.privateChartConfig?.pie ?? defaultAnalyzePieChartConfig
})

const updatePieChartConfig = (pieConfig: ChartConfigStore.PieChartConfig) => {
  const privateChartConfig = chartsConfigStore.privateChartConfig
  chartsConfigStore.setPrivateChartConfig({
    ...privateChartConfig,
    pie: pieConfig
  })
}

const handleShowLabelChange = (showLabel: boolean | string | number) => {
  updatePieChartConfig({
    ...pieChartConfigData.value,
    showLabel: Boolean(showLabel)
  })
}

const handleChartTypeChange = (chartType: ChartConfigStore.PieChartConfig['chartType']) => {
  updatePieChartConfig({
    ...pieChartConfigData.value,
    chartType
  })
}
</script>

<style lang="scss" scoped></style>
