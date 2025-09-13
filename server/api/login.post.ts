import chalk from 'chalk'

const logger = new Logger({
  fileName: 'login',
  folderName: 'api'
})
/**
 * 默认用户密码
 */
const USER_NAME = 'admin'
const PASSWORD = '123456'
export const AVATAR = 'https://64.media.tumblr.com/d15e5f21577f659a395d84e49f4d75dc/tumblr_oo4411ye0h1si8vfyo1_1280.gif'
/**
 * 登录API
 */
export default defineEventHandler<Promise<ApiResponseI<LoginVo.LoginOption>>>(async (event) => {
  try {
    // 获取请求体数据
    const body = await readBody<LoginDto.LoginRequest>(event)
    /**
     * @desc 判断用户名和密码是否为空
     */
    if (!body.userName || !body.password) {
      return ApiResponse.error('用户名和密码不能为空')
    }
    /**
     * @desc 判断用户名和密码是否正确
     */
    if (body.userName === USER_NAME && body.password === PASSWORD) {
      /**
       * @desc 生成token
       */
      const token = JwtUtils.generateToken({
        userId: '1',
        userName: body.userName
      })
      /**
       * @desc 设置用户id
       */
      RedisStorage.setItem(`userId`, '1', 60 * 60 * 24 * 7)
      /**
       * @desc 设置username
       */
      RedisStorage.setItem(`userName`, body.userName, 60 * 60 * 24 * 7)
      /**
       * @desc 设置token
       */
      RedisStorage.setItem(`token`, token, 60 * 60 * 24 * 7)
      /**
       * @desc 设置cookie
       */
      setCookie(event, JwtUtils.TOKEN_NAME, token, {
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7
      })

      return ApiResponse.success({
        userId: '1',
        userName: body.userName
      })
    } else {
      logger.warn(chalk.yellow(`用户 ${body.userName} 登录失败: 用户名或密码错误`))
      return ApiResponse.error('用户名或密码错误')
    }
  } catch (error) {
    const err = error as Error
    logger.error(chalk.red(`登录异常: ${err.message}`))
    return ApiResponse.error('服务器内部错误')
  }
})
