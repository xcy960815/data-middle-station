import { DatabaseService } from '@/server/service/databaseService'

const databaseService = new DatabaseService()

/**
 * 获取所有的表名
 * @param event
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.TableItem>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.TableItem>>>>(
  async (event): Promise<ApiResponseI<Array<DatabaseVo.TableItem>>> => {
    try {
      const getDatabaseTablesRequest = await readBody<DatabaseDto.GetDatabaseTablesRequest>(event)
      const databaseTables = await databaseService.getDatabaseTables(getDatabaseTablesRequest)
      return ApiResponse.success(databaseTables)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
