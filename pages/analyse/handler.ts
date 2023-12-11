



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
            columnStore.setDataSourceOptions(result.data || [])
        } else {
             columnStore.setDataSourceOptions([])
        }
    }
    onMounted(async () => {
        queryTableList()
    })
}