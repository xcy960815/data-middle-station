/**
 * API 拦截器插件
 * 用于拦截请求和响应，处理错误和添加认证信息
 */

// 定义请求配置类型
interface RequestConfig {
  headers?: Record<string, string>
  method?: string
  url?: string
  [key: string]: any
}

// 定义响应类型
interface ResponseContext {
  response?: {
    status?: number
    [key: string]: any
  }
  request?: RequestConfig
  error?: Error
  [key: string]: any
}

export default defineNuxtPlugin((nuxtApp) => {
  const { $fetch } = nuxtApp

  // 请求拦截器
  $fetch.onRequest((config: RequestConfig) => {
    // 获取token
    const token = useCookie('BearToken').value

    // 添加token到请求头
    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
    }

    // 可以添加其他请求处理逻辑
    console.log(`[API] 请求: ${config.method || 'GET'} ${config.url}`)

    return config
  })

  // 响应拦截器
  $fetch.onResponse((response: any) => {
    console.log(`[API] 响应: ${response.status}`)
    return response
  })

  // 响应错误拦截器
  $fetch.onResponseError((context: ResponseContext) => {
    const status = context.response?.status
    const url = context.request?.url || ''

    console.log(`[API] 错误: ${status} - ${url}`)

    // 处理不同的状态码
    switch (status) {
      case 401: // 未授权
        console.error('Token无效或已过期')
        // 清除token
        useCookie('BearToken').value = null
        // 如果不是登录页面，则重定向到登录页
        if (!url.includes('/api/login')) {
          navigateTo('/welcome')
        }
        break

      case 403: // 禁止访问
        console.error('无权限访问该资源')
        break

      case 404: // 资源不存在
        console.error('请求的资源不存在')
        break

      case 500: // 服务器错误
        console.error('服务器内部错误')
        break

      default:
        console.error(`未处理的错误状态码: ${status}`)
        break
    }

    // 可以在这里统一处理错误，例如显示错误提示
    // 如果使用Element Plus，可以使用ElMessage
    // ElMessage.error(context.error?.message || '请求失败');

    return Promise.reject(context.error)
  })
})
