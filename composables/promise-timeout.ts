export type ClearablePromiseOptions = {
  milliseconds: number
  message?: string | Error | false
  abortController?: AbortController
}

/**
 * 超时错误类
 */
export class TimeoutError extends Error {
  override name = 'TimeoutError'
  constructor(message = 'Operation timed out') {
    super(message)
  }
}

/**
 * 中止错误类
 */
export class AbortError extends Error {
  override name = 'AbortError'
  constructor(message = 'Operation was aborted') {
    super(message)
  }
}

/**
 * 获取中止原因
 */
// const getAbortedReason = (signal: AbortSignal): Error => {
//   const reason = signal.reason ?? 'This operation was aborted'
//   return reason instanceof Error ? reason : new AbortError(reason)
// }

/**
 * Promise 超时包装器
 * @param inputPromise 原始 Promise
 * @param options 配置选项
 * @returns 包装后的 Promise
 */
export function promiseTimeout<T>(inputPromise: PromiseLike<T>, options: ClearablePromiseOptions): Promise<T> {
  const { milliseconds, message, abortController } = options

  if (milliseconds === Number.POSITIVE_INFINITY) {
    return Promise.resolve(inputPromise)
  }

  let timeoutId: NodeJS.Timeout | undefined

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      abortController?.abort()

      if (message === false) {
        reject(new TimeoutError())
      } else if (message instanceof Error) {
        reject(message)
      } else {
        reject(new TimeoutError(message ?? `Promise timed out after ${milliseconds}ms`))
      }
    }, milliseconds)
  })

  return Promise.race([inputPromise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}
