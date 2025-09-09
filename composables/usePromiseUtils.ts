export interface PromiseTimeoutOptions {
  milliseconds: number
  message?: string | Error | false
  abortController?: AbortController
}

export interface RetryOptions {
  maxAttempts: number
  delay?: number
  exponentialBackoff?: boolean
  onRetry?: (attempt: number, error: Error) => void
}

export interface PromiseAllSettledResult<T> {
  status: 'fulfilled' | 'rejected'
  value?: T
  reason?: Error
}

export interface BatchPromiseOptions {
  concurrency?: number
  timeout?: number
  onProgress?: (completed: number, total: number) => void
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
 * 重试错误类
 */
export class RetryError extends Error {
  override name = 'RetryError'
  public attempts: number
  public lastError: Error

  constructor(attempts: number, lastError: Error) {
    super(`Failed after ${attempts} attempts: ${lastError.message}`)
    this.attempts = attempts
    this.lastError = lastError
  }
}

/**
 * Promise 工具组合式函数
 */
export function usePromiseUtils() {
  /**
   * Promise 超时包装器
   * @param inputPromise 原始 Promise
   * @param options 配置选项
   * @returns 包装后的 Promise
   */
  const promiseTimeout = <T>(inputPromise: PromiseLike<T>, options: PromiseTimeoutOptions): Promise<T> => {
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

  /**
   * 带重试的 Promise 执行器
   * @param promiseFactory Promise 工厂函数
   * @param options 重试选项
   * @returns Promise<T>
   */
  const promiseWithRetry = async <T>(promiseFactory: () => Promise<T>, options: RetryOptions): Promise<T> => {
    const { maxAttempts, delay = 1000, exponentialBackoff = false, onRetry } = options
    let lastError: Error

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await promiseFactory()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))

        if (attempt === maxAttempts) {
          throw new RetryError(attempt, lastError)
        }

        onRetry?.(attempt, lastError)

        const waitTime = exponentialBackoff ? delay * Math.pow(2, attempt - 1) : delay
        await sleep(waitTime)
      }
    }

    throw new RetryError(maxAttempts, lastError!)
  }

  /**
   * 睡眠函数
   * @param milliseconds 睡眠时间（毫秒）
   * @returns Promise<void>
   */
  const sleep = (milliseconds: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
  }

  /**
   * 可取消的延迟
   * @param milliseconds 延迟时间
   * @param abortController 中止控制器
   * @returns Promise<void>
   */
  const cancellableDelay = (milliseconds: number, abortController?: AbortController): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, milliseconds)

      abortController?.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId)
        reject(new AbortError('Delay was cancelled'))
      })
    })
  }

  /**
   * 批量执行 Promise（控制并发数）
   * @param promises Promise 数组或工厂函数数组
   * @param options 批量执行选项
   * @returns Promise<T[]>
   */
  const batchPromises = async <T>(
    promises: Array<Promise<T> | (() => Promise<T>)>,
    options: BatchPromiseOptions = {}
  ): Promise<T[]> => {
    const { concurrency = 3, timeout, onProgress } = options
    const results: T[] = []
    let completed = 0

    // 将函数转换为 Promise
    const promiseList = promises.map((p) => (typeof p === 'function' ? p : () => p))

    for (let i = 0; i < promiseList.length; i += concurrency) {
      const batch = promiseList.slice(i, i + concurrency)

      const batchPromises = batch.map(async (promiseFactory, index) => {
        try {
          let promise = promiseFactory()

          // 如果设置了超时时间
          if (timeout) {
            promise = promiseTimeout(promise, { milliseconds: timeout })
          }

          const result = await promise
          completed++
          onProgress?.(completed, promiseList.length)
          return result
        } catch (error) {
          completed++
          onProgress?.(completed, promiseList.length)
          throw error
        }
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Promise.allSettled 的增强版本
   * @param promises Promise 数组
   * @returns Promise<PromiseAllSettledResult<T>[]>
   */
  const allSettledEnhanced = async <T>(promises: Promise<T>[]): Promise<PromiseAllSettledResult<T>[]> => {
    const results = await Promise.allSettled(promises)

    return results.map((result) => ({
      status: result.status,
      ...(result.status === 'fulfilled'
        ? { value: result.value }
        : { reason: result.reason instanceof Error ? result.reason : new Error(String(result.reason)) })
    }))
  }

  /**
   * 竞速 Promise，返回最快完成的结果和索引
   * @param promises Promise 数组
   * @returns Promise<{ result: T; index: number }>
   */
  const raceWithIndex = async <T>(promises: Promise<T>[]): Promise<{ result: T; index: number }> => {
    return new Promise((resolve, reject) => {
      promises.forEach((promise, index) => {
        promise.then((result) => resolve({ result, index })).catch(reject)
      })
    })
  }

  /**
   * 创建可取消的 Promise
   * @param executor Promise 执行器
   * @returns { promise: Promise<T>; cancel: () => void }
   */
  const createCancellablePromise = <T>(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason?: any) => void,
      abortSignal: AbortSignal
    ) => void
  ): { promise: Promise<T>; cancel: () => void } => {
    const abortController = new AbortController()

    const promise = new Promise<T>((resolve, reject) => {
      abortController.signal.addEventListener('abort', () => {
        reject(new AbortError('Promise was cancelled'))
      })

      executor(resolve, reject, abortController.signal)
    })

    return {
      promise,
      cancel: () => abortController.abort()
    }
  }

  /**
   * Promise 管道处理
   * @param initialValue 初始值
   * @param processors 处理器函数数组
   * @returns Promise<T>
   */
  const promisePipeline = async <T>(
    initialValue: T,
    ...processors: Array<(value: T) => Promise<T> | T>
  ): Promise<T> => {
    let result = initialValue

    for (const processor of processors) {
      result = await processor(result)
    }

    return result
  }

  /**
   * 验证 Promise 超时选项
   * @param options 超时选项
   * @returns 验证结果
   */
  const validateTimeoutOptions = (options: PromiseTimeoutOptions): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (options.milliseconds < 0) {
      errors.push('超时时间不能为负数')
    }

    if (options.milliseconds === 0) {
      errors.push('超时时间不能为 0')
    }

    if (
      options.message &&
      typeof options.message !== 'string' &&
      !(options.message instanceof Error) &&
      options.message !== false
    ) {
      errors.push('message 必须是字符串、Error 实例或 false')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证重试选项
   * @param options 重试选项
   * @returns 验证结果
   */
  const validateRetryOptions = (options: RetryOptions): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (options.maxAttempts <= 0) {
      errors.push('最大重试次数必须大于 0')
    }

    if (options.delay && options.delay < 0) {
      errors.push('重试延迟不能为负数')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  return {
    promiseTimeout,
    promiseWithRetry,
    sleep,
    cancellableDelay,
    batchPromises,
    allSettledEnhanced,
    raceWithIndex,
    createCancellablePromise,
    promisePipeline,
    validateTimeoutOptions,
    validateRetryOptions,
    TimeoutError,
    AbortError,
    RetryError
  }
}
