import { AVATAR } from '@/server/api/login.post'
/**
 * @desc 获取用户信息
 */
export default defineEventHandler<Promise<ApiResponseI<UserInfoVo.UserInfoResponse>>>(async (event) => {
  const userInfo = event.context.user
  const userId = userInfo.userId
  const userName = userInfo.userName
  return ApiResponse.success({
    userId: userId,
    userName: userName,
    avatar: AVATAR
  })
})
