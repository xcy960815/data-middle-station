/**
 * @desc 图表配置 store
 */

interface CommonChartConfig {
  description: string
  limit: number
  suggest: boolean
  mixStrategy: string
  shareStrategy: string
}

interface LineChartConfig {
  showPoint: boolean
  showLabel: boolean
  smooth: boolean
  autoDualAxis: boolean
  horizontalBar: boolean
}

interface IntervalChartConfig {
  displayMode: string
  showPercentage: boolean
  showLabel: boolean
  horizontalDisplay: boolean
  horizontalBar: boolean
}

interface PieChartConfig {
  showLabel: boolean
  chartType: string
}

interface TableChartConfig {
  displayMode: string
  showCompare: boolean
  conditions: any[]
}

interface ChartConfig {
  line: LineChartConfig
  interval: IntervalChartConfig
  pie: PieChartConfig
  table: TableChartConfig
}

interface ChartConfigState {
  chartConfigDrawer: boolean
  commonChartConfig: CommonChartConfig
  chartConfig: ChartConfig
}

export const useChartConfigStore = defineStore(
  'chartConfig',
  {
    state: (): ChartConfigState => ({
      chartConfigDrawer: false,
      commonChartConfig: {
        description: '',
        limit: 1000,
        suggest: false,
        mixStrategy: 'daily',
        shareStrategy: ''
      },
      chartConfig: {
        line: {
          showPoint: false,
          showLabel: false,
          smooth: false,
          autoDualAxis: false,
          horizontalBar: false
        },
        interval: {
          displayMode: 'levelDisplay',
          showPercentage: false,
          showLabel: false,
          horizontalDisplay: false,
          horizontalBar: false
        },
        pie: {
          showLabel: false,
          chartType: 'pie'
        },
        table: {
          displayMode: 'originalDisplay',
          showCompare: false,
          conditions: []
        }
      }
    }),
    getters: {
      getChartConfigDrawer(state): boolean {
        return state.chartConfigDrawer
      },
      getCommonChartConfig(state): CommonChartConfig {
        return state.commonChartConfig
      },
      getChartConfig(state): ChartConfig {
        return state.chartConfig
      }
    },
    actions: {
      /**
       * @desc 设置图表配置抽屉状态
       * @param drawer {boolean}
       */
      setChartConfigDrawer(drawer: boolean) {
        this.chartConfigDrawer = drawer
      },
      /**
       * @desc 设置通用图表配置
       * @param config {CommonChartConfig}
       */
      setCommonChartConfig(config: CommonChartConfig) {
        this.commonChartConfig = config
      },
      /**
       * @desc 设置图表配置
       * @param config {ChartConfig}
       */
      setChartConfig(config: ChartConfig) {
        this.chartConfig = config
      },
      /**
       * @desc 设置表格图表条件
       * @param conditions {any[]}
       */
      setTableChartConditions(conditions: any[]) {
        this.chartConfig.table.conditions = conditions
      }
    }
  }
)
