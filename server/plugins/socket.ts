import { Server } from 'socket.io'
import chalk from 'chalk'

/**
 * @desc Socket.io 长连接
 * @link https://github.com/nuxt/nuxt/pull/19230
 * @returns {void}
 */
export default defineNitroPlugin(() => {
  const io = new Server(3001, {
    serveClient: false,
    cors: {
      origin: '*'
    }
  })
  // 监听客户端的消息
  io.on('connect', (socket) => {
    console.log(chalk.green('客户端已连接'))
    const intervalID = setInterval(() => {
      // 在这里执行你想要定时进行的动作
      socket.emit('message', `服务端传递的数据 ${Date.now()}`)
      console.log(chalk.green(`服务端传递的数据 ${Date.now()}`))
    }, 3000)
    socket.on('disconnecting', () => {
      // 当客户端断开连接时, 确保定时器也停止
      clearInterval(intervalID)
      console.log(chalk.green('客户端已断开连接'))
    })
  })
})
