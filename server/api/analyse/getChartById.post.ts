import { Response } from '../../utils/response'

import { ChartsService } from '../../service/chartService'

const chartsService = new ChartsService()

export default defineEventHandler<
  Promise<ResponseModule.Response<ChartsVo.ChartsOptionVo>>
>(async (event) => {
  try {
    const { id } = await readBody(event)
    const data = await chartsService.getChartById(id)
    return Response.success(data)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
