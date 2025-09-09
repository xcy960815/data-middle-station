import { EmailService } from '../service/emailService'

export default defineEventHandler(async (event) => {
  const body = await readBody<SendEmailDto.SendEmailDtoOption>(event)
  const { to, subject, html, text, cc, bcc, attachments } = body || {}
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
