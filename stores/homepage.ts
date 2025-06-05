import { StoreNames } from './store-names'

/**
 * @desc homepage Store
 */
import { defineStore } from 'pinia'

export const useHomepageStore = defineStore<
  HomePageStore.HomePageKey,
  BaseStore.State<HomePageStore.HomePageState>,
  BaseStore.Getters<HomePageStore.HomePageState, HomePageStore.HomePageGetters>,
  BaseStore.Actions<HomePageStore.HomePageState, HomePageStore.HomePageActions>
>(StoreNames.HOMEPAGE, {
  state: () => ({
    charts: [],
  }),
  getters: {
    getCharts(state) {
      return state.charts
    },
  },
  actions: {
    /**
     * @desc 设置图表列表
     */
    setCharts(value) {
      this.charts = value
    },
  },
})
