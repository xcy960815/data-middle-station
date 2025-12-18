import { ElMessage } from 'element-plus'

/**
 * HTTP 请求组合式函数
 */
export function useHttpRequest() {
  const httpRequest = $fetch.create({
    // 请求拦截器
    onRequest() {
      // const {
      //   public: { apiBase }
      // } = useRuntimeConfig()
      // options.baseURL = apiBase
    },
    // 响应拦截
    onResponse({ response }) {
      return response._data
    },
    // 错误处理
    onResponseError({ response }) {
      const _data = response._data
      if (_data.statusCode === RequestCodeEnum.Unauthorized) {
        ElMessage.error(_data.message)
        navigateTo('/welcome')
      }
    }
  })

  return {
    httpRequest
  }
}

export const httpRequest = $fetch.create({
  // 请求拦截器
  onRequest() {},
  // 响应拦截
  onResponse({ response }) {
    return response._data
  },
  // 错误处理
  onResponseError({ response, error }) {
    const _data = response?._data
    if (_data?.statusCode === RequestCodeEnum.Unauthorized) {
      ElMessage.error(_data.message)
      navigateTo('/welcome')
    } else if (error) {
      console.error('请求错误:', error)
      ElMessage.error(error.message || '请求失败，请稍后重试')
    }
  }
})
