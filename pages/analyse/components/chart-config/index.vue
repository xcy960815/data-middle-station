<template>
  <!-- 图表📈配置项 -->
  <ClientOnly>
    <el-drawer
      modal-class="chart-config-drawer"
      v-model="chartConfigDrawer"
      :with-header="false"
      size="320px"
      direction="rtl"
    >
      <div class="config-header">
        <h3 class="config-title">图表配置</h3>
      </div>

      <el-tabs
        v-model="chartConfigTab"
        type="card"
        class="config-tabs"
      >
        <el-tab-pane label="通用" name="common">
          <el-form
            label-position="top"
            label-width="auto"
            :model="commonChartConfig"
            class="config-form"
          >
            <el-form-item label="备注">
              <el-input
                type="textarea"
                v-model="commonChartConfig.description"
                :rows="3"
                placeholder="请输入图表备注信息"
              />
            </el-form-item>

            <el-form-item label="数据量上限">
              <el-input-number
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
                style="
                  --el-switch-on-color: #13ce66;
                  --el-switch-off-color: #ff4949;
                "
              />
            </el-form-item>

            <el-form-item label="缓存策略">
              <el-select
                v-model="commonChartConfig.mixStrategy"
                placeholder="请选择缓存策略"
                class="w-full"
              >
                <el-option label="实时" value="real" />
                <el-option label="每日更新" value="daily" />
              </el-select>
            </el-form-item>

            <el-form-item label="分享">
              <el-input
                type="textarea"
                v-model="commonChartConfig.shareStrategy"
                :rows="3"
                placeholder="请输入分享策略"
              />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="外观" name="appearance">
          <component :is="chartConfigComponent"></component>
        </el-tab-pane>
      </el-tabs>
    </el-drawer>
  </ClientOnly>
</template>

<script setup lang="ts">
import TableChartConfig from './components/table-chart-config/index.vue'
import LineChartConfig from './components/line-chart-config/index.vue'
import IntervalChartConfig from './components/interval-chart-config/index.vue'
import PieChartConfig from './components/pie-chart-config/index.vue'

const chartsConfigStore = useChartConfigStore()
const chartStore = useChartStore()
const chartConfigTab = ref('common')
/**
 * @desc 图表配置抽屉 状态
 */
const chartConfigDrawer = computed({
  get: () => {
    return chartsConfigStore.chartConfigDrawer
  },
  set: (value) =>
    chartsConfigStore.setChartConfigDrawer(value)
})
/**
 * @desc 图表配置组件
 */
const chartConfigComponent = computed(() => {
  const chartType = chartStore.getChartType
  switch (chartType) {
    case 'table':
      return TableChartConfig
    case 'line':
      return LineChartConfig
    case 'interval':
      return IntervalChartConfig
    case 'pie':
      return PieChartConfig
    default:
      return LineChartConfig
  }
})
/**
 * @desc 图表公共配置
 */
const commonChartConfig = computed(() => {
  return chartsConfigStore.commonChartConfig
})
</script>

<style lang="scss" scoped>
:deep(.chart-config-drawer) {
  :deep(.el-drawer) {
    margin-top: 60px !important;
    background-color: #f5f7fa;
  }

  :deep(.el-drawer__body) {
    padding: 0;
    height: 100%;
    overflow-y: auto;
  }
}

.config-header {
  padding: 16px 20px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;

  .config-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.config-tabs {
  background: #fff;
  padding: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  :deep(.el-tabs__header) {
    margin: 0;
    padding: 0 0 0 0;
    border-radius: 8px 8px 0 0;
    background: #fff;
  }

  :deep(.el-tabs__nav) {
    border: none;
    margin-left: 16px;
    margin-top: 8px;
  }

  :deep(.el-tabs__item) {
    height: 36px;
    line-height: 36px;
    border: none;
    border-radius: 4px 4px 0 0;
    margin-right: 8px;
    background: transparent;

    &.is-active {
      background-color: #1890ff;
      color: #fff;
    }

    &:hover {
      color: #1890ff;
    }
  }

  :deep(.el-tabs__content) {
    padding: 20px 16px 16px 16px;
    background: #fff;
    border-radius: 0 0 8px 8px;
    min-height: 200px;
  }

  :deep(.el-tabs__active-bar) {
    display: none !important;
  }
}

.config-form {
  padding: 16px;

  :deep(.el-form-item) {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: #606266;
    padding-bottom: 8px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner) {
    box-shadow: 0 0 0 1px #dcdfe6 inset;

    &:hover {
      box-shadow: 0 0 0 1px #1890ff inset;
    }

    &.is-focus {
      box-shadow: 0 0 0 1px #1890ff inset;
    }
  }

  :deep(.el-input-number) {
    width: 100%;
  }
}

.w-full {
  width: 100%;
}
</style>
