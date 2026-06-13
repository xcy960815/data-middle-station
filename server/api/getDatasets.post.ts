import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

/**
 * @desc 获取数据集列表 API 处理器 (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetListResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.GetDatasetListRequest>(event)
    const result = await datasetService.getDatasets(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
