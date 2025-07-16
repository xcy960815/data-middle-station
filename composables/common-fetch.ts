// 不再重新导出 RequestCodeEnum，让其他文件直接从 utils 导入

/**
 * 扩展的请求配置，添加拦截器支持
 */
export interface ExtendedFetchOptions {
  // 基础请求配置
  method?:
    | 'GET'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'PATCH'
    | 'HEAD'
    | 'OPTIONS'
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'head'
    | 'options'
  baseURL?: string
  headers?: Record<string, string>
  query?: Record<string, any>
  body?: any
  timeout?: number

  // 拦截器
  requestInterceptor?: (options: any) => any
  responseInterceptor?: <T = any>(response: T) => T
}

/**
 * 全局配置
 */
interface GlobalConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
  requestInterceptor?: (options: any) => any
  responseInterceptor?: <T = any>(response: T) => T
}

/**
 * 全局配置存储
 */
class FetchConfig {
  static config: GlobalConfig = {
    headers: {
      'Content-Type': 'application/json'
    }
  }

  static setConfig(newConfig: GlobalConfig) {
    this.config = { ...this.config, ...newConfig }
  }

  static getConfig(): GlobalConfig {
    return this.config
  }
}

/**
 * 应用全局拦截器到 $fetch 选项
 */
function applyInterceptors(options: any = {}) {
  const globalConfig = FetchConfig.getConfig()

  // 合并全局配置
  const finalOptions = {
    baseURL: globalConfig.baseURL,
    timeout: globalConfig.timeout,
    headers: {
      ...globalConfig.headers,
      ...options.headers
    },
    ...options
  }

  // 应用全局请求拦截器
  if (globalConfig.requestInterceptor) {
    return globalConfig.requestInterceptor(finalOptions)
  }

  return finalOptions
}

/**
 * 设置全局配置
 */
export function setFetchConfig(config: GlobalConfig) {
  FetchConfig.setConfig(config)
}

/**
 * 增强版的 $fetch，使用 Proxy 完全保持类型推导能力
 * 这样 TypeScript 可以根据你的 server/api 路由自动推导返回类型
 */
export const api = new Proxy($fetch, {
  apply(target, thisArg, argArray) {
    const [url, options] = argArray
    const processedOptions = applyInterceptors(options)

    // 直接调用原生 $fetch，完全保持类型推导
    return target.call(thisArg, url, processedOptions)
  }
}) as typeof $fetch

/**
 * @desc CommonFetch 错误类
 */
export class CommonFetchError extends Error {
  statusCode?: number
  statusText?: string
  reason?: string
  response?: Response
  error?: any

  constructor(
    errorMessage: string,
    options?: { response?: Response; error?: any }
  ) {
    super(errorMessage)
    this.name = 'CommonFetchError'

    if (options?.response) {
      this.response = options.response
      this.statusCode = options.response.status
      this.statusText = options.response.statusText
    }

    if (options?.error) {
      this.error = options.error
      // 如果是 ofetch 错误，提取状态码
      if (options.error.response) {
        this.statusCode = options.error.response.status
        this.statusText = options.error.response.statusText
      }
    }
  }
}
