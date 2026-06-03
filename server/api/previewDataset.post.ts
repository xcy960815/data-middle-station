import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetPreviewResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.PreviewDatasetRequest>(event)
    const result = await datasetService.previewDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
