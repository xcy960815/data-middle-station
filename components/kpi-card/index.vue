<template>
  <!-- KPI 指标卡 -->
  <div class="kpi-card h-full w-full" data-canvas-type="kpi-card" data-canvas-component="KpiCard">
    <template v-if="hasData">
      <div class="kpi-card-inner">
        <!-- 头部: 标题和度量名称 -->
        <div class="kpi-header">
          <div v-if="title" class="kpi-title">{{ title }}</div>
          <div v-if="mainMeasureName" class="kpi-subtitle">{{ mainMeasureName }}</div>
        </div>

        <!-- 主内容区: 主指标和对比 -->
        <div class="kpi-body">
          <div class="kpi-main-value">
            {{ formattedMainValue }}
          </div>

          <div v-if="compareItems.length > 0" class="kpi-compare-group">
            <div v-for="(item, index) in compareItems" :key="index" class="kpi-compare-pill" :class="item.direction">
              <span class="kpi-compare-label">{{ item.label }}</span>
              <span class="kpi-compare-val">{{ item.displayValue }}</span>
              <span class="kpi-compare-change">
                <span class="kpi-arrow">{{
                  item.direction === 'up' ? '↑' : item.direction === 'down' ? '↓' : '→'
                }}</span>
                {{ item.changeText }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部迷你趋势线 -->
      <div class="kpi-footer">
        <div v-if="showSparkline && sparklineData.length > 1" ref="sparklineContainer" class="kpi-sparkline"></div>
      </div>
    </template>

    <!-- 空状态 -->
    <template v-else>
      <div class="kpi-empty text-center text-gray-400">
        <div class="kpi-empty-icon text-4xl mb-2">—</div>
        <div class="text-sm">{{ title || '暂无数据' }}</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { init, type ECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch, type PropType } from 'vue'
import { getDefaultChartColors } from '~/composables/useChartRender/utils'

// 注册 ECharts 迷你线组件
import { use } from 'echarts/core'
use([LineChart, GridComponent, TooltipComponent, CanvasRenderer])

defineOptions({
  name: 'KpiCard'
})

const props = defineProps({
  title: {
    type: String,
    default: () => ''
  },
  data: {
    type: Array as PropType<Array<AnalyzeDataVo.AnalyzeData>>,
    default: () => []
  },
  xAxisFields: {
    type: Array as PropType<Array<DimensionStore.DimensionOption>>,
    default: () => []
  },
  yAxisFields: {
    type: Array as PropType<Array<MeasureStore.MeasureOption>>,
    default: () => []
  },
  chartWidth: {
    type: [Number, String],
    default: () => '100%'
  },
  chartHeight: {
    type: [Number, String],
    default: () => '100%'
  },
  privateChartConfig: {
    type: Object as PropType<AnalyzeConfigVo.KpiCardConfigItem | null>,
    default: () => null
  }
})

const emits = defineEmits(['renderChartStart', 'renderChartEnd'])

// 获取图表配置
const chartConfigStore = useChartConfigStore()

const chartConfig = computed(() => {
  return (
    props.privateChartConfig ||
    chartConfigStore.privateChartConfig?.kpiCard || {
      showComparison: true,
      showSparkline: true,
      comparisonType: 'chain'
    }
  )
})

const showSparkline = computed(() => chartConfig.value.showSparkline !== false)

// 迷你线容器
const sparklineContainer = ref<HTMLElement | null>(null)
const sparklineInstance = shallowRef<ECharts | null>(null)

// 度量字段名
const mainMeasure = computed(() => props.yAxisFields[0]?.columnName || '')
const mainMeasureName = computed(() => {
  const field = props.yAxisFields[0]
  return field?.displayName || field?.columnComment || field?.columnName || ''
})

// 是否有数据
const hasData = computed(() => {
  return props.data && props.data.length > 0 && mainMeasure.value
})

// 主指标值
const mainValue = computed(() => {
  if (!hasData.value) return 0
  // 取最新一条数据的值（如果是时间序列）或第一条
  const item = props.data.length > 0 ? props.data[0] : null
  return item ? Number(item[mainMeasure.value] || 0) : 0
})

// 格式化主值
const formattedMainValue = computed(() => {
  const value = mainValue.value
  if (Number.isInteger(value)) {
    return value.toLocaleString('zh-CN')
  }
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
})

// 对比指标
const compareItems = computed(() => {
  if (!chartConfig.value.showComparison || props.data.length < 2) return []

  const items: Array<{
    label: string
    displayValue: string
    trendClass: string
    changeText: string
    direction: 'up' | 'down' | 'flat'
  }> = []

  const currentVal = Number(props.data[0]?.[mainMeasure.value] || 0)

  // 环比（取前一条）
  if (props.data.length >= 2) {
    const prevVal = Number(props.data[1]?.[mainMeasure.value] || 0)
    const change = prevVal !== 0 ? ((currentVal - prevVal) / Math.abs(prevVal)) * 100 : 0
    const direction = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'flat'
    const trendClass = direction === 'up' ? 'text-green-600' : direction === 'down' ? 'text-red-500' : 'text-gray-500'

    items.push({
      label: '环比',
      displayValue: formatNumber(prevVal),
      trendClass,
      changeText: `${Math.abs(change).toFixed(1)}%`,
      direction
    })
  }

  // 如果有更多数据，计算总体变化
  if (props.data.length >= 3) {
    const firstVal = Number(props.data[props.data.length - 1]?.[mainMeasure.value] || 0)
    const change = firstVal !== 0 ? ((currentVal - firstVal) / Math.abs(firstVal)) * 100 : 0
    const direction = change > 0.01 ? 'up' : change < -0.01 ? 'down' : 'flat'
    const trendClass = direction === 'up' ? 'text-green-600' : direction === 'down' ? 'text-red-500' : 'text-gray-500'

    items.push({
      label: '整体变化',
      displayValue: formatNumber(firstVal),
      trendClass,
      changeText: `${Math.abs(change).toFixed(1)}%`,
      direction
    })
  }

  return items
})

// 迷你趋势线数据
const sparklineData = computed(() => {
  if (!hasData.value || props.data.length < 2) return []
  // 反转数据使时间序列按正序显示
  return [...props.data].reverse().map((item) => Number(item[mainMeasure.value] || 0))
})

// 获取 X 轴标签（用于迷你线 tooltip）
const sparklineLabels = computed(() => {
  if (!hasData.value || props.data.length < 2) return []
  const dimField = props.xAxisFields[0]?.columnName
  if (!dimField) return []
  return [...props.data].reverse().map((item) => String(item[dimField] || ''))
})

function formatNumber(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString('zh-CN')
  }
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

// 渲染迷你趋势线
const renderSparkline = () => {
  if (!showSparkline.value || !sparklineContainer.value || sparklineData.value.length < 2) {
    return
  }

  if (sparklineInstance.value) {
    sparklineInstance.value.dispose()
    sparklineInstance.value = null
  }

  try {
    sparklineInstance.value = markRaw(init(sparklineContainer.value))
  } catch (error) {
    console.error('KpiCard: sparkline init error', error)
    return
  }

  const colors = getDefaultChartColors()
  const color = colors[0]

  const option = {
    grid: {
      left: 0,
      right: 0,
      top: 2,
      bottom: 2
    },
    xAxis: {
      type: 'category' as const,
      show: false,
      data: sparklineLabels.value.length > 0 ? sparklineLabels.value : undefined,
      boundaryGap: false
    },
    yAxis: {
      type: 'value' as const,
      show: false
    },
    tooltip: {
      trigger: 'axis' as const,
      confine: true,
      formatter: (params: any) => {
        const p = Array.isArray(params) ? params[0] : params
        const val = typeof p.value === 'number' ? p.value : Number(p.value) || 0
        const name = p.axisValue || p.name || ''
        return `${name}<br/>${formatNumber(val)}`
      }
    },
    series: [
      {
        type: 'line',
        data: sparklineData.value,
        smooth: 0.4,
        symbol: 'none',
        lineStyle: { width: 3, color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '50' },
              { offset: 1, color: color + '00' }
            ]
          }
        }
      }
    ]
  }

  try {
    sparklineInstance.value.setOption(option, true)
  } catch (error) {
    console.error('KpiCard: sparkline setOption error', error)
  }
}

watch(
  () => [props.data, props.xAxisFields, props.yAxisFields, chartConfig.value],
  () => {
    nextTick(() => {
      renderSparkline()
    })
  },
  { deep: true }
)

watch(
  () => [props.chartWidth, props.chartHeight],
  () => {
    nextTick(renderSparkline)
  }
)

onMounted(() => {
  emits('renderChartStart')
  nextTick(() => {
    renderSparkline()
    emits('renderChartEnd')
  })
})

onBeforeUnmount(() => {
  if (sparklineInstance.value) {
    sparklineInstance.value.dispose()
    sparklineInstance.value = null
  }
})
</script>

<style lang="scss" scoped>
.kpi-card {
  min-height: 160px;
  position: relative;
  overflow: hidden;
  border-radius: 20px;
  background: #ffffff;
  box-shadow:
    0 10px 40px -10px rgba(0, 0, 0, 0.08),
    0 1px 3px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  user-select: none;
  display: flex;
  flex-direction: column;
}

.kpi-card:hover {
  transform: translateY(-4px) scale(1.005);
  box-shadow:
    0 20px 40px -10px rgba(0, 0, 0, 0.12),
    0 4px 10px -2px rgba(0, 0, 0, 0.05);
}

.kpi-card-inner {
  padding: 40px;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;
  text-align: center;
  height: 100%;
}

.kpi-header {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.kpi-title {
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 1px;
  text-transform: uppercase;
}

.kpi-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 6px;
  font-weight: 500;
}

.kpi-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  width: 100%;
}

.kpi-main-value {
  font-size: 84px;
  font-weight: 900;
  color: transparent;
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  -webkit-background-clip: text;
  background-clip: text;
  letter-spacing: -2px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  filter: drop-shadow(0 4px 8px rgba(15, 23, 42, 0.08));
}

.kpi-compare-group {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.kpi-compare-pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  border-radius: 100px;
  font-size: 15px;
  font-weight: 600;
  background: #f1f5f9;
  transition: all 0.3s ease;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.02);
}

.kpi-compare-pill:hover {
  transform: translateY(-2px);
}

.kpi-compare-pill.up {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%);
  color: #059669;
  box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.2);
}
.kpi-compare-pill.up .kpi-compare-val {
  color: #047857;
}

.kpi-compare-pill.down {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%);
  color: #dc2626;
  box-shadow: inset 0 0 0 1px rgba(239, 68, 68, 0.2);
}
.kpi-compare-pill.down .kpi-compare-val {
  color: #b91c1c;
}

.kpi-compare-pill.flat {
  background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
  color: #64748b;
}

.kpi-compare-label {
  font-weight: 500;
  opacity: 0.7;
  font-size: 13px;
}

.kpi-compare-val {
  font-weight: 800;
}

.kpi-footer {
  width: 100%;
  height: 35%;
  min-height: 100px;
  position: absolute;
  bottom: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
}

.kpi-sparkline {
  width: 100%;
  height: 100%;
  opacity: 0.9;
  transition: opacity 0.4s ease;
}

.kpi-card:hover .kpi-sparkline {
  opacity: 1;
}

.kpi-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #cbd5e1;
  flex: 1;
}

.kpi-empty-icon {
  font-size: 42px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.kpi-arrow {
  font-size: 0.9em;
  margin-right: 4px;
  font-weight: 900;
}
</style>
