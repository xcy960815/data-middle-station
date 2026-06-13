import { scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

/**
 * 校验用户输入的密码是否与数据库中存储的 scrypt 哈希值匹配
 * @param {string} password 待校验的原始明文密码
 * @param {string} passwordHash 数据库存储的哈希字符串，格式为 `algorithm$salt$hash`
 * @returns {Promise<boolean>} 如果密码匹配返回 true，否则返回 false
 */
export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !storedHash) {
    return false
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  const storedKey = Buffer.from(storedHash, 'hex')
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}
