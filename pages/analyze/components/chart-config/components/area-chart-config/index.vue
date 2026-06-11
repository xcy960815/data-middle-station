<template>
  <!-- 面积图配置 -->
  <el-form label-position="top" label-width="auto" :model="chartConfigStore.privateChartConfig?.area">
    <el-form-item label="是否画圆点">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.area.showPoint"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.area.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="是否平滑展示">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.area.smooth"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="填充透明度">
      <el-slider
        v-model="chartConfigStore.privateChartConfig!.area.opacity"
        :min="0.05"
        :max="1"
        :step="0.05"
        show-input
        :input-size="'small'"
      />
    </el-form-item>
    <el-form-item label="横向拖动条">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.area.horizontalBar"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartConfigStore = useChartConfigStore()
</script>

<style lang="scss" scoped></style>
