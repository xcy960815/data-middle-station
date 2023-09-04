<template>
  <!-- 图表📈配置项 -->
  <ClientOnly>
    <el-drawer
      modal-class="charts-config-drawer"
      v-model="chartsConfigDrawer"
      :with-header="false"
      size="300px"
      direction="rtl"
    >
      <el-tabs v-model="chartConfigTab" type="card">
        <el-tab-pane label="通用" name="common">
          <el-form
            label-position="top"
            label-width="auto"
            :model="commonConfigFormData"
          >
            <el-form-item label="备注">
              <el-input
                type="textarea"
                v-model="commonConfigFormData.description"
              />
            </el-form-item>
            <el-form-item label="数据量上限(limit)">
              <el-input
                v-model="commonConfigFormData.limit"
              />
            </el-form-item>
            <el-form-item label="智能作图建议">
              <el-switch
                v-model="commonConfigFormData.suggest"
                class="ml-2"
                style="
                  --el-switch-on-color: #13ce66;
                  --el-switch-off-color: #ff4949;
                "
              />
            </el-form-item>
            <el-form-item label="缓存策略">
              <el-select
                v-model="commonConfigFormData.mixStrategy"
                placeholder="缓存策略"
              >
                <el-option label="实时" value="real" />
                <el-option label="每日更新" value="daily" />
              </el-select>
            </el-form-item>
            <el-form-item label="分享">
              <el-input
                type="textarea"
                v-model="commonConfigFormData.shareStrategy"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="外观" name="appearance">
          <!-- 其他外观配置 -->
          <component :is="chartConfigComponent"></component>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </ClientOnly>
</template>

<script setup lang="ts">
import { initData } from './init-data'
const {
  chartConfigTab,
  chartsConfigDrawer,
  chartConfigComponent,
  commonConfigFormData
} = initData()
</script>

<style lang="less" scoped>
:deep(.charts-config-drawer) {
  :deep(.el-drawer) {
    margin-top: 60px !important;
  }
}
</style>
