/**
 * @desc 退出登录
 */
export default defineEventHandler<Promise<ApiResponseI<{ success: boolean }>>>(async (event) => {
  setCookie(event, JwtUtils.TOKEN_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isSecureCookieRequest(event),
    path: '/',
    maxAge: 0
  })

  return ApiResponse.success({ success: true })
})
