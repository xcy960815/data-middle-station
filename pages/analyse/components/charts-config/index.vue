<template>
  <!-- 图表📈配置项 -->
  <ClientOnly>
    <el-drawer
      modal-class="charts-config-drawer"
      v-model="chartsConfigDrawer"
      :with-header="false"
      direction="rtl"
    >
    </el-drawer>
  </ClientOnly>
</template>

<script setup lang="ts">
import { initData } from './init-data'
const {} = initData()
const chartsConfigStore = useChartsConfigStore()

const chartsConfigDrawer = computed({
  get: () => {
    return chartsConfigStore.chartsConfigDrawer
  },
  set: (value) =>
    chartsConfigStore.setChartsConfigDrawer(value)
})
</script>

<style lang="less" scoped>
:deep(.charts-config-drawer) {
  background-color: red;
  .el-drawer {
    margin-top: 60px;
  }
}
</style>
