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
    analyzes: [],
    total: 0,
    loading: false
  }),
  getters: {
    getAnalyzes(state) {
      return state.analyzes
    },
    getTotal(state) {
      return state.total
    },
    getLoading(state) {
      return state.loading
    }
  },
  actions: {
    /**
     * @desc 设置分析列表
     */
    setAnalyzes(value) {
      this.analyzes = value
    },
    /**
     * @desc 设置列表总数
     */
    setTotal(value) {
      this.total = value
    },
    /**
     * @desc 设置列表加载状态
     */
    setLoading(value) {
      this.loading = value
    }
  }
})
