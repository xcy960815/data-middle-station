<template>
  <el-form
    label-position="top"
    label-width="auto"
    :model="tableChartConfigData"
  >
    <el-form-item label="展现方式">
      <el-select
        v-model="tableChartConfigData.displayMode"
        placeholder="展示方式"
      >
        <el-option label="原始展示" value="originalDisplay" />
        <el-option label="聚合展示" value="aggregationDisplay" />
      </el-select>
     
    </el-form-item>
    <el-form-item label="是否展示同比环比">
      <el-switch
        v-model="tableChartConfigData.showCompare"
        style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        "
      />
    </el-form-item>
    <el-form-item label="条件格式">
      <!-- intervalChartConfigData.conditions -->
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
const chartsConfigStore = useChartConfigStore()
const tableChartConfigData = computed(() => {
  return chartsConfigStore.chartConfig.table
})
</script>

<style scoped lang="scss"></style>
