/**
 * @desc 用于服务端的工具函数
 */

/**
 * @desc 设置process.env的属性
 * @param { keyof NodeJS.ProcessEnv } propertieKey
 * @param { NodeJS.ProcessEnv[keyof NodeJS.ProcessEnv]} propertieValue
 * @returns {void}
 */
export const setProcessEnvProperties = <
  T extends keyof NodeJS.ProcessEnv
>(
  propertieKey: T,
  propertieValue: NodeJS.ProcessEnv[T]
): void => {
  const env: NodeJS.ProcessEnv = process.env || {}
  env[propertieKey] = propertieValue
  process.env = env
}

/**
 * @desc 获取process.env的属性
 */
export const getProcessEnvProperties = <
  T extends keyof NodeJS.ProcessEnv
>(
  propertieKey: T | undefined
): T extends undefined
  ? NodeJS.ProcessEnv
  : NodeJS.ProcessEnv[T] => {
  const env = process.env
  if (propertieKey) {
    return env[propertieKey] as T extends undefined
      ? NodeJS.ProcessEnv
      : NodeJS.ProcessEnv[T]
  }
  return env as T extends undefined
    ? NodeJS.ProcessEnv
    : NodeJS.ProcessEnv[T]
}

/**
 * @desc 将对象中的key转换为下划线格式 用于数据库新建、更新的时候使用
 * @param inputRecord { Record<string, any> }
 * @returns { keys: string[], values: any[] }
 */
export function transformObjectIntoSet(
  inputRecord: Record<string, any>
) {
  const entries = Object.entries(inputRecord)
    .filter(([, value]) => typeof value !== 'undefined')
    .map(([key, value]) => {
      const transformedKey = key.replace(
        /([A-Z])/g,
        (_, c) => `_${c.toLowerCase()}`
      )
      return {
        key: `${transformedKey} = ?`,
        value
      }
    })

  return {
    keys: entries.map((entry) => entry.key),
    values: entries.map((entry) => entry.value)
  }
}

/**
 * @desc 响应公共模块 提供静态的Response类
 */

export class Response {
  static success<T>(data: T): ResponseModule.Response<T> {
    return {
      code: 200,
      data,
      message: 'success'
    }
  }
  static error<T>(
    message: string
  ): ResponseModule.Response<T> {
    return {
      code: 500,
      data: null,
      message
    }
  }
}

/**
 * @desc 下划线转驼峰
 * @param name {string} 下划线字符串
 * @returns {string}
 */
export const toHump = (name: string) => {
  return name.replace(/\_(\w)/g, function (all, letter) {
    return letter.toUpperCase()
  })
}

/**
 * @desc 驼峰转下划线
 * @param name {string} 驼峰字符串
 * @returns {string}
 */
export const toLine = (name: string) => {
  return name.replace(/([A-Z])/g, '_$1').toLowerCase()
}

const specialKeys = ['order', 'group']

/**
 * @desc 获取对象的属性
 * @param rowData {Object}
 * @returns {{keys: string[], values: (string | number)[]}}}
 */
export function convertToSqlProperties<
  T extends { [key: string]: any }
>(
  rowData: T
): { keys: string[]; values: (string | number)[] } {
  const keys: string[] = []
  const values: (string | number)[] = []
  for (let k in rowData) {
    if (typeof rowData[k] !== 'undefined') {
      const value = rowData[k]
      // 将 k 由 驼峰 转为 下划线
      const underlineKey = k
        .replace(/([A-Z])/g, '_$1')
        .toLowerCase()
      // order group 字段单独处理一下
      if (
        specialKeys.includes(underlineKey) &&
        typeof value === 'string'
      ) {
        keys.push('\`' + underlineKey + '\`')
      } else {
        keys.push(underlineKey)
      }
      if (typeof value === 'object' && value !== null) {
        values.push(JSON.stringify(value))
      } else {
        values.push(value)
      }
    }
  }
  return {
    keys,
    values
  }
}

/**
 * @desc 休眠函数
 * @param {number} timer
 * @returns Promise<void>
 */
export function serverSleep(timer: number): Promise<void> {
  return new Promise<void>((resolved) => {
    setTimeout(() => {
      resolved()
    }, timer)
  })
}

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
