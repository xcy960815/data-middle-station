import dayjs from 'dayjs'

/**
 * @desc API 处理器 - eventsource.ts (ALL)
 * @param {H3Event} event H3 请求事件对象
 * @returns {Promise<any> | any} 响应数据
 */
export default defineEventHandler((event) => {
  if (String(useRuntimeConfig().enableDemoPages ?? 'false') !== 'true') {
    throw createError({ statusCode: 404, statusMessage: 'Page Not Found' })
  }

  setHeader(event, 'cache-control', 'no-cache')
  setHeader(event, 'connection', 'keep-alive')
  setHeader(event, 'content-type', 'text/event-stream')
  setResponseStatus(event, 200)

  const intervalId = setInterval(() => {
    if (event.node.res.writableEnded) {
      clearInterval(intervalId)
      return
    }
    event.node.res.write('data: ' + JSON.stringify(dayjs().format('YYYY-MM-DD HH:mm:ss')) + '\n\n')
  }, 3000)

  const cleanup = () => {
    clearInterval(intervalId)
  }
  event.node.req.on('close', cleanup)
  event.node.res.on('close', cleanup)

  event._handled = true
})
