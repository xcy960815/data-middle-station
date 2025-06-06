import { AnalyseService } from '../service/analyseService'

const analyseService = new AnalyseService()

export default defineEventHandler<Promise<CustomResponseModule.Response<AnalyseVo.AnalyseOption>>>(
  async event => {
    try {
      const { id } = await readBody(event)
      const data = await analyseService.getAnalyse(id)
      return CustomResponse.success(data)
    } catch (error: any) {
      console.log(error)
      return CustomResponse.error(error.message)
    }
  }
)
