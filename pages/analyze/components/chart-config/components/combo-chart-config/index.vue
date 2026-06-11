<template>
  <!-- 双轴组合图配置 -->
  <el-form label-position="top" label-width="auto" :model="chartConfigStore.privateChartConfig?.combo">
    <el-form-item label="是否画圆点">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.combo.showPoint"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.combo.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="折线是否平滑">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.combo.smooth"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="横向拖动条">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.combo.horizontalBar"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartConfigStore = useChartConfigStore()
</script>

<style lang="scss" scoped></style>
