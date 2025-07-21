/**
 * @desc 全局重定向中间件
 * @parameter {RouteLocationNormalized} to
 */
export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/') {
    return navigateTo('/welcome')
  }
})
