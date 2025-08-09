import type { H3Event } from 'h3'
import { getQuery } from 'h3'

/**
 * GET 方式触发向 big_data 表插入 10000 条数据
 * 与 POST 版本逻辑一致，方便直接在浏览器地址栏调用
 */
export default defineEventHandler(async (_event: H3Event) => {
  const pool = useNitroApp().mysqlPools.get(useRuntimeConfig().serviceDataDbName || useRuntimeConfig().serviceDbName)
  if (!pool) return CustomResponse.error('数据库连接不存在')

  const createTableSQL = `
  CREATE TABLE IF NOT EXISTS big_data (
    id INT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender VARCHAR(10) NOT NULL,
    country VARCHAR(50) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(10) NOT NULL,
    zipcode VARCHAR(10) NOT NULL,
    address VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    company VARCHAR(100) NOT NULL,
    department VARCHAR(50) NOT NULL,
    position VARCHAR(50) NOT NULL,
    salary VARCHAR(20) NOT NULL,
    experience VARCHAR(20) NOT NULL,
    education VARCHAR(50) NOT NULL,
    skills VARCHAR(150) NOT NULL,
    notes VARCHAR(255) NOT NULL,
    email VARCHAR(120) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`

  await pool.query(createTableSQL)

  // 处理模式：默认如果已有数据则不重复写入；传 mode=truncate 将清空后重建
  const { mode } = getQuery<{ mode?: string }>(_event)
  const [countRows] = (await pool.query('SELECT COUNT(1) as cnt FROM big_data')) as any
  const existing = Number(countRows?.[0]?.cnt ?? 0)
  if (existing > 0 && mode !== 'truncate') {
    return CustomResponse.success({ message: 'big_data 已有数据，跳过插入', existing })
  }
  if (mode === 'truncate' && existing > 0) {
    await pool.query('TRUNCATE TABLE big_data')
  }

  const total = 10000
  const batchSize = 1000

  const valuesForIndex = (i: number) => {
    const gender = ['Male', 'Female', 'Other'][(i * 3) % 3]
    const country = ['China', 'USA', 'UK', 'Germany', 'France', 'Japan', 'Canada', 'Australia'][(i * 3) % 8]
    const city = ['Beijing', 'Shanghai', 'New York', 'London', 'Berlin', 'Paris', 'Tokyo', 'Toronto', 'Sydney'][
      (i * 5) % 9
    ]
    const state = ['CA', 'NY', 'TX', 'FL', 'WA', 'IL', 'PA', 'OH', 'GA', 'NC'][(i * 7) % 10]
    const company = [
      'TechCorp',
      'DataSoft',
      'CloudInc',
      'WebSolutions',
      'AppDev',
      'SystemsLtd',
      'CodeWorks',
      'DigitalPro'
    ][(i * 11) % 8]
    const department = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Support', 'Design'][
      (i * 13) % 8
    ]
    const position = [
      'Developer',
      'Manager',
      'Analyst',
      'Designer',
      'Consultant',
      'Specialist',
      'Coordinator',
      'Director'
    ][(i * 17) % 8]
    const education = ['Bachelor', 'Master', 'PhD', 'Associate', 'High School', 'Certificate'][(i * 19) % 6]
    const skills = [
      'JavaScript, React',
      'Python, Django',
      'Java, Spring',
      'C#, .NET',
      'PHP, Laravel',
      'Go, Gin',
      'Ruby, Rails',
      'Node.js, Express'
    ][(i * 23) % 8]
    const emailHost = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'example.org'][(i * 29) % 5]
    const age = 18 + ((i * 7) % 40)
    const zipcode = String(10000 + ((i * 123) % 90000))
    const address = `${i} Main Street, Apt ${(i % 50) + 1}`
    const phone = `+1-555-${String(1000 + i).slice(-4)}`
    const mobile = `+1-666-${String(2000 + i).slice(-4)}`
    const salary = `$${(30000 + ((i * 1000) % 120000)).toLocaleString()}`
    const experience = `${(i % 20) + 1} years`
    const notes = `Additional notes for user ${i}. Lorem ipsum dolor sit amet.`
    const email = `user${i}@${emailHost}`
    const name = `User ${i}`
    return [
      i,
      name,
      age,
      gender,
      country,
      city,
      state,
      zipcode,
      address,
      phone,
      mobile,
      company,
      department,
      position,
      salary,
      experience,
      education,
      skills,
      notes,
      email
    ]
  }

  const insertSql = `INSERT INTO big_data (
    id, name, age, gender, country, city, state, zipcode, address,
    phone, mobile, company, department, position, salary, experience,
    education, skills, notes, email
  ) VALUES ?`

  for (let start = 1; start <= total; start += batchSize) {
    const end = Math.min(start + batchSize - 1, total)
    const rows: any[] = []
    for (let i = start; i <= end; i++) rows.push(valuesForIndex(i))
    await pool.query(insertSql, [rows])
  }

  return CustomResponse.success({ message: 'Seed finished', total })
})
