/**
 * @desc 全局路由鉴权中间件
 * 未登录访问业务页面时跳转到欢迎页。真正的 API 安全边界仍由 server/middleware/check-auth.ts 负责。
 */
export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = new Set(['/welcome'])

  if (publicRoutes.has(to.path)) {
    return
  }

  if (process.server) {
    const token = useCookie<string | null>('BearToken')
    if (!token.value) {
      return navigateTo('/welcome', { replace: true })
    }
  }

  if (process.client) {
    const userStore = useUserStore()
    if (!userStore.getUserId) {
      return navigateTo('/welcome', { replace: true })
    }
  }
})
