import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.DataSourceListResponse>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.GetDataSourceListRequest>(event)
    const result = await dataSourceService.getDataSources(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
