import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetDetailResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.GetDatasetRequest>(event)
    const result = await datasetService.getDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
