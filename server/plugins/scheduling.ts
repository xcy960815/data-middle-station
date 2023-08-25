import chalk from 'chalk';
import cron from 'node-cron';
import dayjs from 'dayjs';
const logger = new Logger({ fileName: 'scheduling', folderName: 'plugins' });
/**
 * @desc 调度任务类型
 * @link https://juejin.cn/post/6998158614963683358
 */
export default defineNitroPlugin(() => {
  // ┌────────────── second (可选)
  // │ ┌──────────── 分钟 (minute，0 - 59)
  // │ │ ┌────────── 小时 (hour，0 - 23)
  // │ │ │ ┌──────── 一个月中的第几天 (day of month，1 - 31)
  // │ │ │ │ ┌────── 月份 (month，1 - 12)
  // │ │ │ │ │ ┌──── 一个星期中星期几 (day of week，0 - 6) 注意：星期天为 0
  // │ │ │ │ │ │
  // │ │ │ │ │ │
  // * * * * * *
  cron.schedule('* * * * *', () => {
    logger.info(
      `${'每分钟执行一次调度任务'}${
        '当前时间为' + dayjs(Date.now()).format('YYYY-MM-DDTHH:mm:ss')
      }`,
    );
  });
});
