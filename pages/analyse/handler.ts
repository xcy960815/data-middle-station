/**
 * @desc 分析页面逻辑处理
 */
export const handler = () => {
    const columnStore = useColumnStore();
    const filterStore = useFilterStore();
    const orderStore = useOrderStore();
    const dimensionStore = useDimensionStore();
    const groupStore = useGroupStore();
    const chartConfigStore = useChartConfigStore();
    const chartStore = useChartStore();
    /**
     * @desc 查询表格列表
     * @returns {Promise<void>}
     */
    const queryTableList = async () => {
        const result = await $fetch('/api/analyse/queryTableList')
        if (result.code === 200) {
            columnStore.setDataSourceOptions(result.data as Array<{label:string; value:string}> || [])
        } else {
            columnStore.setDataSourceOptions([])
        }
    }
    /**
     * @desc 查询表格列
     * @param tableName
     * @returns {Promise<void>}
     */
    const queryTableColumns = async (tableName: string) => {
        const result = await $fetch('/api/analyse/queryTableColumns', {
            method: 'GET',
            params: {
                tableName
            }
        })
        if (result.code === 200) {
            const cloumns = result.data?.map((item: TableInfoModule.TableColumnOption) => {
                return {
                    ...item,
                    choosed: false,
                    alias: item.columnName,
                    displyName: item.columnName
                }
            })
            columnStore.setColumns(cloumns || [])
        } else {
            columnStore.setDataSourceOptions([])
        }
    }
    /**
     * @desc 监听表格数据源变化
     */
    watch(() => columnStore.getDataSource, (dataSource) => {
        queryTableColumns(dataSource)
        // 如果数据源变化，清空筛选条件
        filterStore.setFilters([])
        // 如果数据源变化，清空排序条件
        orderStore.setOrders([])
        // 如果数据源变化，清空分组条件
        groupStore.setGroups([])
        // 如果数据源变化，清空维度条件
        dimensionStore.setDimensions([])
    })
    /**
     * @desc 需要查询表格数据的参数
     */
    const queryChartDataParams = computed(() => {
        return {
            dataSource: columnStore.getDataSource,
            filters: filterStore.getFilters,
            orders: orderStore.getOrders,
            groups: groupStore.getGroups,
            dimensions: dimensionStore.getDimensions,
            limit:chartConfigStore.getChartCommonConfigData,
        }
    })
    /**
     * @desc 查询表格数据
     * @returns {Promise<void>}
     */
    const queryChartData = async () => {
        const {dataSource, dimensions} = queryChartDataParams.value
        if(!dataSource) return
        if(!dimensions.length) return

        const result = await $fetch('/api/analyse/getAnswer', {
            method: 'POST',
            // 请求参数
            body: queryChartDataParams.value
        })
        if (result.code === 200) {
            chartStore.setChartData(result.data || [])
        } else {
            console.log('查询表格数据失败');
            
        }
    }
    watch(queryChartDataParams, (params) => {
        queryChartData()
    }, {
        deep: true
    })

    

    onMounted(async () => {
        queryTableList()
        // queryChartData()
    })
}