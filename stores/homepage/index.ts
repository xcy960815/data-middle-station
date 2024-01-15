

/**
 * @desc homepage Store
 */

export const useHomepageStore = definePiniaStore<
HomePageStore.HomePageKey,
HomePageStore.HomePageState,
HomePageStore.HomePageGetters<HomePageStore.HomePageState>,
HomePageStore.HomePageActions
>("homepage",
    {
        state: () => {
            return {
                charts: []
            }
        },
        getters: {
            getCharts(state) {
                return state.charts
            }
        },
        actions: {
            setCharts(value) {
                this.charts = value
            }
        }
    })