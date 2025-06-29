// import mysql from 'mysql2/promise'
// /* ========== 连接池缓存 ========== */
// const pools = new Map<string, mysql.Pool>()

// function getPool(name: string, config: mysql.PoolOptions): mysql.Pool {
//     return pools.get(name) ?? pools.set(name, mysql.createPool(config)).get(name)!
// }

export default defineNitroPlugin(() => {
  // 这里可以放你的插件逻辑
})
