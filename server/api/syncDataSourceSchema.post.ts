import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.SyncDataSourceSchemaResponse>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.SyncDataSourceSchemaRequest>(event)
    const result = await dataSourceService.syncDataSourceSchema(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
