import { TableDao } from '../../database/table'
import { Response } from '../../database/response'
type TableOption = {
  label: string
  value: string
}
/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<TableOption>>>}
 */
export default defineEventHandler<
  Promise<ResponseModule.Response<Array<TableOption>>>
>(async (_event) => {
  try {
    const tableInstence = new TableDao()
    const tableList = (
      await tableInstence.queryTableList()
    ).map((item) => {
      return {
        label: item.tableName || '',
        value: item.tableName || ''
      }
    })
    return Response.success(tableList)
  } catch (error: any) {
    console.log(error)
    return Response.error(error.message)
  }
})
