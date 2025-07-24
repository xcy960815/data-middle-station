const {
  public: { apiBase }
} = useRuntimeConfig()
console.log('apiBase', apiBase)

export const fetch = $fetch.create({
  baseURL: apiBase,
  // 请求拦截器
  onRequest({ options }) {
    console.log('onRequest', options)
  },
  // 响应拦截
  onResponse({ response }) {
    console.log('onResponse', response)
    return response._data
  },
  // 错误处理
  onResponseError({ response }) {
    console.log('onResponseError', response)
  }
})

export default fetch
