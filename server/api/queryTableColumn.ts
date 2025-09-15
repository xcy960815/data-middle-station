import { DatabaseService } from '../service/databaseService'
const databaseService = new DatabaseService()
/**
 * @desc 根据表名查询数据
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.TableColumnOption>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.TableColumnOption>>>>(async (event) => {
  try {
    const tableColumnRequest = getQuery<DatabaseDto.TableColumnRequest>(event)
    const data = await databaseService.queryTableColumn(tableColumnRequest)
    return ApiResponse.success(data)
  } catch (error: any) {
    return ApiResponse.error(error.message)
  }
})
