/**
 * @desc 邮件发件人画像 (Mailer Profile)
 *
 * 抽出此模块的动机：
 *  - `SendEmailService` 负责"发送邮件"，`ScheduledEmailLogService` 负责"记录日志"
 *  - 但 LogService 写日志时需要拿到发件人地址、传输通道、SMTP 主机端口等信息
 *  - 原实现里 LogService 直接 `new SendEmailService()` 仅为读这几个属性
 *    → 造成反向依赖、重复实例化、循环风险
 *
 * 本模块将这些"只读元数据"从 SendEmailService 中解耦出来，
 * Send 与 Log 双方都依赖此模块，依赖方向清晰单向。
 */

/**
 * @desc 邮件传输通道
 *  - smtp:  非加密 SMTP（一般 25/587）
 *  - smtps: 隐式 TLS（一般 465）
 */
export type MailerChannel = 'smtp' | 'smtps'

/**
 * @desc 传输层元数据（SMTP 主机/端口/是否加密）
 */
export interface MailerTransportInfo {
  host: string
  port: number
  secure: boolean
}

/**
 * @desc 发件人画像（只读视图）
 */
export interface MailerProfile {
  /** 发件人地址（FROM 头） */
  senderAddress: string
  /** 传输通道标识，用于日志统计/分类 */
  channel: MailerChannel
  /** 传输层元数据 */
  transport: MailerTransportInfo
}

/**
 * @desc 从 runtimeConfig 解析当前进程的邮件发件人画像
 *
 * 设计要点：
 *  - 纯函数，无副作用，可在任何 Nitro 上下文中调用
 *  - 不持有 transporter / 不发邮件，仅暴露只读元数据
 *  - 与 `SendEmailService` 共用同一份解析逻辑，避免两边漂移
 */
export const resolveMailerProfile = (): MailerProfile => {
  const runtimeConfig = useRuntimeConfig()

  const senderAddress = runtimeConfig.smtpFrom || runtimeConfig.smtpUser || 'system@unknown'
  const host = runtimeConfig.smtpHost || ''
  const port = runtimeConfig.smtpPort ? Number(runtimeConfig.smtpPort) : 465
  const secure = String(runtimeConfig.smtpSecure || 'true') === 'true'
  const channel: MailerChannel = secure ? 'smtps' : 'smtp'

  return {
    senderAddress,
    channel,
    transport: { host, port, secure }
  }
}
