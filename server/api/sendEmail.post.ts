import { handleSendEmailRequest, sendEmailSchema } from '@/server/utils/emailRequestHelper'

const logger = new Logger({
  fileName: 'sendEmail',
  folderName: 'api'
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  return handleSendEmailRequest(event, {
    schema: sendEmailSchema,
    logger,
    sceneLabel: '邮件',
    defaultErrorMessage: '发送邮件失败',
    logManualSend: true
  })
})
