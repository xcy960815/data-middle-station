import { Response } from '../../utils/response'
// import { AnalyseService } from '../../service/analyseService'
import { DatabaseService } from '../../service/databaseService'
// const analyseService = new AnalyseService()
const databaseService = new DatabaseService()

/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<TableOption>>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<Array<DatabaseVo.TableOptionVo>>
  >
>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(
      event
    )
    const tableList =
      await databaseService.queryTable(tableName)
    return Response.success(tableList)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
