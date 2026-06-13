/**
 * @desc 响应公共模块 提供静态的Response类
 */

/**
 * 接口响应公共格式工具类，提供统一成功与失败结果的返回构造
 */
export class ApiResponse {
  /**
   * 构造成功的 API 响应结果
   * @template T
   * @param {T} data 成功的业务数据载荷
   * @returns {ApiResponseI<T>} 符合统一响应格式的对象
   */
  static success<T>(data: T): ApiResponseI<T> {
    return {
      code: 200,
      data,
      message: 'success',
      success: true
    }
  }

  /**
   * 构造失败的通用 API 响应结果
   * @template T
   * @param {string} message 错误描述信息
   * @returns {ApiResponseI<T>}
   */
  static error<T = unknown>(message: string): ApiResponseI<T>

  /**
   * 构造分析接口专用的失败响应结果，携带 SQL 信息和查询参数
   * @template T
   * @param {string} message 错误描述信息
   * @param {string | undefined} sql 执行失败的 SQL 语句
   * @param {AnalyzeDataDto.AnalyzeDataQuery | undefined} queryParams 请求查询参数对象
   * @returns {AnalyzeDataApiResponseI<T>}
   */
  static error<T = AnalyzeDataVo.AnalyzeData[]>(
    message: string,
    sql: string | undefined,
    queryParams: AnalyzeDataDto.AnalyzeDataQuery | undefined
  ): AnalyzeDataApiResponseI<T>

  /**
   * 失败 API 响应的重载实现方法
   * @template T
   * @param {string} message 错误信息
   * @param {string} [sql] 可选的 SQL 语句
   * @param {AnalyzeDataDto.AnalyzeDataQuery} [queryParams] 可选的查询参数
   * @returns {ApiResponseI<T> | AnalyzeDataApiResponseI<T>}
   */
  static error<T = unknown>(
    message: string,
    sql?: string,
    queryParams?: AnalyzeDataDto.AnalyzeDataQuery
  ): ApiResponseI<T> | AnalyzeDataApiResponseI<T> {
    return {
      code: 500,
      data: null,
      message,
      success: false,
      sql,
      queryParams
    }
  }
}
