const getUserNameByCookie = (
  cookie: string
): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(cookie)
    }, 0)
  })
}

/**
 * @desc 校验登录状态
 * @param {import("h3").Event} event
 * @returns {void}
 */
export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  // 只对/api开头的请求进行权限校验
  if (!url.pathname.startsWith('/api')) {
    return
  } else {
    const cookie = getCookie(event, '__spider__visitorid')

    if (!cookie) {
      // 直接给用户设置cookie
      setCookie(event, '__spider__visitorid', 'xcy960815', {
        maxAge: 60 * 60 * 24 * 7,
        httpOnly: true,
        path: '/',
        domain: 'localhost',
        sameSite: 'lax',
        secure: false,
      })
      // 如果有sso单点登录页面，直接重定向到登录页面
      // sendRedirect(event, 'https://juejin.cn/post/7236635191379509308');
      // 如果没有sso页面，跳转到登录页面
      // sendRedirect(event, `/login`);
      // 给前端直接返回 固定的code 让前端做判断进行跳转
      // return {
      //   code: 999,
      //   data: null,
      //   message: 'success',
      // };
    } else {
      const userName = await getUserNameByCookie(cookie)
      // 可以通过cookie查询用户信息
      event.context.name = userName
    }
  }
})
