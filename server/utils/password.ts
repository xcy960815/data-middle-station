import { scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !storedHash) {
    return false
  }

  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer
  const storedKey = Buffer.from(storedHash, 'hex')
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}
