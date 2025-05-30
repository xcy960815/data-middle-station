import { Response } from '../../utils/response'
import { ChartsService } from '../../service/chartService'

const chartsService = new ChartsService()
/**
 * @api {post} /analyse/saveChartById
 * @apiName saveChartById
 * @apiGroup analyse
 * @apiDescription 保存图表
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<
  Promise<ResponseModule.Response<boolean>>
>(async (event) => {
  try {
    const chartsConfigDto =
      await readBody<ChartsConfigDto.ChartsConfigDto>(event)
    const data =
      await chartsService.updateChart(chartsConfigDto)
    return Response.success(data)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
