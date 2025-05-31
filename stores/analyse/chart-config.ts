import { defineStore } from 'pinia'

export const useChartConfigStore = defineStore(
  'chart-config',
  {
    state: () => ({
      commonChartConfig: {
        limit: 1000
      }
    }),

    getters: {
      getCommonChartConfig: (state) =>
        state.commonChartConfig
    }
  }
)
