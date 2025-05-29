import { TableMapper } from '../../mapper/tableMapper'
import { Response } from '../../utils/response'
/**
 * @desc 根据表名查询数据
 * @returns {ResponseModule.Response<Array<TableInfoModule.TableColumnOption>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<
      Array<TableInfoModule.TableColumnOptionDao>
    >
  >
>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(
      event
    )
    const tableInstence = new TableMapper()
    const data =
      await tableInstence.queryTableColumns(tableName)
    return Response.success(data)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
