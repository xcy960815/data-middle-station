import dayjs from 'dayjs'

/**
 * 调度器工具函数
 */

/**
 * 计算循环（重复）定时任务的下一次实际执行时间
 * @param {number[]} recurringDays 重复执行的星期天数数组 (0代表周日, 1-6代表周一至周六)
 * @param {string} recurringTime 重复执行的每天时刻 (HH:mm 格式，如 "08:30")
 * @param {Date} [currentTime] 用于计算的当前时间基准，默认使用当前系统时间
 * @returns {string | null} 格式化后的下次执行时间字符串 (YYYY-MM-DD HH:mm:ss)；如果配置无效或无法计算，则返回 null
 */
export function calculateNextExecutionTime(
  recurringDays: number[],
  recurringTime: string,
  currentTime?: Date
): string | null {
  if (!recurringDays || recurringDays.length === 0 || !recurringTime) {
    return null
  }

  // 验证时间格式
  const timeMatch = recurringTime.match(/^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/)
  if (!timeMatch) {
    return null
  }

  const now = currentTime || new Date()
  const today = now.getDay() // 0=周日, 1=周一, ..., 6=周六
  const currentTime24 = now.getHours() * 60 + now.getMinutes()

  const [targetHour, targetMinute] = recurringTime.split(':').map(Number)
  const targetTime24 = targetHour * 60 + targetMinute

  // 验证重复日期
  const validDays = recurringDays.filter((day) => day >= 0 && day <= 6)
  if (validDays.length === 0) {
    return null
  }

  // 找到下一个执行时间
  for (let i = 0; i < 7; i++) {
    const checkDay = (today + i) % 7

    if (validDays.includes(checkDay)) {
      // 如果是今天，需要检查时间是否已过
      if (i === 0 && currentTime24 >= targetTime24) {
        continue // 今天的时间已过，检查下一个匹配日期
      }

      // 计算目标日期
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + i)
      targetDate.setHours(targetHour, targetMinute, 0, 0)

      return dayjs(targetDate).format('YYYY-MM-DD HH:mm:ss')
    }
  }

  return null
}
