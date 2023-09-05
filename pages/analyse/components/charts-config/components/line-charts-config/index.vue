<template>
  <!-- 折线图配置 -->
  <el-form
    label-position="top"
    label-width="auto"
    class="line-charts-config relative h-full w-full"
    :model="lineChartsConfigData"
  >
    <el-form-item label="是否画圆点">
      <el-switch
        v-model="lineChartsConfigData.showPoint"
        style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        "
      />
    </el-form-item>
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="lineChartsConfigData.showLabel"
        style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        "
      />
    </el-form-item>
    <el-form-item label="是否平滑展示">
      <el-switch
        v-model="lineChartsConfigData.smooth"
        style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        "
      />
    </el-form-item>
    <el-form-item label="自动双轴">
      <el-switch
        v-model="lineChartsConfigData.autoDualAxis"
        style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        "
      />
    </el-form-item>
    <el-form-item label="横向拖动条">
      <el-switch
        v-model="lineChartsConfigData.horizontalBar"
        style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        "
      />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartsConfigStore = useChartConfigStore()
const lineChartsConfigData = computed(() => {
  return chartsConfigStore.chartConfigData.line
})
</script>

<style lang="less" scoped></style>
