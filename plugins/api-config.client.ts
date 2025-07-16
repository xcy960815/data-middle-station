import { setFetchConfig } from '~/composables/common-fetch'

/**
 *
 */
export default defineNuxtPlugin(() => {
  // 设置全局 API 配置
  setFetchConfig({
    requestInterceptor: (options) => {
      // 自动添加认证头
      if (process.client) {
        const token = localStorage.getItem('token')
        if (token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${token}`
          }
        }
      }

      console.log('🚀 API Request:', options)
      return options
    },
    responseInterceptor: (response) => {
      console.log('✅ API Response:', response)
      return response
    }
  })
})
