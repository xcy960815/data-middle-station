import { ElMessage } from 'element-plus'

export const fetch = $fetch.create({
  // 请求拦截器
  onRequest({ options }) {
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
      ElMessage.error(_data.statusMessage)
      navigateTo('/welcome')
    }
  }
})

export default fetch
