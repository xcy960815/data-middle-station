import chalk from 'chalk'

const logger = new Logger({
  fileName: 'login',
  folderName: 'api'
})

const USER_NAME = 'admin'
const PASSWORD = '123456'
/**
 * 登录API
 */
export default defineEventHandler<Promise<ApiResponse<LoginVo.LoginOption>>>(async (event) => {
  try {
    // 获取请求体数据
    const body = await readBody<LoginDto.LoginOption>(event)
    /**
     * @desc 判断用户名和密码是否为空
     */
    if (!body.username || !body.password) {
      return CustomResponse.error('用户名和密码不能为空')
    }
    /**
     * @desc 判断用户名和密码是否正确
     */
    if (body.username === USER_NAME && body.password === PASSWORD) {
      /**
       * @desc 生成token
       */
      const token = JwtUtils.generateToken({
        userId: '1',
        username: body.username
      })
      /**
       * @desc 存放到 redis中
       */
      RedisStorage.setItem(`username:${body.username}`, token, 60 * 60 * 24 * 7)
      /**
       * @desc 设置token
       */
      RedisStorage.setItem(`token:${body.username}`, token, 60 * 60 * 24 * 7)
      /**
       * @desc 设置cookie
       */
      setCookie(event, JwtUtils.TOKEN_NAME, token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7
      })
      return CustomResponse.success({
        userId: '1',
        username: body.username,
        avatar: 'https://avatars.githubusercontent.com/u/18083515?v=4'
      })
    } else {
      logger.warn(chalk.yellow(`用户 ${body.username} 登录失败: 用户名或密码错误`))
      return CustomResponse.error('用户名或密码错误')
    }
  } catch (error) {
    const err = error as Error
    logger.error(chalk.red(`登录异常: ${err.message}`))
    return CustomResponse.error('服务器内部错误')
  }
})
