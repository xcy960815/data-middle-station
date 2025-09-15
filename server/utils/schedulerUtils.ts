/**
 * 调度器工具函数
 */

/**
 * 计算重复任务的下次执行时间
 * @param recurringDays 重复日期数组 (0=周日, 1=周一, ..., 6=周六)
 * @param recurringTime 重复时间 (HH:mm 格式)
 * @param currentTime 当前时间（可选，默认为当前时间）
 * @returns 下次执行时间的ISO字符串，如果无效则返回null
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

      return targetDate.toISOString()
    }
  }

  return null
}

/**
 * 计算定时任务的执行时间（用于验证）
 * @param scheduleTime ISO时间字符串
 * @returns 执行时间的Date对象，如果无效则返回null
 */
export function parseScheduleTime(scheduleTime: string): Date | null {
  try {
    const date = new Date(scheduleTime)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * 检查任务是否应该执行
 * @param nextExecutionTime 下次执行时间
 * @param currentTime 当前时间（可选）
 * @param toleranceMs 容忍的时间误差（毫秒），默认30秒
 * @returns 是否应该执行
 */
export function shouldExecuteTask(
  nextExecutionTime: string | null,
  currentTime?: Date,
  toleranceMs: number = 30000
): boolean {
  if (!nextExecutionTime) return false

  const now = currentTime || new Date()
  const executeTime = new Date(nextExecutionTime)

  if (isNaN(executeTime.getTime())) return false

  const timeDiff = now.getTime() - executeTime.getTime()

  // 时间在容忍范围内（可以是提前或延后）
  return timeDiff >= 0 && timeDiff <= toleranceMs
}

/**
 * 格式化执行时间为中文显示
 * @param executionTime ISO时间字符串
 * @returns 格式化的时间字符串
 */
export function formatExecutionTime(executionTime: string | null): string {
  if (!executionTime) return '未设置'

  try {
    const date = new Date(executionTime)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short'
    })
  } catch {
    return '无效时间'
  }
}

/**
 * 获取星期几的中文名称
 * @param dayOfWeek 星期几 (0=周日, 1=周一, ..., 6=周六)
 * @returns 中文星期名称
 */
export function getDayName(dayOfWeek: number): string {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return dayNames[dayOfWeek] || '未知'
}

/**
 * 将重复日期数组转换为中文显示
 * @param recurringDays 重复日期数组
 * @returns 中文星期名称字符串
 */
export function formatRecurringDays(recurringDays: number[] | null): string {
  if (!recurringDays || recurringDays.length === 0) return '无'

  return recurringDays
    .sort((a, b) => a - b)
    .map((day) => getDayName(day))
    .join('、')
}
