import { AVATAR } from './login.post'
/**
 * @desc 获取用户信息
 */
export default defineEventHandler<Promise<ApiResponseI<UserInfoVo.UserInfo>>>(async (event) => {
  const token = JwtUtils.getTokenFromCookie(event)
  const userInfo = JwtUtils.verifyToken(token as string)
  const userId = userInfo.userId
  const userName = userInfo.userName
  return ApiResponse.success({
    userId: userId,
    userName: userName,
    avatar: AVATAR
  })
})
