import { DatabaseService } from '../service/databaseService'
const databaseService = new DatabaseService()
/**
 * @desc 根据表名查询数据
 * @returns {Promise<ApiResponseI<Array<DatabaseVo.GetTableColumnsResponse>>>}
 */
export default defineEventHandler<Promise<ApiResponseI<Array<DatabaseVo.GetTableColumnsResponse>>>>(
  async (event): Promise<ApiResponseI<Array<DatabaseVo.GetTableColumnsResponse>>> => {
    try {
      const getTableColumnsRequest = await readBody<DatabaseDto.GetTableColumnsRequest>(event)
      const getTableColumnsResponse = await databaseService.getTableColumns(getTableColumnsRequest)
      return ApiResponse.success(getTableColumnsResponse)
    } catch (error: any) {
      return ApiResponse.error(error.message)
    }
  }
)
