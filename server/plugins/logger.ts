import { createLogger, format, transports } from 'winston'
import type { Logger as LoggerType } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { getProcessEnvProperties } from '~/utils/utils.server'

/**
 * @description 日志类
 */
export class Logger {
  /**
   * @description 日志实例
   */
  private logger: LoggerType | null = null

  constructor({
    fileName,
    folderName
  }: LoggerModule.LoggerOptions) {
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
    const logTimeFormat =
      getProcessEnvProperties('LOG_TIME_FORMAT') ||
      'YYYY-MM-DD HH:mm:ss'
    this.logger = createLogger({
      transports: [
        new transports.Console({
          // json: true,
          format: format.combine(
            format.colorize(),
            format.timestamp({
              format: logTimeFormat
            }),
            format.align(),
            format.printf((info) => {
              const { timestamp, level, message, ...args } =
                info
              // @ts-ignore
              const ts =
                timestamp?.slice(0, 19).replace('T', ' ') ||
                ''
              return `${ts} [${level}]: ${message} ${
                Object.keys(args).length
                  ? JSON.stringify(args, null, 2)
                  : ''
              }`
            })
          )
        })
      ]
    })
    const logPath =
      getProcessEnvProperties('LOG_PATH') || 'logs'
    const dirname = `${logPath}/${folderName}`
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
            format: logTimeFormat
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
    this.logger?.info(message)
  }

  /**
   * @description 错误日志
   * @param {string} message
   * @returns {void}
   */
  public error(message: string): void {
    this.logger?.error(message)
  }

  /**
   * @description 警告日志
   * @param {string} message
   * @returns {void}
   */
  public warn(message: string): void {
    this.logger?.warn(message)
  }

  /**
   * @description 调试日志
   * @param {string} message
   * @returns {void}
   */
  public debug(message: string): void {
    this.logger?.debug(message)
  }
}
