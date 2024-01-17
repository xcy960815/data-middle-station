import { ElMessageBox, ElCheckboxGroup, ElCheckbox, ElMessage } from "element-plus"


/**
 * @desc 处理函数
 * @returns 
 */
export const handler = () => {
  const chartStore = useChartStore()
  const columnStore = useColumnStore()
  const filterStore = useFilterStore()
  const orderStore = useOrderStore()
  const chartConfigStore = useChartConfigStore()
  const dimensionStore = useDimensionStore()
  const groupStore = useGroupStore()
  /**
   * @desc 点刷新按钮
   * @returns void
   */
  const handleClickRefresh = () => {
    console.log('handleClickRefresh')
  }
  /**
   * @desc 点报警按钮
   * @returns void
   */
  const handleClickAlarm = () => {
    console.log('handleClickAlarm')
  }
  /**
   * @desc 点设置按钮
   * @returns void
   */
  const handleClickSetting = () => {
    chartConfigStore.setChartConfigDrawer(true)
    
  }
  /**
   * @desc 点全屏按钮
   * @returns void
   */
  const handleClickFullScreen = () => {
    console.log('handleClickFullScreen')
  }

  /**
   * @desc 点下载按钮
   * @returns void
   */
  const handleClickDownload = () => {
    // 获取所有的维度和分组
    const feilds = dimensionStore.getDimensions.concat(groupStore.getGroups)
    if (feilds.length === 0) {
      ElMessage.warning('请先选择维度或分组')
      return
    }

    // 绑定参数
    const selectFeildsState = reactive<{
      selectFeilds: string[]
    }>({
      selectFeilds: feilds.map((feild) => {
        return feild.columnName || ""
      })
    })
    /**
     * @desc 
     */
    ElMessageBox({
      title: "请选择需要下载的字段",
      message: () =>
        h(
          ElCheckboxGroup,
          {
            modelValue: selectFeildsState.selectFeilds,
            'onUpdate:modelValue': (value) => {
              selectFeildsState.selectFeilds = value.map(item=>item.toString())
            },
            style: 'width: 100%;display: grid;',
          },
          () => {
            return feilds.map((feild) => {
              return h(ElCheckbox, { label: feild.displayName, value: feild.columnName || "", })
            })
          }
        ),
      showCancelButton: false,
      confirmButtonText: '下载',
      cancelButtonText: '取消',
    })
      .then(async (action) => {
        const { $webworker } = useNuxtApp()
        const webworker = new $webworker()
        const result = await webworker.run(() => {
          let sum = 0;
          for (let i = 1; i <= 1000000000; i++) {
            sum += i;
          }
          return sum;
        })
        console.log("result", result);
      })
      .catch((e) => {
        ElMessage.info('取消下载')
      })


  }


  /**
   * @desc 点击保存
   */
  const handleClickSave = async () => {
    const chartConfig = chartConfigStore.getChartConfig
    const dimension = dimensionStore.getDimensions
    const group = groupStore.getGroups
    const order = orderStore.getOrders
    const filter = filterStore.getFilters
    const commonChartConfig = chartConfigStore.getCommonChartConfig
    const id = chartStore.getChartId
    const chartName = chartStore.getChartName
    const chartType = chartStore.getChartType
    const tableName = columnStore.getDataSource
    const result  =  await $fetch('/api/analyse/saveChartById', {
      method: 'POST',
      body: {
        id,
        chartName,
        tableName,
        chartType,
        // chartConfig,
        // dimension,
        // group,
        // order,
        // filter,
        // commonChartConfig
      }
    })
    console.log('result', result);
    if (result.code === 200) {
      ElMessage.success('保存成功')
    } else {
      ElMessage.error('保存失败')
    }

    
  }
  return {
    handleClickRefresh,
    handleClickAlarm,
    handleClickSetting,
    handleClickFullScreen,
    handleClickDownload,
    handleClickSave
  }
}
