import { AsyncLocalStorage } from 'node:async_hooks'
import type { EventHandlerRequest, H3Event } from 'h3'

const requestEventStorage = new AsyncLocalStorage<H3Event<EventHandlerRequest>>()

/**
 * 绑定当前 API 请求事件，将当前 H3Event 绑定到 AsyncLocalStorage 上，供 service 层等直接读取中间件写入的上下文信息（如当前登录用户等）
 * @param {H3Event<EventHandlerRequest>} event H3 请求事件对象
 * @returns {void}
 */
export function bindRequestEvent(event: H3Event<EventHandlerRequest>) {
  requestEventStorage.enterWith(event)
}

/**
 * 获取当前 API 请求的 H3Event 对象
 * @returns {H3Event<EventHandlerRequest> | undefined} 绑定的 H3Event 对象，若不在请求异步上下文内则返回 undefined
 */
export function getCurrentRequestEvent() {
  return requestEventStorage.getStore()
}
