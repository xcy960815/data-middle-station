/**
 * @desc 权限校验中间件
 * @parameter {RouteLocationNormalized} to
 * @parameter {RouteLocationNormalized} from
 *
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log('check-auth')

  // 如果是访问welcome页面，不进行权限校验
  if (to.path === '/welcome') {
    return
  }

  // 获取token
  const token = useCookie('BearToken').value
  if (!token) {
    return navigateTo('/welcome')
  }
  // 校验token
  const payload = JwtUtils.verifyToken(token)
  // 校验token是否过期
  if (JwtUtils.checkTokenExpired(token)) {
    return navigateTo('/welcome')
  }
})
