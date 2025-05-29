import { DatabaseService } from '../../service/databaseService'
import { Response } from '../../utils/response'
const databaseService = new DatabaseService()
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<
      Array<DatabaseVo.TableColumnOptionVo>
    >
  >
>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(
      event
    )
    const data =
      await databaseService.queryTableColumns(tableName)
    return Response.success(data)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
