

/**
 * @desc 判断是否为Chrome浏览器
 * @returns boolean
 */
export const isChrome = (): boolean => {
  const ua = navigator.userAgent.toLowerCase();
  return ua.indexOf('chrome') > -1;
};

/**
 * @desc 休眠函数
 * @param {number} timer
 * @returns Promise<void>
 */
export function clienSleep(timer: number): Promise<void> {
  return new Promise<void>((resolved) => {
    setTimeout(() => {
      resolved();
    }, timer);
  });
}




