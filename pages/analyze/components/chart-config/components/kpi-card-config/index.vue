<template>
  <!-- KPI 指标卡配置 -->
  <el-form label-position="top" label-width="auto" :model="chartConfigStore.privateChartConfig?.kpiCard">
    <el-form-item label="显示对比指标">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.kpiCard.showComparison"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="显示迷你趋势线">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.kpiCard.showSparkline"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="对比类型">
      <el-select v-model="chartConfigStore.privateChartConfig!.kpiCard.comparisonType" placeholder="对比类型">
        <el-option label="环比（前一条）" value="chain" />
        <el-option label="同比（去年同期）" value="yoy" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartConfigStore = useChartConfigStore()
</script>

<style lang="scss" scoped></style>
