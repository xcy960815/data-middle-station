import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.DataSourceTableItem[]>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.GetDataSourceTablesRequest>(event)
    const result = await dataSourceService.getDataSourceTables(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
