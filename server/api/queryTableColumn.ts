import { DatabaseService } from '../service/databaseService'
const databaseService = new DatabaseService()
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>}
 */
export default defineEventHandler<Promise<ApiResponse<Array<DatabaseVo.TableColumnOptionVo>>>>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(event)
    const data = await databaseService.queryTableColumn(tableName)
    return CustomResponse.success(data)
  } catch (error: any) {
    return CustomResponse.error(error.message)
  }
})
