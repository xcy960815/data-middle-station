import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

/**
 * @desc 修改数据集 API 处理器 (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.UpdateDatasetRequest>(event)
    const result = await datasetService.updateDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
