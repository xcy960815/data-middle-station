export type ClearablePromiseOptions = {
  milliseconds: number
  message?: string | Error | false
  abortController?: globalThis.AbortController
}

/**
 * @desc 超时错误类
 */
export class TimeoutError extends Error {
  name: string
  constructor(message?: string) {
    super(message)
    this.name = 'TimeoutError'
  }
}

/**
 * @desc Abort 错误类
 */
export class AbortError extends Error {
  name: string
  message: string
  constructor(message: string) {
    super(message)
    this.name = 'AbortError'
    this.message = message
  }
}

/**
 * @desc 获取dom异常信息
 * @param {string} errorMessage
 * @returns { AbortError | DOMException }
 */
const getDomException = (
  errorMessage: string
): AbortError | DOMException => {
  return globalThis.DOMException === undefined
    ? new AbortError(errorMessage)
    : new DOMException(errorMessage)
}

/**
 *
 * @param {AbortSignal} signal
 * @returns
 */
const getAbortedReason = (signal: AbortSignal) => {
  const reason =
    signal.reason === undefined
      ? getDomException('This operation was aborted')
      : signal.reason
  return reason instanceof Error
    ? reason
    : getDomException(reason)
}

export function promiseTimeout<V = any>(
  inputPromise: PromiseLike<V>,
  options: ClearablePromiseOptions
): Promise<V> {
  const { milliseconds, message, abortController } = options

  let timer: ReturnType<typeof setTimeout> | undefined

  const wrappedPromise = new Promise<V>(
    (resolve, reject) => {
      if (milliseconds === Number.POSITIVE_INFINITY) {
        inputPromise.then(resolve, reject)
        return
      }

      timer = setTimeout.call(
        undefined,
        () => {
          abortController?.abort()
          if (message === false) {
            reject(new TimeoutError('Operation timed out'))
          } else if (message instanceof Error) {
            reject(message)
          } else {
            const errorMessage =
              message ??
              `Promise timed out after ${milliseconds} milliseconds`
            const timeoutError = new TimeoutError(
              errorMessage
            )
            reject(timeoutError)
          }
        },
        milliseconds
      )
      ;(async () => {
        try {
          const inputPromiseResult = await inputPromise
          resolve(inputPromiseResult)
        } catch (error) {
          reject(error)
        }
      })()
    }
  )

  /**
   * @desc 默认清除定时器
   */
  const cancelablePromise = wrappedPromise.finally(() => {
    clearTimeout.call(undefined, timer)
    timer = undefined
  })

  return cancelablePromise
}
