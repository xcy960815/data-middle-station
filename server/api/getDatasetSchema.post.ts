import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

/**
 * @desc 获取数据集目标数据库的表结构 Schema（表+列），用于 Monaco Editor 联想
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<ApiResponseI<DatasetVo.DatasetSchemaResponse>>} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetSchemaResponse>>>(async (event) => {
  try {
    const result = await datasetService.getDatasetSchema()
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
