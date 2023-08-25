/**
 * @desc 图表类型操作逻辑
 * @returns {object}
 */
export const handler = () => {
  const chartStore = useChartStore()
  /**
   * @desc 切换图表类型
   * @param {string} chartType - 图表类型
   * @param {number} index - 图表类型索引
   * @returns {void}
   */

  const changeChartType = (
    chartType: string,
    index: number
  ): void => {
    const chartTypeItems = document.querySelectorAll(
      '.chart-type-item'
    )
    chartTypeItems.forEach((item) => {
      item.classList.remove('active')
    })
    chartTypeItems[index].classList.add('active')
    chartStore.setChartType(chartType)
  }
  return {
    changeChartType
  }
}
