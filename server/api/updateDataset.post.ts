import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.UpdateDatasetRequest>(event)
    const result = await datasetService.updateDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
