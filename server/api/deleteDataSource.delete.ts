import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.DeleteDataSourceRequest>(event)
    const result = await dataSourceService.deleteDataSource(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
