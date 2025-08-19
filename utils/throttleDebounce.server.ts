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
    descriptor: TypedPropertyDescriptor<(...args: A) => unknown>
  ): TypedPropertyDescriptor<(...args: A) => void> | undefined {
    let timeoutId: ReturnType<typeof setTimeout> | null
    const originalMethod = descriptor.value

    if (originalMethod) {
      descriptor.value = function (this: ThisParameterType<(...args: A) => unknown>, ...args: A) {
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
export function Throttle(delay: number, leading: boolean = true) {
  return function <A extends any[], R>(
    _target: any,
    _propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<(...args: A) => Promise<R>>
  ) {
    let previous = 0
    let timeoutId: ReturnType<typeof setTimeout> | null
    const originalMethod = descriptor.value!

    descriptor.value = function (this: ThisParameterType<(...args: A) => Promise<R>>, ...args: A): Promise<R> {
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
            const result = await originalMethod.apply(this, args)
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
): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pendingPromise: Promise<Awaited<ReturnType<F>>> | null = null
  let resolveRef: ((value: Awaited<ReturnType<F>>) => void) | null = null
  let rejectRef: ((reason?: unknown) => void) | null = null
  let lastArgs: Parameters<F>
  let lastThis: ThisParameterType<F>

  const debounced = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
    lastArgs = args
    lastThis = this

    if (timeoutId) clearTimeout(timeoutId)

    if (!pendingPromise) {
      pendingPromise = new Promise<Awaited<ReturnType<F>>>((resolve, reject) => {
        resolveRef = resolve
        rejectRef = reject
      })
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      const resolve = resolveRef
      const reject = rejectRef
      resolveRef = null
      rejectRef = null
      const toResolve = pendingPromise
      pendingPromise = null

      try {
        const result = func.apply(lastThis, lastArgs) as ReturnType<F>
        Promise.resolve(result).then(
          (val) => {
            resolve && toResolve && resolve(val as Awaited<ReturnType<F>>)
          },
          (err) => {
            reject && toResolve && reject(err)
          }
        )
      } catch (err) {
        reject && toResolve && reject(err)
      }
    }, delay)

    return pendingPromise
  }

  return debounced
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

  const throttledFunction = function (this: ThisParameterType<F>, ...args: Parameters<F>) {
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

  return throttledFunction as (...args: Parameters<F>) => ReturnType<F>
}
