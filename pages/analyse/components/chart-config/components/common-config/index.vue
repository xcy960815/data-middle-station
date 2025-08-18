<template>
  <el-form label-position="top" label-width="auto" :model="commonChartConfig" class="config-form">
    <el-form-item label="备注">
      <el-input type="textarea" v-model="commonChartConfig.analyseDesc" :rows="3" placeholder="请输入图表备注信息" />
    </el-form-item>

    <el-form-item label="数据量上限">
      <el-input-number
        @change="handleUpdateCommonConfig"
        v-model="commonChartConfig.limit"
        :min="1"
        :max="10000"
        :step="100"
        class="w-full"
      />
    </el-form-item>

    <el-form-item label="智能作图建议">
      <el-switch
        v-model="commonChartConfig.suggest"
        class="ml-2"
        active-text="开启"
        inactive-text="关闭"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>

    <el-form-item label="缓存策略">
      <el-select v-model="commonChartConfig.mixStrategy" placeholder="请选择缓存策略" class="w-full">
        <el-option label="实时" value="real" />
        <el-option label="每日更新" value="daily" />
      </el-select>
    </el-form-item>

    <el-form-item label="分享">
      <el-input type="textarea" v-model="commonChartConfig.shareStrategy" :rows="3" placeholder="请输入分享策略" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
const chartsConfigStore = useChartConfigStore()
/**
 * @desc 图表公共配置
 */
const commonChartConfig = reactive<ChartConfigStore.CommonChartConfig>({
  ...chartsConfigStore.commonChartConfig
})

/**
 * @desc 更新图表公共配置
 */
const handleUpdateCommonConfig = (): void => {
  chartsConfigStore.setCommonChartConfig(commonChartConfig)
}

onMounted(() => {
  console.log('onMounted')
})
</script>
