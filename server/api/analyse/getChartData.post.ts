import { ChartsService } from '../../service/chartService'
import { Response } from '../../utils/response'
const chartsService = new ChartsService()

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<ChartDataDao>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<GetAnswerDao.ChartDataDao>
  >
>(async (event) => {
  try {
    const getAnswerParamsDto =
      await readBody<GetAnswerDto.GetAnswerParamsDto>(event)

    const data = await chartsService.getChartData(
      getAnswerParamsDto
    )

    return Response.success(data)
  } catch (error: any) {
    console.error(error)
    return Response.error(error.message)
  }
})
