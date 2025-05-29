import { Response } from '../../utils/response'
import { AnalyseService } from '../../service/analyse'

const analyseService = new AnalyseService()

/**
 * @desc 获取所有的表名
 * @returns {Promise<ResponseModule.Response<Array<TableOption>>>}
 */
export default defineEventHandler<
  Promise<
    ResponseModule.Response<
      Array<TableInfoVo.TableOptionVo>
    >
  >
>(async (event) => {
  try {
    const { tableName } = getQuery<{ tableName: string }>(
      event
    )
    const tableList =
      await analyseService.queryTable(tableName)
    return Response.success(tableList)
  } catch (error: any) {
    return Response.error(error.message)
  }
})
