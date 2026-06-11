<template>
  <!-- 散点图配置 -->
  <el-form label-position="top" label-width="auto" :model="chartConfigStore.privateChartConfig?.scatter">
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.scatter.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="散点大小">
      <el-slider
        v-model="chartConfigStore.privateChartConfig!.scatter.symbolSize"
        :min="4"
        :max="40"
        :step="1"
        show-input
        :input-size="'small'"
      />
    </el-form-item>
    <el-form-item label="显示趋势线">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.scatter.showTrendLine"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartConfigStore = useChartConfigStore()
</script>

<style lang="scss" scoped></style>
