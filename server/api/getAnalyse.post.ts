import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<ApiResponse<AnalyseVo.AnalyseOption>>>(async (event) => {
  try {
    const { id } = await readBody(event)
    const data = await analyseService.getAnalyse(id)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
