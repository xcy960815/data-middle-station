import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<ApiResponseI<AnalyseVo.GetAnalyseResponse>>>(async (event) => {
  try {
    const { id } = await readBody<AnalyseDto.GetAnalyseRequest>(event)
    const data = await analyseService.getAnalyse(id)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
