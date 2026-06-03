import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<boolean>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.DeleteDatasetRequest>(event)
    const result = await datasetService.deleteDataset(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
