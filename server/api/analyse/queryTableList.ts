import { TableDao } from '../../database/table'
import { Response } from '../../database/response'

/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<TableOption>>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<
      Array<TableInfoModule.TableOptionDao>
    >
  >
>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(
      event
    )
    const tableDaoInstence = new TableDao()
    const tableList =
      await tableDaoInstence.queryTableList(tableName)
    return Response.success(tableList)
  } catch (error: any) {
    console.log(error)
    return Response.error(error.message)
  }
})
