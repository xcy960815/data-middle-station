<template>
  <NuxtLayout :name="layoutName">
    <div class="indexdb-container">
      <el-button type="primary" @click="generateTenThousandUsers" style="margin-right: 12px">生成10000条数据</el-button>
      <el-button type="danger" @click="deleteDatabase">删除数据库</el-button>
      <el-table :data="users" style="width: 100%" stripe border>
        <el-table-column prop="id" label="ID" width="200" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="age" label="年龄" width="80" />
        <el-table-column prop="city" label="城市" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }"> </template>
        </el-table-column>
      </el-table>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
const layoutName = 'indexdb'
interface User extends IndexDB.DataRecord {
  id?: string
  name: string
  email: string
  age: number
  city: string
  createTime?: string
}

// 响应式数据
const nuxtApp = useNuxtApp()
const $indexdb = nuxtApp.$indexdb as IndexDB.Manager
let database: IDBDatabase | null = null
const dbName = 'DemoDatabase'
const dbVersion = 1
const tableName = 'users'

// 用户数据
const users = ref<User[]>([])

// 生命周期
onMounted(async () => {
  await initDatabase()
})

onBeforeUnmount(() => {
  if (database) {
    database.close()
  }
})

const initDatabase = async () => {
  database = await $indexdb.openDatabase(dbName, dbVersion)
  await refreshData()
}

const refreshData = async () => {
  if (!database) {
    return
  }
  users.value = await $indexdb.getAllData<User>(database, tableName)
}

// 生成10k测试数据（分批插入，避免长事务卡死）
const generateTenThousandUsers = async () => {
  if (!database) {
    return
  }

  const total = 100000
  const batchSize = 500
  const batches = Math.ceil(total / batchSize)

  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '西安']
  const domains = ['gmail.com', 'qq.com', '163.com', 'sina.com']

  const now = Date.now()

  try {
    for (let b = 0; b < batches; b++) {
      const startIndex = b * batchSize
      const endIndex = Math.min(startIndex + batchSize, total)
      const data: User[] = []

      for (let i = startIndex; i < endIndex; i++) {
        const name = names[Math.floor(Math.random() * names.length)]
        const city = cities[Math.floor(Math.random() * cities.length)]
        const domain = domains[Math.floor(Math.random() * domains.length)]
        const unique = now + i

        data.push({
          id: unique.toString(36) + Math.random().toString(36).slice(2, 8),
          name: `${name}${i + 1}`,
          email: `${name.toLowerCase?.() ?? 'user'}${i + 1}@${domain}`,
          age: Math.floor(Math.random() * 50) + 18,
          city,
          createTime: new Date(now + i * 1000).toISOString()
        })
      }

      await $indexdb.addDataAsync<User>(database, tableName, data)
      // 让UI有机会渲染，避免长时间主线程阻塞
      await new Promise((r) => setTimeout(r))
    }

    await refreshData()
    ElMessage.success('已生成10000条数据')
  } catch {
    ElMessage.error('生成数据失败')
  }
}

const deleteDatabase = async () => {
  if (database) {
    database.close()
    database = null
  }

  const success = await $indexdb.deleteDatabase(dbName)
  if (success) {
    users.value = []
    ElMessage.success('数据库删除成功')
  } else {
    throw new Error('删除失败')
  }
}

// 已去除分页，相关回调删除

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}
</script>

<style lang="scss" scoped>
.indexdb-container {
  width: 100%;
  height: 100%;
}
</style>
