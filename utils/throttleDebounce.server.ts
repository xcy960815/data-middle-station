/**
 * @desc 防抖装饰器
 * @param delay {number}
 * @param immediate {boolean}
 * @returns {MethodDecorator}
 */
export function Debounce(delay: number, immediate = false) {
  return function <A extends any[]>(
    _target: Object,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<
      (...args: A) => unknown
    >
  ):
    | TypedPropertyDescriptor<(...args: A) => void>
    | undefined {
    let timeoutId: ReturnType<typeof setTimeout> | null
    const originalMethod = descriptor.value

    if (originalMethod) {
      descriptor.value = function (
        this: ThisParameterType<(...args: A) => unknown>,
        ...args: A
      ) {
        const context = this
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        if (immediate && !timeoutId) {
          return originalMethod.apply(context, args)
        }

        const later = () => {
          timeoutId = null
          if (!immediate) {
            return originalMethod.apply(context, args)
          }
        }

        timeoutId && clearTimeout(timeoutId)
        timeoutId = setTimeout(later, delay)

        if (immediate && !timeoutId) {
          return originalMethod.apply(context, args)
        }
      }
      return descriptor
    }
  }
}

/**
 * @desc 节流装饰器
 * @param delay {number}
 * @param leading {boolean}
 * @returns {MethodDecorator}
 */
export function Throttle(
  delay: number,
  leading: boolean = true
) {
  return function <A extends any[], R>(
    _target: any,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<
      (...args: A) => Promise<R>
    >
  ) {
    let previous = 0
    let timeoutId: ReturnType<typeof setTimeout> | null
    const originalMethod = descriptor.value!

    descriptor.value = function (
      this: ThisParameterType<(...args: A) => Promise<R>>,
      ...args: A
    ): Promise<R> {
      const now = Date.now()
      if (leading && !previous) {
        const result = originalMethod.apply(this, args)
        previous = now
        return result
      } else if (now - previous > delay) {
        timeoutId && clearTimeout(timeoutId)
        timeoutId = setTimeout(() => {
          const result = originalMethod.apply(this, args)
          previous = Date.now()
          return result
        }, delay)
      }

      return new Promise((resolve, reject) => {
        timeoutId = setTimeout(async () => {
          try {
            const result = await originalMethod.apply(
              this,
              args
            )
            resolve(result)
            previous = Date.now()
          } catch (error) {
            reject(error)
          }
        }, delay)
      })
    }

    return descriptor
  }
}

/**
 * @desc 防抖函数
 * @param func {Function} 需要防抖的函数
 * @param delay {number} 延迟时间
 * @returns {Function}
 */
export function debounce<F extends (...args: any[]) => any>(
  func: F,
  delay: number
): (...args: Parameters<F>) => ReturnType<F> {
  let timeoutId: ReturnType<typeof setTimeout> | null

  const debouncedFunction = function (
    this: ThisParameterType<F>,
    ...args: Parameters<F>
  ) {
    const context = this

    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    return new Promise<ReturnType<F>>((resolve) => {
      // 延迟执行传入的函数
      timeoutId = setTimeout(() => {
        resolve(func.apply(context, args))
      }, delay)
    })
  }

  return debouncedFunction as (
    ...args: Parameters<F>
  ) => ReturnType<F>
}

/**
 * @desc 节流函数
 * @param func {Function} 需要节流的函数
 * @param delay {number} 延迟时间
 * @returns {Function}
 */
export function throttle<F extends (...args: any[]) => any>(
  func: F,
  delay: number
): (...args: Parameters<F>) => ReturnType<F> {
  let previous = 0
  let timeoutId: ReturnType<typeof setTimeout> | null

  const throttledFunction = function (
    this: ThisParameterType<F>,
    ...args: Parameters<F>
  ) {
    const context = this
    const now = Date.now()

    if (now - previous > delay) {
      timeoutId && clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        func.apply(context, args)
        previous = Date.now()
      }, delay)
    }
  }

  return throttledFunction as (
    ...args: Parameters<F>
  ) => ReturnType<F>
}
