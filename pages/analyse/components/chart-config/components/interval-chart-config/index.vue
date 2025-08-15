<template>
  <el-form label-position="top" label-width="auto" :model="intervalChartConfigData">
    <el-form-item label="展现方式">
      <el-select v-model="intervalChartConfigData.displayMode" placeholder="展现方式">
        <el-option label="平级展示" value="levelDisplay" />
        <el-option label="叠加展示" value="stackDisplay" />
      </el-select>
    </el-form-item>
    <el-form-item label="是否百分比显示">
      <el-switch
        v-model="intervalChartConfigData.showPercentage"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="显示说明文字">
      <el-switch
        v-model="intervalChartConfigData.showLabel"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="水平展示">
      <el-switch
        v-model="intervalChartConfigData.horizontalDisplay"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="横向拖动条">
      <el-switch
        v-model="intervalChartConfigData.horizontalBar"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
const chartsConfigStore = useChartConfigStore()

const intervalChartConfigData = computed(() => {
  return (
    chartsConfigStore.chartConfig?.interval || {
      displayMode: 'levelDisplay',
      showPercentage: false,
      showLabel: false,
      horizontalDisplay: false,
      horizontalBar: false
    }
  )
})
</script>

<style scoped lang="scss"></style>
