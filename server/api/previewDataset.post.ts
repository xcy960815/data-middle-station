import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

/**
 * @desc API 处理器 - previewDataset.post.ts (POST)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetPreviewResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.PreviewDatasetRequest>(event)
    const result = await datasetService.previewDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
