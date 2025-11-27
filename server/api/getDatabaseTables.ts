import { DatabaseService } from '@/server/service/databaseService'

const databaseService = new DatabaseService()

/**
 * 获取所有的表名
 * @param event
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.GetDatabaseTablesResponse>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.GetDatabaseTablesResponse>>>>(
  async (event): Promise<ApiResponseI<Array<DatabaseVo.GetDatabaseTablesResponse>>> => {
    try {
      const getTableRequest = await readBody<DataBaseDto.GetDatabaseTablesRequest>(event)
      const getTableResponse = await databaseService.getTable(getTableRequest)
      return ApiResponse.success(getTableResponse)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
