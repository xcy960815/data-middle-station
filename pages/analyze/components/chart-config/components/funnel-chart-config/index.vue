<template>
  <!-- 漏斗图配置 -->
  <el-form label-position="top" label-width="auto" :model="chartConfigStore.privateChartConfig?.funnel">
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.funnel.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="显示百分比">
      <el-switch
        v-model="chartConfigStore.privateChartConfig!.funnel.showPercentage"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="排列方式">
      <el-select v-model="chartConfigStore.privateChartConfig!.funnel.sort" placeholder="排列方式">
        <el-option label="降序（从大到小）" value="descending" />
        <el-option label="升序（从小到大）" value="ascending" />
        <el-option label="不排序" value="none" />
      </el-select>
    </el-form-item>
    <el-form-item label="漏斗对齐">
      <el-select v-model="chartConfigStore.privateChartConfig!.funnel.funnelAlign" placeholder="漏斗对齐">
        <el-option label="居中" value="center" />
        <el-option label="左对齐" value="left" />
        <el-option label="右对齐" value="right" />
      </el-select>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartConfigStore = useChartConfigStore()
</script>

<style lang="scss" scoped></style>
