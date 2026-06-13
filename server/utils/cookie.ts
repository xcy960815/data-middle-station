import type { H3Event } from 'h3'

/**
 * 判断当前请求是否通过 HTTPS 发起，用于设置 Cookie 的 Secure 标记
 * @param {H3Event} event H3 请求事件对象
 * @returns {boolean} 如果是通过 HTTPS 发起则返回 true，否则返回 false
 */
export const isSecureCookieRequest = (event: H3Event): boolean => {
  return getHeader(event, 'x-forwarded-proto') === 'https' || getRequestURL(event).protocol === 'https:'
}
