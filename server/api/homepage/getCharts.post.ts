import { ChartsMapper } from '../../mapper/chartsMapper'
import { Response } from '../../utils/response'
/**
 * @获取图表数据
 * @returns { Promise<Array<ChartsModule.ChartsOption>>}
 *
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<
      Array<ChartsModule.ChartsOption>
    >
  >
>(async () => {
  try {
    const chartsInstance = new ChartsMapper()
    const charts = await chartsInstance.getCharts()
    return Response.success(charts)
  } catch (e: any) {
    return Response.error(e.message)
  }
})
