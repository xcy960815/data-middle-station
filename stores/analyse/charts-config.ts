/**
 * @desc 图表配置 store
 * @desc setup 用法
 */
export const useChartConfigStore = definePiniaStore<
  ChartConfigStore.ChartConfigKey,
  ChartConfigStore.ChartConfigState,
  ChartConfigStore.ChartConfigGetters<ChartConfigStore.ChartConfigState>,
  ChartConfigStore.ChartConfigActions
>('chartConfig',
  {
    state: () => ({
      chartsConfigDrawer: false,
      chartCommonConfigData: {
        description: '',
        limit: 1000,
        suggest: false,
        mixStrategy: 'daily',
        shareStrategy: ''
      },
      chartConfigData: {
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
      getChartsConfigDrawer(state) {
        return state.chartsConfigDrawer
      },
      getChartCommonConfigData(state) {
        return state.chartCommonConfigData
      },
      getChartConfigData(state) {
        return state.chartConfigData
      }
    },
    actions: {
      setChartsConfigDrawer(drawer) {
        this.chartsConfigDrawer = drawer
      },
      setChartCommonConfigData(config) {
        this.chartCommonConfigData = config
      },
      setChartConfigData(config) {
        this.chartConfigData = config
      }
    }
  })

