declare namespace SendEmailDto {
  interface EmailConfig {
    /**
     * 收件人
     */
    to: string
    /**
     * 邮件主题
     */
    subject: string
    /**
     * 额外内容
     */
    additionalContent: string
  }

  interface AnalyseOptions {
    /**
     * 文件名
     */
    filename: string
    /**
     * 图表类型
     */
    chartType: string
    /**
     * 分析名称
     */
    analyseName: string
    /**
     * 分析ID
     */
    analyseId: number
  }

  interface SendChartEmailOptions {
    /**
     * 邮件配置
     */
    emailConfig: EmailConfig
    /**
     * 分析选项
     */
    analyseOptions: AnalyseOptions
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
}

// export = SendEmailDto
// export as namespace SendEmailDto
