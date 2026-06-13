import chalk from 'chalk'
import gradient from 'gradient-string'
import type { Logger as LoggerType } from 'winston'
import { createLogger, format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
// import boxen from 'boxen'

interface LoggerOptions {
  fileName: string
  folderName: string
}

// 扩展的日志信息接口，包含自定义字段
interface ExtendedLogInfo {
  timestamp?: string | Date
  level: string
  message: string | unknown
  caller?: string
  [key: string]: unknown
}

// 日志级别对应的emoji和颜色
const LOG_LEVELS = {
  info: { emoji: '✨', color: '#0575E6' },
  error: { emoji: '❌', color: '#FF5252' },
  warn: { emoji: '⚠️', color: '#FFC107' },
  debug: { emoji: '🔍', color: '#4CAF50' }
}

/**
 * 获取日志调用位置信息
 * @returns {string} 调用位置信息
 */
function getCallerInfo(): string {
  // const stackLines = new Error().stack?.split('\n') || []
  // // 跳过前三行 (Error, getCallerInfo, 当前日志方法)
  // const callerLine = stackLines[3] || ''
  // // 提取文件路径和行号
  // const match = callerLine.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/) ||
  //   callerLine.match(/at\s+(.+):(\d+):(\d+)/)

  // if (match) {
  //   if (match.length === 5) {
  //     // 格式: at functionName (filePath:line:column)
  //     const [, fnName, filePath, line] = match
  //     const filePathParts = filePath.split('/')
  //     const fileName = filePathParts[filePathParts.length - 1]
  //     return `${fnName} (${fileName}:${line})`
  //   } else if (match.length === 4) {
  //     // 格式: at filePath:line:column
  //     const [, filePath, line] = match
  //     const filePathParts = filePath.split('/')
  //     const fileName = filePathParts[filePathParts.length - 1]
  //     return `${fileName}:${line}`
  //   }
  // }

  // return 'unknown location'
  return ''
}

/**
 * 通用日志处理类，支持控制台彩色输出与基于文件的每日轮转日志
 */
export class Logger {
  /**
   * winston 日志实例对象
   * @type {LoggerType | null}
   * @private
   */
  private logger: LoggerType | null = null

  /**
   * 日志文件存放根目录路径
   * @type {string}
   * @private
   */
  private logPath: string = useRuntimeConfig().logPath || 'logs'

  /**
   * 日志中的时间格式串
   * @type {string}
   * @private
   */
  private logTimeFormat: string = useRuntimeConfig().logTimeFormat || 'YYYY-MM-DD HH:mm:ss'

  /**
   * 构造函数，初始化并创建指定文件名和目录的日志实例
   * @param {LoggerOptions} options 初始化参数，包含文件名与分类目录名
   */
  constructor({ fileName, folderName }: LoggerOptions) {
    this._createLogger(fileName, folderName)
  }

  /**
   * 创建并配置 winston 日志器实例（包含控制台 Transport 和按天轮转文件 Transport）
   * @param {string} fileName 日志文件名模板
   * @param {string} folderName 日志存放子文件夹名称
   * @returns {void}
   * @private
   */
  private _createLogger(fileName: string, folderName: string): void {
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
              const logInfo = info as ExtendedLogInfo
              const { timestamp, level, message, caller, ...args } = logInfo
              const ts = typeof timestamp === 'string' ? timestamp.slice(0, 19).replace('T', ' ') : ''

              // 获取日志级别对应的样式
              const levelInfo = LOG_LEVELS[level as keyof typeof LOG_LEVELS] || { emoji: '📝', color: '#2196F3' }

              // 确保message是字符串类型
              const messageStr = String(message)

              // 使用渐变色处理消息，但只处理纯文本消息，跳过已经包含颜色代码的消息
              let formattedMessage = messageStr
              if (!messageStr.includes('\u001b[')) {
                const customGradient = gradient([levelInfo.color, '#2196F3'])
                formattedMessage = customGradient(messageStr)
              }

              // 添加调用位置信息
              const callerInfo = caller ? chalk.gray(`[${caller}]`) : ''

              return `${chalk.gray(ts)} ${levelInfo.emoji} [${level}]: ${formattedMessage} ${callerInfo} ${
                Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
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
          format.printf((info) => {
            // 这里可以自定义你的输出格式
            const logInfo = info as ExtendedLogInfo
            const { timestamp, level, message, caller } = logInfo
            const ts = timestamp
              ? typeof timestamp === 'string'
                ? timestamp.slice(0, 19).replace('T', ' ')
                : String(timestamp).slice(0, 19).replace('T', ' ')
              : ''
            const callerInfo = caller ? `[${caller}]` : ''
            return `${ts} [${folderName} ${level}]: ${message} ${callerInfo}`
          })
        )
      })
    )
  }

  /**
   * 记录信息（info）级别的日志
   * @param {string} message 日志文本信息
   * @returns {void}
   */
  public info(message: string): void {
    const caller = getCallerInfo()
    this.logger?.info({ message: chalk.green(message), caller })
  }

  /**
   * 记录错误（error）级别的日志
   * @param {string} message 错误文本信息
   * @returns {void}
   */
  public error(message: string): void {
    const caller = getCallerInfo()
    this.logger?.error({ message: chalk.red(message), caller })
  }

  /**
   * 记录警告（warn）级别的日志
   * @param {string} message 警告文本信息
   * @returns {void}
   */
  public warn(message: string): void {
    const caller = getCallerInfo()
    this.logger?.warn({ message: chalk.yellow(message), caller })
  }

  /**
   * 记录调试（debug）级别的日志
   * @param {string} message 调试文本信息
   * @returns {void}
   */
  public debug(message: string): void {
    const caller = getCallerInfo()
    this.logger?.debug({ message: chalk.gray(message), caller })
  }
}
