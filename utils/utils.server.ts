/**
 * @desc 用于服务端的工具函数
 */

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
