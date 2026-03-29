import { handleSendEmailRequest, sendChartEmailSchema } from '@/server/utils/emailRequestHelper'

const logger = new Logger({
  fileName: 'sendChartEmail',
  folderName: 'api'
})

export default defineEventHandler<Promise<ApiResponseI<SendEmailVo.SendEmailOptions>>>(async (event) => {
  return handleSendEmailRequest(event, {
    schema: sendChartEmailSchema,
    logger,
    sceneLabel: '图表邮件',
    defaultErrorMessage: '发送图表邮件失败'
  })
})
