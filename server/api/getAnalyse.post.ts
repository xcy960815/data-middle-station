import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.AnalyseOption>>>(async (event) => {
  try {
    const { id } = await readBody<AnalyseDto.GetAnalyseRequestParams>(event)
    const data = await analyseService.getAnalyse(id)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
