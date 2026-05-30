import 'nitropack'
import 'h3'
import type { Pool } from 'mysql2/promise'
import type { JwtPayload } from '@/server/utils/jwt'

// 扩展NitroApp类型
declare module 'nitropack' {
  /**
   * 扩展NitroApp类型
   */
  interface NitroApp {
    mysqlPools: Map<string, Pool>
  }
}

declare module 'h3' {
  interface H3EventContext {
    user?: JwtPayload
  }
}
