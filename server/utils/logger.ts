import { createLogger, format, transports } from 'winston';
import type { Logger as LoggerType } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

/**
 * @description 日志类
 */
export class Logger {
  private logger: LoggerType = createLogger({
    transports: [
      // 在项目中使用的是这个
      new transports.Console({
        // json: true,
        format: format.combine(
          format.colorize(),
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          format.align(),
          format.printf((info) => {
            const { timestamp, level, message, ...args } = info;
            const ts = timestamp.slice(0, 19).replace('T', ' ');
            return `${ts} [${level}]: ${message} ${
              Object.keys(args).length ? JSON.stringify(args, null, 2) : ''
            }`;
          }),
        ),
      }),
    ],
  });

  constructor({ fileName, folderName }: LoggerModule.LoggerOptions) {
    // 添加自定义配置
    this.logger.add(
      new DailyRotateFile({
        dirname: `logs/${folderName}`,
        filename: `${fileName}-%DATE%.log`,
        datePattern: 'YYYY-MM-DD',
        // json: false,
        // 保留7天
        maxFiles: '7d',
        // 20M
        maxSize: '20m',
        auditFile: `logs/${folderName}/hash-audit.json`,
        // 压缩
        zippedArchive: true,
        format: format.combine(
          format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
          }),
          format.align(),
          format.printf((info) => {
            // 这里可以自定义你的输出格式
            const { timestamp, level, message } = info;
            const ts = timestamp.slice(0, 19).replace('T', ' ');
            return `${ts} [${folderName} ${level}]: ${message}`;
          }),
        ),
      }),
    );
  }

  public info(message: string): void {
    this.logger.info(message);
  }

  public error(message: string): void {
    this.logger.error(message);
  }

  public warn(message: string): void {
    this.logger.warn(message);
  }

  public debug(message: string): void {
    this.logger.debug(message);
  }
}
