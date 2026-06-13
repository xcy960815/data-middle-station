import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

/**
 * @desc API 处理器 - syncDataSourceSchema.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.SyncDataSourceSchemaResponse>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.SyncDataSourceSchemaRequest>(event)
    const result = await dataSourceService.syncDataSourceSchema(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
