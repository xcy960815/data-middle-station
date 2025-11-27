import { DatabaseService } from '@/server/service/databaseService'

const databaseService = new DatabaseService()

/**
 * 获取所有的表名
 * @param event
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.GetDataBaseTablesResponse>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.GetDataBaseTablesResponse>>>>(
  async (event): Promise<ApiResponseI<Array<DatabaseVo.GetDataBaseTablesResponse>>> => {
    try {
      const getTableRequest = await readBody<DataBaseDto.GetTableOptions>(event)
      const getTableResponse = await databaseService.getTable(getTableRequest)
      return ApiResponse.success(getTableResponse)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
