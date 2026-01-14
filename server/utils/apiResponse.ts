/**
 * @desc 响应公共模块 提供静态的Response类
 */

export class ApiResponse {
  static success<T extends Object>(data: T): ApiResponseI<T> {
    return {
      code: 200,
      data,
      message: 'success'
    }
  }
  static error<T extends Object>(message: string, sql?: string, queryParams?: any): ApiResponseI<T> {
    return {
      code: 500,
      data: null,
      message,
      sql,
      queryParams
    }
  }
}
