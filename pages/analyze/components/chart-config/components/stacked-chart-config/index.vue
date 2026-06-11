<template>
  <!-- 堆叠图配置 -->
  <el-form label-position="top" label-width="auto" :model="chartConfigStore.privateChartConfig?.stacked">
    <el-form-item label="展示方式">
      <el-select v-model="chartConfigStore.privateChartConfig!.stacked.displayMode" placeholder="展示方式">
        <el-option label="堆叠柱状图" value="stackBar" />
        <el-option label="堆叠面积图" value="stackArea" />
      </el-select>
    </el-form-item>
    <el-form-item label="是否百分比显示">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.stacked.showPercentage"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.stacked.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="平滑曲线（堆叠面积图生效）">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.stacked.smooth"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="横向拖动条">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.stacked.horizontalBar"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartConfigStore = useChartConfigStore()
</script>

<style lang="scss" scoped></style>
