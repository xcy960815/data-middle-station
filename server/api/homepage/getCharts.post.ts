import { ChartsService } from '../../service/chartService'
import { Response } from '../../utils/response'

const chartsService = new ChartsService()

export default defineEventHandler<
  Promise<
    ResponseModule.Response<Array<ChartsVo.ChartsOptionVo>>
  >
>(async () => {
  try {
    const charts = await chartsService.getCharts()
    return Response.success(charts)
  } catch (e: any) {
    return Response.error(e.message)
  }
})
