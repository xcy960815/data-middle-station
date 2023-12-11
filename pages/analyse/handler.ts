



/**
 * @desc 分析页面逻辑处理
 */

export const handler = () => {
    const columnStore = useColumnStore();
    /**
     * @desc 查询表格列表
     * @returns {Promise<void>}
     */
    const queryTableList = async () => {
        const result = await $fetch('/api/tableInfo/queryTableList')
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
        const result = await $fetch('/api/tableInfo/queryTableColumns', {
            method: 'GET',
            params: {
                tableName
            }
        })
        if (result.code === 200) {
            const cloumns = result.data?.map((item: TableInfoModule.TableColumnOptions) => {
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
    watch(() => columnStore.getDataSource, (dataSource) => {
        queryTableColumns(dataSource)
    })

    onMounted(async () => {
        queryTableList()
        
    })
}