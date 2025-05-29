import { ChartsMapper } from '../../mapper/chartsMapper'
import { Response } from '../../utils/response'

/**
 * @api {post} /analyse/getChartById
 * @apiName getChartById
 * @apiGroup analyse
 * @apiDescription 获取图表
 * @apiParam {number} id 图表id
 * @apiSuccess {ChartsOption} data 图表数据
 * @apiSuccessExample {json} Success-Response:
 * @returns {Promise<ResponseModule.Response<ChartsModule.ChartsOption>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<ChartsModule.ChartsOption>
  >
>(async (event) => {
  try {
    const { id } = await readBody(event)
    const chartsInstance = new ChartsMapper()
    const data = await chartsInstance.getChartById(id)
    return Response.success(data)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
