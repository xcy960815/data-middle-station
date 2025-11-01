/**
 * @desc 发送邮件结果
 */
declare namespace SendEmailVo {
  /**
   * @desc 发送邮件结果
   */
  type SendEmailResponse = {
    /** 邮件消息ID */
    messageId: string
    /**
     * 成功接收的邮箱地址列表
     */
    accepted?: (string | { name?: string; address: string })[]
    /**
     * 被拒绝的邮箱地址列表
     */
    rejected?: (string | { name?: string; address: string })[]
    /**
     * SMTP服务器支持的扩展功能列表
     */
    ehlo?: string[]
    /**
     * 信封传输时间(毫秒)
     */
    envelopeTime?: number
    /**
     * 消息传输时间(毫秒)
     */
    messageTime?: number
    /**
     * 消息大小(字节)
     */
    messageSize?: number
    /**
     * 服务器响应信息
     */
    response?: string
    /**
     * 信封信息
     */
    envelope?: {
      /**
       * 发件人地址
       */
      from: string | false
      /**
       * 收件人地址列表
       */
      to: string[]
    }
  }
}
