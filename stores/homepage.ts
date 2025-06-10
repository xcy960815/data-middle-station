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
    analyses: [],
  }),
  getters: {
    getAnalyses(state) {
      return state.analyses
    },
  },
  actions: {
    /**
     * @desc 设置分析列表
     */
    setAnalyses(value) {
      this.analyses = value
    },
  },
})
