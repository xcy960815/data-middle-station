import { ChartsService } from '../service/chartService'

const chartsService = new ChartsService()

export default defineEventHandler<
  Promise<
    CustomResponseModule.Response<
      Array<ChartsVo.ChartsOptionVo>
    >
  >
>(async () => {
  try {
    const charts = await chartsService.getCharts()
    return CustomResponse.success(charts)
  } catch (e: any) {
    return CustomResponse.error(e.message)
  }
})
