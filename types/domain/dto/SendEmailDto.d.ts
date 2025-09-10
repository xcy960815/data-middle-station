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
    chart: ChartEmailExportData
    exportOptions?: ExportChartConfigs
    attachments?: SendEmailOptions['attachments']
  }

  /**
   * 图表导出配置
   */
  export interface ExportChartConfigs {
    type?: 'image/png' | 'image/jpeg'
    quality?: number
    width?: number
    height?: number
    backgroundColor?: string
    scale?: number
  }

  /**
   * 图表邮件导出接口
   */
  export interface ChartEmailExportData {
    chartId: string
    title: string
    base64Image: string
    filename: string
  }
}

// export = SendEmailDto
// export as namespace SendEmailDto
