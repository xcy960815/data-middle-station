/**
 * @desc 发送邮件
 */

declare namespace SendEmailDto {
  type SendEmailOption = {
    to: string
    subject: string
    html: string
    text?: string
    cc?: string | string[]
    bcc?: string | string[]
    attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>
  }
}
