import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetPreviewResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.PreviewDatasetSqlRequest>(event)
    const result = await datasetService.previewDatasetSql(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
