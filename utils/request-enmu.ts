/**
 * 请求响应码枚举
 */
export enum RequestCodeEnum {
  /**
   * 成功
   */
  Success = 200,
  /**
   * 错误
   */
  Error = 500,
  /**
   * 未授权
   */
  Unauthorized = 401,
  /**
   * 禁止访问
   */
  Forbidden = 403,
  /**
   * 未找到
   */
  NotFound = 404
}
