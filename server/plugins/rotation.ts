/**
 * 调度插件专用日志实例
 * @type {Logger}
 */
const logger = new Logger({
  fileName: 'rotation',
  folderName: 'plugins'
})

/**
 * 预留给非邮件类周期任务的插件。
 * 当前没有已启用任务，避免启动空轮询造成日志噪音和无法显式清理的递归定时器。
 * @param {NitroApp} nitroApp Nitro 应用对象
 * @returns {void}
 */
export default defineNitroPlugin(() => {
  logger.info('其他调度任务插件已加载，当前无启用任务')
})
