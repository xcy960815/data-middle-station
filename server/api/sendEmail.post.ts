import { SendEmailService } from '../service/sendEmailService'
const sendEmailService = new SendEmailService()

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

export default defineEventHandler(async (event) => {
  const body = await readBody<SendEmailDto.SendEmailOptions>(event)
  const { to, subject, html, text, cc, bcc, attachments } = body

  try {
    const sendEmailResult = await sendEmailService.sendMail({
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      attachments
    })

    return CustomResponse.success(sendEmailResult)
  } catch (error: any) {
    logger.error('发送邮件失败' + error.message)
    return CustomResponse.error(error.message)
  }
})
