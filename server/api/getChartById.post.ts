import { ChartsService } from '../service/chartService'
import { CustomResponse } from '../../utils/customResponse'

const chartsService = new ChartsService()

export default defineEventHandler<
  Promise<
    CustomResponseModule.Response<ChartsVo.ChartsOptionVo>
  >
>(async (event) => {
  try {
    const { id } = await readBody(event)
    const data = await chartsService.getChartById(id)
    return CustomResponse.success(data)
  } catch (error: any) {
    console.log(error)
    return CustomResponse.error(error.message)
  }
})
