/**
 * @desc 防抖装饰器
 * @param delay {number} 延迟时间
 * @param immediate {boolean} 是否立即执行
 * @returns {MethodDecorator}
 */
export function Debounce(delay: number, immediate = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    descriptor.value = function (this: any, ...args: any[]) {
      const context = this

      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      if (immediate) {
        const callNow = !timeoutId
        timeoutId = setTimeout(() => {
          timeoutId = null
        }, delay)
        if (callNow) {
          return originalMethod.apply(context, args)
        }
      } else {
        timeoutId = setTimeout(() => {
          originalMethod.apply(context, args)
        }, delay)
      }
    }
    return descriptor
  }
}

/**
 * @desc 节流装饰器
 * @param delay {number} 延迟时间
 * @param leading {boolean} 是否首次立即执行
 * @returns {MethodDecorator}
 */
export function Throttle(delay: number, leading = true) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value
    let lastTime = 0
    let timeoutId: ReturnType<typeof setTimeout> | null = null

    descriptor.value = function (this: any, ...args: any[]) {
      const now = Date.now()
      if (!lastTime && !leading) lastTime = now

      const remaining = delay - (now - lastTime)

      if (remaining <= 0 || remaining > delay) {
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        lastTime = now
        return originalMethod.apply(this, args)
      } else if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastTime = leading ? Date.now() : 0
          timeoutId = null
          originalMethod.apply(this, args)
        }, remaining)
      }
    }
    return descriptor
  }
}

/**
 * @desc 防抖函数 (支持 Promise 返回)
 * @param func {Function} 需要防抖的函数
 * @param delay {number} 延迟时间
 * @param immediate {boolean} 是否立即执行
 * @returns {Function}
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate = false
): (...args: Parameters<T>) => Promise<Awaited<ReturnType<T>>> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let resultPromise: Promise<Awaited<ReturnType<T>>> | null = null
  let resolveRef: ((value: Awaited<ReturnType<T>>) => void) | null = null
  let rejectRef: ((reason?: any) => void) | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this

    if (timeoutId) clearTimeout(timeoutId)

    if (immediate) {
      const callNow = !timeoutId

      if (callNow) {
        resultPromise = new Promise((resolve, reject) => {
          try {
            const result = func.apply(context, args)
            Promise.resolve(result).then(resolve, reject)
          } catch (e) {
            reject(e)
          }
        })
      }

      timeoutId = setTimeout(() => {
        timeoutId = null
        resultPromise = null
      }, delay)

      return resultPromise || (Promise.resolve() as any)
    } else {
      if (!resultPromise) {
        resultPromise = new Promise((resolve, reject) => {
          resolveRef = resolve
          rejectRef = reject
        })
      }

      timeoutId = setTimeout(() => {
        timeoutId = null
        try {
          const result = func.apply(context, args)
          Promise.resolve(result).then(resolveRef, rejectRef)
        } catch (e) {
          rejectRef?.(e)
        }
        resultPromise = null
        resolveRef = null
        rejectRef = null
      }, delay)

      return resultPromise
    }
  }
}

/**
 * @desc 节流函数
 * @param func {Function} 需要节流的函数
 * @param delay {number} 延迟时间
 * @returns {Function}
 */
export function throttle<T extends (...args: any[]) => any>(func: T, delay: number): (...args: Parameters<T>) => void {
  let lastTime = 0
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    const context = this
    const now = Date.now()

    const remaining = delay - (now - lastTime)

    if (remaining <= 0 || remaining > delay) {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      lastTime = now
      func.apply(context, args)
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastTime = Date.now()
        timeoutId = null
        func.apply(context, args)
      }, remaining)
    }
  }
}
