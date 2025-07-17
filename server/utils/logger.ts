import { createLogger, format, transports } from 'winston'
import type { Logger as LoggerType } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import chalk from 'chalk'
import gradient from 'gradient-string'
// import boxen from 'boxen'

interface LoggerOptions {
  fileName: string
  folderName: string
}

// 日志级别对应的emoji和颜色
const LOG_LEVELS = {
  info: { emoji: '✨', color: '#0575E6' },
  error: { emoji: '❌', color: '#FF5252' },
  warn: { emoji: '⚠️', color: '#FFC107' },
  debug: { emoji: '🔍', color: '#4CAF50' }
}

/**
 * @description 日志类
 */
export class Logger {
  /**
   * @description 日志实例
   */
  private logger: LoggerType | null = null

  /**
   * @description 日志路径
   */
  private logPath: string =
    useRuntimeConfig().logPath || 'logs'

  /**
   * @description 日志时间格式
   */
  private logTimeFormat: string =
    useRuntimeConfig().logTimeFormat ||
    'YYYY-MM-DD HH:mm:ss'

  constructor({ fileName, folderName }: LoggerOptions) {
    this._createLogger(fileName, folderName)
  }

  /**
   * @description 创建日志实例
   * @param {string} fileName
   * @param {string} folderName
   * @returns {void}
   */
  private _createLogger(
    fileName: string,
    folderName: string
  ): void {
    this.logger = createLogger({
      transports: [
        new transports.Console({
          // 禁用winston默认的colorize，我们将使用自定义的颜色处理
          format: format.combine(
            format.timestamp({
              format: this.logTimeFormat
            }),
            format.align(),
            format.printf((info) => {
              const { timestamp, level, message, ...args } =
                info
              const ts =
                typeof timestamp === 'string'
                  ? timestamp.slice(0, 19).replace('T', ' ')
                  : ''

              // 获取日志级别对应的样式
              const levelInfo = LOG_LEVELS[
                level as keyof typeof LOG_LEVELS
              ] || { emoji: '📝', color: '#2196F3' }

              // 确保message是字符串类型
              const messageStr = String(message)

              // 使用渐变色处理消息，但只处理纯文本消息，跳过已经包含颜色代码的消息
              let formattedMessage = messageStr
              if (!messageStr.includes('\u001b[')) {
                const customGradient = gradient([
                  levelInfo.color,
                  '#2196F3'
                ])
                formattedMessage =
                  customGradient(messageStr)
              }

              return `${chalk.gray(ts)} ${levelInfo.emoji} [${level}]: ${formattedMessage} ${
                Object.keys(args).length
                  ? JSON.stringify(args, null, 2)
                  : ''
              }`
            })
          )
        })
      ]
    })
    const dirname = `${this.logPath}/${folderName}`
    // 添加自定义配置
    this.logger.add(
      new DailyRotateFile({
        dirname,
        filename: `${fileName}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        // json: false,
        // 保留7天
        maxFiles: '7d',
        // 20M
        maxSize: '20m',
        auditFile: `${dirname}/hash-audit.json`,
        // 压缩
        zippedArchive: true,
        format: format.combine(
          format.timestamp({
            format: this.logTimeFormat
          }),
          format.align(),
          format.printf((info: any) => {
            // 这里可以自定义你的输出格式
            const { timestamp, level, message } = info
            const ts =
              timestamp?.slice(0, 19).replace('T', ' ') ||
              ''
            return `${ts} [${folderName} ${level}]: ${message}`
          })
        )
      })
    )
  }

  /**
   * @description 日志信息
   * @param {string} message
   * @returns {void}
   */
  public info(message: string): void {
    this.logger?.info(chalk.green(message))
  }

  /**
   * @description 错误日志
   * @param {string} message
   * @returns {void}
   */
  public error(message: string): void {
    this.logger?.error(chalk.red(message))
  }

  /**
   * @description 警告日志
   * @param {string} message
   * @returns {void}
   */
  public warn(message: string): void {
    this.logger?.warn(chalk.yellow(message))
  }

  /**
   * @description 调试日志
   * @param {string} message
   * @returns {void}
   */
  public debug(message: string): void {
    this.logger?.debug(chalk.gray(message))
  }
}
