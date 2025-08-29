import dayjs from 'dayjs'

export default defineEventHandler((event) => {
  setHeader(event, 'cache-control', 'no-cache')
  setHeader(event, 'connection', 'keep-alive')
  setHeader(event, 'content-type', 'text/event-stream')
  setResponseStatus(event, 200)

  setInterval(() => {
    event.node.res.write('data: ' + JSON.stringify(dayjs().format('YYYY-MM-DD HH:mm:ss')) + '\n\n')
  }, 3000)

  event._handled = true
})
