declare namespace SendEmailDto {
  interface EmailConfig {
    /**
     * 收件人 (支持单个或多个邮箱地址，多个用逗号分隔)
     */
    to: string | string[]
    /**
     * 邮件主题
     */
    subject: string
    /**
     * 额外内容
     */
    additionalContent: string
  }

  interface AnalyzeOptions {
    /**
     * 文件名
     */
    filename?: string
    /**
     * 文件内容 (Buffer或base64字符串)
     */
    fileContent?: Buffer | string
    /**
     * 文件路径 (可选，优先使用fileContent)
     */
    filePath?: string
    /**
     * 图表类型
     */
    chartType?: string
    /**
     * 分析名称
     */
    analyzeName?: string
    /**
     * 分析ID
     */
    analyzeId: number
  }

  interface SendChartEmailOptions {
    /**
     * 邮件配置
     */
    emailConfig: EmailConfig
    /**
     * 分析选项
     */
    analyzeOptions: AnalyzeOptions
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

  interface SendEmailResultDto extends SendEmailDao.SendEmailOptions {
    sender?: string
    channel?: string
  }
}

// export = SendEmailDto
// export as namespace SendEmailDto
