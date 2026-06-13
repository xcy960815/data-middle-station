import { BaseMapper } from '@/server/mapper/baseMapper'
import type { ResultSetHeader } from 'mysql2'

/**
 * 用户模块所使用的数据源名称
 */
const DATA_SOURCE_NAME = 'data_middle_station'

/**
 * 用户数据表名称
 */
const USER_TABLE_NAME = '`user`'

/**
 * 用户与角色关联关系表名称
 */
const USER_ROLE_TABLE_NAME = '`user_role`'

/**
 * 角色数据表名称
 */
const ROLE_TABLE_NAME = '`role`'

/**
 * 用户登录日志表名称
 */
const USER_LOGIN_LOG_TABLE_NAME = '`user_login_log`'

/**
 * 用户认证记录接口定义
 */
export type UserAuthRecord = {
  /** 用户 ID */
  id: number
  /** 用户名 */
  userName: string
  /** 显示名称 */
  displayName: string
  /** 密码哈希 */
  passwordHash: string
  /** 头像地址，可为空 */
  avatar: string | null
  /** 用户状态 (1: 启用, 0: 禁用) */
  status: number
}

/**
 * 用户数据访问层，提供用户及登录相关的数据库操作
 */
export class UserMapper extends BaseMapper {
  /** 数据源名称 */
  public dataSourceName = DATA_SOURCE_NAME

  /**
   * 根据用户名获取用于登录校验的用户记录
   *
   * @param {string} userName 用户名
   * @returns {Promise<UserAuthRecord | null>} 返回匹配的用户记录，未找到或已删除则返回 null
   */
  public async getUserForLogin(userName: string): Promise<UserAuthRecord | null> {
    const sql = `
      select
        id,
        user_name as userName,
        display_name as displayName,
        password_hash as passwordHash,
        avatar,
        status
      from ${USER_TABLE_NAME}
      where user_name = ? and is_deleted = 0
      limit 1`
    const result = await this.exe<UserAuthRecord[]>(sql, [userName])
    return result?.[0] || null
  }

  /**
   * 获取指定用户所拥有的所有有效角色编码
   *
   * @param {number} userId 用户 ID
   * @returns {Promise<string[]>} 角色编码数组
   */
  public async getUserRoleCodes(userId: number): Promise<string[]> {
    const sql = `
      select r.role_code as roleCode
      from ${USER_ROLE_TABLE_NAME} ur
      inner join ${ROLE_TABLE_NAME} r on r.id = ur.role_id
      where ur.user_id = ? and r.is_deleted = 0 and r.status = 1`
    const result = await this.exe<Array<{ roleCode: string }>>(sql, [userId])
    return result.map((item) => item.roleCode)
  }

  /**
   * 更新用户最后登录时间和登录 IP
   *
   * @param {number} userId 用户 ID
   * @param {string} loginIp 登录 IP 地址
   * @returns {Promise<void>} 无返回值
   */
  public async updateLastLogin(userId: number, loginIp: string) {
    const sql = `update ${USER_TABLE_NAME} set last_login_time = now(), last_login_ip = ? where id = ?`
    await this.exe<ResultSetHeader>(sql, [loginIp, userId])
  }

  /**
   * 记录用户登录日志
   *
   * @param {Object} options 登录日志参数
   * @param {number | null} [options.userId] 用户 ID (登录失败时可能为 null 或 undefined)
   * @param {string} options.userName 登录尝试的用户名
   * @param {string} options.loginIp 登录客户端 IP
   * @param {string} options.userAgent 登录客户端的 UserAgent
   * @param {'success' | 'failed'} options.status 登录状态 (success 成功, failed 失败)
   * @param {string} [options.failReason] 失败原因
   * @returns {Promise<void>} 无返回值
   */
  public async createLoginLog(options: {
    userId?: number | null
    userName: string
    loginIp: string
    userAgent: string
    status: 'success' | 'failed'
    failReason?: string
  }) {
    const sql = `
      insert into ${USER_LOGIN_LOG_TABLE_NAME}
        (user_id, user_name, login_ip, user_agent, status, fail_reason)
      values (?, ?, ?, ?, ?, ?)`
    await this.exe<ResultSetHeader>(sql, [
      options.userId || null,
      options.userName,
      options.loginIp,
      options.userAgent,
      options.status,
      options.failReason || null
    ])
  }
}
