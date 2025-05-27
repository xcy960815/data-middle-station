const mysql = require('mysql2/promise')

async function testConnection() {
  const config = {
    host: 'localhost',
    port: 3308,
    user: 'root',
    password: '123456',
    database: 'kanban_data'
  }

  try {
    console.log('正在尝试连接数据库...')
    const connection = await mysql.createConnection(config)
    console.log('数据库连接成功！')

    // 测试查询
    const [rows] = await connection.execute('SELECT 1')
    console.log('测试查询成功：', rows)

    await connection.end()
    console.log('数据库连接已关闭')
  } catch (error) {
    console.error('数据库连接失败：', error)
  }
}

testConnection()
