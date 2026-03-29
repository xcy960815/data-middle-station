import { ElMessage } from 'element-plus'

/**
 * 创建统一的 HTTP 请求实例。
 */
function createHttpRequest() {
  return $fetch.create({
    onRequest() {
      // const {
      //   public: { apiBase }
      // } = useRuntimeConfig()
      // options.baseURL = apiBase
    },
    onResponse({ response }) {
      return response._data
    },
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
}

export const httpRequest = createHttpRequest()

/**
 * HTTP 请求组合式函数。
 * 保留原有返回结构，内部统一复用单例实例。
 */
export function useHttpRequest() {
  return {
    httpRequest
  }
}
