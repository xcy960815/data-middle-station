import { AsyncLocalStorage } from 'node:async_hooks'
import type { EventHandlerRequest, H3Event } from 'h3'

const requestEventStorage = new AsyncLocalStorage<H3Event<EventHandlerRequest>>()

/**
 * @desc 绑定当前 API 请求事件，供 service 层读取中间件写入的上下文信息。
 */
export function bindRequestEvent(event: H3Event<EventHandlerRequest>) {
  requestEventStorage.enterWith(event)
}

/**
 * @desc 获取当前 API 请求事件。
 */
export function getCurrentRequestEvent() {
  return requestEventStorage.getStore()
}
