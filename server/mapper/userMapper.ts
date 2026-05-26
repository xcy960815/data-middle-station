import { BaseMapper } from '@/server/mapper/baseMapper'
import type { ResultSetHeader } from 'mysql2'

const DATA_SOURCE_NAME = 'data_middle_station'
const USER_TABLE_NAME = '`user`'
const USER_ROLE_TABLE_NAME = '`user_role`'
const ROLE_TABLE_NAME = '`role`'
const USER_LOGIN_LOG_TABLE_NAME = '`user_login_log`'

export type UserAuthRecord = {
  id: number
  userName: string
  displayName: string
  passwordHash: string
  avatar: string | null
  status: number
}

export class UserMapper extends BaseMapper {
  public dataSourceName = DATA_SOURCE_NAME

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

  public async getUserRoleCodes(userId: number): Promise<string[]> {
    const sql = `
      select r.role_code as roleCode
      from ${USER_ROLE_TABLE_NAME} ur
      inner join ${ROLE_TABLE_NAME} r on r.id = ur.role_id
      where ur.user_id = ? and r.is_deleted = 0 and r.status = 1`
    const result = await this.exe<Array<{ roleCode: string }>>(sql, [userId])
    return result.map((item) => item.roleCode)
  }

  public async updateLastLogin(userId: number, loginIp: string) {
    const sql = `update ${USER_TABLE_NAME} set last_login_time = now(), last_login_ip = ? where id = ?`
    await this.exe<ResultSetHeader>(sql, [loginIp, userId])
  }

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
