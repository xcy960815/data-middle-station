<template>
  <!-- KPI 指标卡 -->
  <div
    class="kpi-card h-full w-full flex flex-col justify-center items-center p-4"
    data-canvas-type="kpi-card"
    data-canvas-component="KpiCard"
  >
    <template v-if="hasData">
      <!-- 标题 -->
      <div v-if="title" class="kpi-title text-sm text-gray-500 mb-1 text-center">{{ title }}</div>

      <!-- 主指标 -->
      <div class="kpi-main-value text-3xl font-bold text-gray-900 mb-2">
        {{ formattedMainValue }}
      </div>

      <!-- 指标名称 -->
      <div v-if="mainMeasureName" class="kpi-measure-name text-xs text-gray-400 mb-3">
        {{ mainMeasureName }}
      </div>

      <!-- 对比指标区域 -->
      <div v-if="compareItems.length > 0" class="kpi-compare flex gap-4 items-center justify-center flex-wrap">
        <div v-for="(item, index) in compareItems" :key="index" class="kpi-compare-item flex flex-col items-center">
          <span class="kpi-compare-label text-xs text-gray-400">{{ item.label }}</span>
          <span class="kpi-compare-value text-sm font-medium" :class="item.trendClass">
            {{ item.displayValue }}
          </span>
          <span v-if="item.changeText" class="kpi-compare-change text-xs" :class="item.trendClass">
            <span class="kpi-arrow" :class="item.direction">{{
              item.direction === 'up' ? '↑' : item.direction === 'down' ? '↓' : '→'
            }}</span>
            {{ item.changeText }}
          </span>
        </div>
      </div>

      <!-- 迷你趋势线 -->
      <div
        v-if="showSparkline && sparklineData.length > 1"
        ref="sparklineContainer"
        class="kpi-sparkline mt-3 w-full"
        style="height: 40px"
      ></div>
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
        smooth: true,
        symbol: 'none',
        lineStyle: { width: 2, color },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: color + '40' },
              { offset: 1, color: color + '05' }
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
  min-height: 120px;
  position: relative;
  user-select: none;
}

.kpi-main-value {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

.kpi-arrow {
  font-size: 0.75em;
  margin-right: 2px;
}

.kpi-sparkline {
  opacity: 0.8;
  transition: opacity 0.2s;

  &:hover {
    opacity: 1;
  }
}

.kpi-compare-item {
  min-width: 60px;
}
</style>
