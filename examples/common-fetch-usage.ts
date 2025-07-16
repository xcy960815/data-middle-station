// 使用示例文件 - 展示如何使用新的 api 函数
import {
  api,
  setFetchConfig
} from '~/composables/common-fetch'
import { RequestCodeEnum } from '~/utils/request-enmu'

// 1. 设置全局配置（可选）
setFetchConfig({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  },
  // 全局请求拦截器 - 自动添加 token
  requestInterceptor: (options) => {
    const token = localStorage.getItem('token')
    if (token) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`
      }
    }
    return options
  },
  // 全局响应拦截器 - 统一错误处理
  responseInterceptor: (response: any) => {
    // 这里可以做统一的响应处理
    console.log('Response received:', response)
    return response
  }
})

// 2. 使用方法 - 保持 Nuxt3 的类型推导能力
export const useApi = () => {
  // GET 请求 - TypeScript 会根据你的 server/api/users.get.ts 自动推导返回类型
  const getUsers = async () => {
    return await api('/api/users', {
      method: 'GET',
      query: { page: 1, limit: 10 }
    })
  }

  // POST 请求 - TypeScript 会根据你的 server/api/users.post.ts 自动推导返回类型
  const createUser = async (userData: any) => {
    return await api('/api/users', {
      method: 'POST',
      body: userData
    })
  }

  // 带自定义拦截器的请求
  const login = async (credentials: {
    username: string
    password: string
  }) => {
    return await api('/api/login', {
      method: 'POST',
      body: credentials,
      // 单次请求的响应拦截器
      responseInterceptor: (response: any) => {
        // 假设登录成功后保存 token
        if (
          response &&
          typeof response === 'object' &&
          'token' in response
        ) {
          localStorage.setItem('token', response.token)
        }
        return response
      }
    })
  }

  // 直接使用，就像原生 $fetch 一样
  const getProfile = async () => {
    // TypeScript 会根据 server/api/profile.get.ts 自动推导类型
    return await api('/api/profile')
  }

  return {
    getUsers,
    createUser,
    login,
    getProfile
  }
}

// 3. 在组件中使用
// const { login } = useApi()
// const result = await login({ username: 'admin', password: '123456' })
// // result 的类型会根据你的 server/api/login.post.ts 自动推导
