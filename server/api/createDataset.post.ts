import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.CreateDatasetRequest>(event)
    const result = await datasetService.createDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
