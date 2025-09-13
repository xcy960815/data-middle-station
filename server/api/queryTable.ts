import { DatabaseService } from '../service/databaseService'

const databaseService = new DatabaseService()

/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<TableOption>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.TableOptions>>>>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(event)
    const tableList = await databaseService.queryTable(tableName)
    return ApiResponse.success(tableList)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
