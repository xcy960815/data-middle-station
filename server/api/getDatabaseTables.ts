import { DatabaseService } from '@/server/service/databaseService'

const databaseService = new DatabaseService()

/**
 * 获取所有的表名
 * @param event
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.GetDataBaseTablesOptions>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.GetDataBaseTablesOptions>>>>(
  async (event): Promise<ApiResponseI<Array<DatabaseVo.GetDataBaseTablesOptions>>> => {
    try {
      const getTableRequest = await readBody<DataBaseDto.GetTableOptions>(event)
      const getTableResponse = await databaseService.getTable(getTableRequest)
      return ApiResponse.success(getTableResponse)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
