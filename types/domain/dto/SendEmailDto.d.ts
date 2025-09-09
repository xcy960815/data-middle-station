/**
 * 发送邮件相关的类型定义
 * 使用 namespace 组织图表邮件功能的类型
 */

declare namespace SendEmailDto {
  /**
   * 图表实例类型
   */
  interface ChartInstance {
    id: string
    type: 'line' | 'bar' | 'pie' | 'table' | 'scatter'
    title: string
    data: any
    config: any
  }

  /**
   * 图表导出选项
   */
  interface ChartExportOptions {
    width?: number
    height?: number
    format?: 'png' | 'jpeg' | 'pdf'
    type?: 'image/png' | 'image/jpeg'
    quality?: number
    backgroundColor?: string
    scale?: number
  }

  /**
   * 图表组件引用接口
   * 定义图表组件必须提供的导出方法
   */
  interface ChartComponentRef {
    exportAsImage: (options?: ChartExportOptions) => Promise<string>
    downloadChart: (filename: string, options?: ChartExportOptions) => Promise<void>
  }

  /**
   * 邮件发送图表选项
   */
  interface EmailChartOptions {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body?: string
    additionalContent?: string
    attachmentName?: string
    exportOptions?: ChartExportOptions
  }

  /**
   * 发送图表邮件的请求接口
   */
  interface SendChartEmailRequest {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    body?: string
    additionalContent?: string
    charts: Array<{
      id: string
      title: string
      imageData?: string
      base64Image?: string
      filename: string
    }>
    attachments?: Array<{
      filename: string
      content: string
      contentType: string
    }>
  }

  /**
   * 通用邮件发送选项
   */
  interface SendEmailDtoOption {
    to: string[]
    cc?: string[]
    bcc?: string[]
    subject: string
    html?: string
    text?: string
    attachments?: Array<{
      filename: string
      content: string
      contentType: string
    }>
  }

  /**
   * 邮件服务发送选项（支持更灵活的类型）
   */
  interface SendMailOptions {
    to: string | string[]
    subject: string
    html?: string
    text?: string
    cc?: string | string[]
    bcc?: string | string[]
    attachments?: Array<{ filename: string; content: Buffer | string; contentType?: string }>
  }
}

// export = SendEmailDto
// export as namespace SendEmailDto
