import { ChartService } from '../service/chartService'

const chartService = new ChartService()

export default defineEventHandler<
  Promise<
    CustomResponseModule.Response<ChartsVo.ChartsOptionVo>
  >
>(async (event) => {
  try {
    const { id } = await readBody(event)
    const data = await chartService.getChart(id)
    return CustomResponse.success(data)
  } catch (error: any) {
    console.log(error)
    return CustomResponse.error(error.message)
  }
})
