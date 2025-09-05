/* global SendEmailDto */
import { EmailService } from '../service/emailService'

export default defineEventHandler(async (event) => {
  const body = await readBody<SendEmailDto.SendEmailOption>(event)
  const { to, subject, html, text, cc, bcc, attachments } = body || {}

  if (!to || !subject) {
    throw createError({ statusCode: 400, statusMessage: '"to" 和 "subject" 为必填项' })
  }

  const emailService = new EmailService()
  const messageId = await emailService.sendMail({
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    attachments
  })

  return { messageId }
})
