import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.DataSourceDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.GetDataSourceRequest>(event)
    const result = await dataSourceService.getDataSource(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
