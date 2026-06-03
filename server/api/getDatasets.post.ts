import { DatasetService } from '@/server/service/datasetService'

const datasetService = new DatasetService()

export default defineEventHandler<Promise<ApiResponseI<DatasetVo.DatasetListResponse>>>(async (event) => {
  try {
    const body = await readBody<DatasetDto.GetDatasetListRequest>(event)
    const result = await datasetService.getDatasets(body)
    return ApiResponse.success(result)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
