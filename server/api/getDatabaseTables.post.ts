import { DatabaseService } from '@/server/service/databaseService'

const databaseService = new DatabaseService()

/**
 * 获取所有的表名
 * @param event
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.GetDatabaseTablesOptions>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.GetDatabaseTablesOptions>>>>(
  async (event): Promise<ApiResponseI<Array<DatabaseVo.GetDatabaseTablesOptions>>> => {
    try {
      const databaseTableQuery = await readBody<DatabaseDto.GetDatabaseTablesOptions>(event)
      const databaseTables = await databaseService.getDatabaseTables(databaseTableQuery)
      return ApiResponse.success(databaseTables)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
