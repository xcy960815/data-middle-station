// export { }
import 'nitropack'
import type { Pool } from 'mysql2/promise'

// 扩展NitroApp类型
declare module 'nitropack' {
  /**
   * 扩展NitroApp类型
   */
  interface NitroApp {
    mysqlPools: Map<string, Pool>
  }
}
