import { DEFAULT_USER_AVATAR } from '@/server/service/authService'
/**
 * @desc 获取用户信息
 */
export default defineEventHandler<Promise<ApiResponseI<UserInfoVo.UserInfoResponse>>>(async (event) => {
  const userInfo = event.context.user
  if (!userInfo) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  const userId = userInfo.userId
  const userName = userInfo.userName
  return ApiResponse.success({
    userId: userId,
    userName: userName,
    avatar: DEFAULT_USER_AVATAR
  })
})
