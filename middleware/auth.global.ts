/**
 * @desc 全局路由鉴权中间件
 * 未登录访问业务页面时跳转到欢迎页。真正的 API 安全边界仍由 server/middleware/check-auth.ts 负责。
 */
export default defineNuxtRouteMiddleware((to) => {
  const publicRoutes = new Set(['/welcome'])
  const demoRoutes = new Set([
    '/table-demo',
    '/indexdb',
    '/particle-system',
    '/monaco-editor',
    '/lazy-load',
    '/web-worker',
    '/eventsource'
  ])

  if (publicRoutes.has(to.path)) {
    return
  }

  if (demoRoutes.has(to.path) && String(useRuntimeConfig().public.enableDemoPages ?? 'false') !== 'true') {
    return abortNavigation(createError({ statusCode: 404, statusMessage: 'Page Not Found' }))
  }

  if (!process.server) {
    return
  }

  const token = useCookie<string | null>('BearToken')
  if (!token.value) {
    return navigateTo('/welcome', { replace: true })
  }
})
