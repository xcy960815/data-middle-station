import { DatabaseService } from '../service/databaseService'
const databaseService = new DatabaseService()
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.TableColumnOption>>>>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(event)
    const data = await databaseService.queryTableColumn(tableName)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
