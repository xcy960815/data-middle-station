/**
 * @desc 逻辑处理
 */
type HandlerParams = {
  chartResizeObserver: Ref<ResizeObserver | undefined>
  chartWidth: Ref<number>
  chartHeight: Ref<number>
}
export const handler = ({ chartResizeObserver, chartWidth, chartHeight }: HandlerParams) => {

  /**
   * @desc 图表开始渲染
   * @returns {void}
   */
  const handleRenderChartStart = () => {
    console.log('handleRenderChartStart');
  }

  /**
   * @desc 图表结束渲染
   * @returns {void}
   */
  const handleRenderChartEnd = () => { 
    console.log('handleRenderChartEnd');
  }

  /**
   * @desc 监听图表容器变化
   * @type {ResizeObserver}
   */
  onMounted(() => {
    chartResizeObserver.value = new ResizeObserver(() => {
      chartWidth.value = document.querySelector('.charts')?.clientWidth || 0
      chartHeight.value = document.querySelector('.charts')?.clientHeight || 0
    })
    chartResizeObserver.value?.observe(document.querySelector('.charts')!)
  })
  /**
   * @desc 销毁监听
   * @returns {void}
   */
  onUnmounted(() => {
    chartResizeObserver.value?.disconnect()
  })
  
  return {
    handleRenderChartStart,
    handleRenderChartEnd
  }
}
