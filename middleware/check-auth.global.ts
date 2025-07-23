/**
 * @desc 权限校验中间件
 * @parameter {RouteLocationNormalized} to
 * @parameter {RouteLocationNormalized} from
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  // console.log('check-auth middleware running')
  // // 如果是访问welcome页面，不进行权限校验
  // if (to.path === '/welcome') {
  //   return
  // }
  // // 获取token
  // const token = useCookie('BearToken').value
  // if (!token) {
  //   console.log('未提供认证Token，重定向到登录页面')
  //   return navigateTo('/welcome')
  // }
  // 其他路由权限检查逻辑可以在这里添加
  // 例如：检查用户角色是否有权限访问特定页面
})
