declare namespace SendEmailDto {
  /**
   * 通用邮件发送选项（统一版本）
   */
  interface SendEmailOptions {
    to: string | string[]
    cc?: string | string[]
    bcc?: string | string[]
    subject: string
    html?: string
    text?: string
    attachments?: Array<{
      filename: string
      content: Buffer | string
      contentType?: string
    }>
  }

  /**
   * 图表邮件发送特定选项
   */
  interface SendChartEmailOptions extends Omit<SendEmailOptions, 'attachments'> {
    body?: string
    additionalContent?: string
    chart: ChartExportData
    exportOptions?: ExportChartOptions
    attachments?: SendEmailOptions['attachments']
  }
}

// export = SendEmailDto
// export as namespace SendEmailDto
