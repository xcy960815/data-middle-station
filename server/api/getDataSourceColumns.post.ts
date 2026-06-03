import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.DataSourceColumnItem[]>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.GetDataSourceColumnsRequest>(event)
    const result = await dataSourceService.getDataSourceColumns(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
