/**
 * @desc 响应公共模块 提供静态的Response类
 */

export class ApiResponse {
  static success<T>(data: T): ApiResponseI<T> {
    return {
      code: 200,
      data,
      message: 'success',
      success: true
    }
  }
  static error<T = unknown>(message: string): ApiResponseI<T>
  static error<T = AnalyzeDataVo.AnalyzeData[]>(
    message: string,
    sql: string | undefined,
    queryParams: AnalyzeDataDto.AnalyzeDataQuery | undefined
  ): AnalyzeDataApiResponseI<T>
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
