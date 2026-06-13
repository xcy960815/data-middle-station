import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

/**
 * @desc 删除数据源 API 处理器 (DELETE)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.DeleteDataSourceRequest>(event)
    const result = await dataSourceService.deleteDataSource(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
