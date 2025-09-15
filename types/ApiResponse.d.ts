/**
 * @description: 通用的请求响应结构
 * @param {200|500} code 状态码
 * @param {any|null} data 响应数据
 * @param {string} message 响应消息
 * @return {Response}
 */
declare interface ApiResponseI<D extends Object = any> {
  code: 200 | 404 | 500 | 401 | 403
  data: D | null
  message: string
  success?: boolean
}
