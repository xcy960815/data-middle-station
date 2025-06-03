import { ChartService } from '../service/chartService'

const chartService = new ChartService()

export default defineEventHandler<
  Promise<
    CustomResponseModule.Response<
      Array<ChartVo.ChartOption>
    >
  >
>(async () => {
  try {
    const charts = await chartService.getCharts()
    return CustomResponse.success(charts)
  } catch (e: any) {
    return CustomResponse.error(e.message)
  }
})
