/**
 * 邮件模块当前支持生成快照并外发的图表类型。
 */
export const MAIL_SUPPORTED_CHART_TYPES = ['line', 'bar', 'pie', 'interval'] as const

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 将收件人输入统一规整为邮箱数组。
 * 支持字符串、数组，以及逗号/分号分隔的混合输入。
 */
export function normalizeEmailRecipients(recipients?: string | string[] | null): string[] {
  if (!recipients) {
    return []
  }

  const rawRecipients = Array.isArray(recipients)
    ? recipients.flatMap((item) => item.split(/[,;]/))
    : recipients.split(/[,;]/)

  return Array.from(new Set(rawRecipients.map((item) => item.trim()).filter(Boolean)))
}

/**
 * 校验收件人输入是否合法，并返回规整后的邮箱列表。
 */
export function validateEmailRecipients(recipients?: string | string[] | null): {
  valid: boolean
  recipients: string[]
  invalidRecipients: string[]
} {
  const normalizedRecipients = normalizeEmailRecipients(recipients)
  const invalidRecipients = normalizedRecipients.filter((item) => !EMAIL_ADDRESS_PATTERN.test(item))

  return {
    valid: normalizedRecipients.length > 0 && invalidRecipients.length === 0,
    recipients: normalizedRecipients,
    invalidRecipients
  }
}

/**
 * 判断某个图表类型是否支持邮件发送。
 */
export function isMailSupportedChartType(chartType?: string | null): boolean {
  if (!chartType) {
    return false
  }

  return MAIL_SUPPORTED_CHART_TYPES.includes(chartType as (typeof MAIL_SUPPORTED_CHART_TYPES)[number])
}

/**
 * 为不支持的图表类型生成统一的用户提示文案。
 */
export function getUnsupportedMailChartTypeMessage(chartType?: string | null): string {
  if (!chartType) {
    return `邮件功能仅支持 ${MAIL_SUPPORTED_CHART_TYPES.join('/')} 图表`
  }

  return `邮件功能暂不支持 ${chartType} 图表，请使用 ${MAIL_SUPPORTED_CHART_TYPES.join('/')} 图表`
}
