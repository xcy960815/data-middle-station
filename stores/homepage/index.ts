/**
 * @desc homepage Store
 */

interface Chart {
  id: string
  name: string
  type: string
  config: any
  data: any
}

interface HomepageState {
  charts: Chart[]
}

export const useHomepageStore = defineStore('homepage', {
  state: (): HomepageState => ({
    charts: []
  }),
  getters: {
    getCharts(state): Chart[] {
      return state.charts
    }
  },
  actions: {
    /**
     * @desc 设置图表列表
     * @param value {Chart[]}
     */
    setCharts(value: Chart[]) {
      this.charts = value
    }
  }
})
