import { DataSourceService } from '@/server/service/dataSourceService'

const dataSourceService = new DataSourceService()

/**
 * @desc 获取数据源信息/列表 API 处理器 (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DataSourceVo.DataSourceDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DataSourceDto.GetDataSourceRequest>(event)
    const result = await dataSourceService.getDataSource(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
