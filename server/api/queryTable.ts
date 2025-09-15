import { DatabaseService } from '../service/databaseService'

const databaseService = new DatabaseService()

/**
 * @desc 获取所有的表名
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.TableOptions>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.TableOptions>>>>(async (event) => {
  try {
    const queryTableRequest = getQuery<DatabaseDto.QueryTableRequest>(event)
    const tableList = await databaseService.queryTable(queryTableRequest)
    return ApiResponse.success(tableList)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
