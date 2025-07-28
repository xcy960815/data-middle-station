/**
 * @desc 获取用户信息
 */
export default defineEventHandler(async (event) => {
  const cookie = getCookie(event, JwtUtils.TOKEN_NAME)
  if (!cookie) {
    return CustomResponse.error('用户未登录')
  }
  const jwtPayload = JwtUtils.verifyToken(cookie)
  if (!jwtPayload) {
    return CustomResponse.error('用户未登录')
  }
  const userId = RedisStorage.getItem(`userId`)
  if (!userId) {
    return CustomResponse.error('用户未登录')
  }
  const userName = RedisStorage.getItem(`userName`)
  if (!userName) {
    return CustomResponse.error('用户未登录')
  }
  return CustomResponse.success({
    userId: userId,
    userName: userName,
    avatar: 'https://64.media.tumblr.com/d15e5f21577f659a395d84e49f4d75dc/tumblr_oo4411ye0h1si8vfyo1_1280.gif'
  })
})
