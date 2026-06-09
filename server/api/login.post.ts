import { AuthService } from '@/server/service/authService'

const authService = new AuthService()

/**
 * @desc 用户登录 API
 */
export default defineEventHandler<Promise<ApiResponseI<LoginVo.LoginResponse>>>(async (event) => {
  const loginIp = authService.resolveClientIp(event)
  const userAgent = getHeader(event, 'user-agent') || ''

  try {
    const loginRequest = await readBody<LoginDto.LoginRequest>(event)
    const result = await authService.authenticateUser(loginRequest, { loginIp, userAgent })

    if (!result.authenticated) {
      return ApiResponse.error(result.errorMessage)
    }

    setCookie(event, JwtUtils.TOKEN_NAME, result.token, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    })

    return ApiResponse.success({
      userId: result.userId,
      userName: result.userName
    })
  } catch (error) {
    return ApiResponse.error('服务器内部错误')
  }
})
