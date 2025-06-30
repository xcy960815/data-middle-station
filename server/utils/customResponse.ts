/**
 * @desc 响应公共模块 提供静态的Response类
 */

export class CustomResponse {
  static success<T>(data: T): ICustomResponse<T> {
    return {
      code: 200,
      data,
      message: 'success'
    }
  }
  static error<T>(message: string): ICustomResponse<T> {
    return {
      code: 500,
      data: null,
      message
    }
  }
}
