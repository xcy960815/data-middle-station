<template>
  <NuxtLayout :name="layoutName">
    <div class="indexdb-container">
      <el-card class="status-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>数据库状态</span>
            <el-button type="primary" size="small" @click="initDatabase" :loading="isInitializing">
              {{ database ? '重新初始化' : '初始化数据库' }}
            </el-button>
          </div>
        </template>
        <div class="status-info">
          <el-row :gutter="20">
            <el-col :span="8">
              <div class="status-item">
                <span class="label">数据库状态:</span>
                <el-tag :type="database ? 'success' : 'danger'">
                  {{ database ? '已连接' : '未连接' }}
                </el-tag>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="status-item">
                <span class="label">数据库名称:</span>
                <span>{{ dbName }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="status-item">
                <span class="label">版本:</span>
                <span>{{ dbVersion }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-card>
      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-form :model="newUser" label-width="auto">
            <el-form-item label="用户名">
              <el-input v-model="newUser.name" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="newUser.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="年龄">
              <el-input-number v-model="newUser.age" :min="1" :max="120" />
            </el-form-item>
            <el-form-item label="城市">
              <ClientOnly>
                <el-select v-model="newUser.city" placeholder="请选择城市">
                  <el-option label="北京" value="北京" />
                  <el-option label="上海" value="上海" />
                  <el-option label="广州" value="广州" />
                  <el-option label="深圳" value="深圳" />
                  <el-option label="杭州" value="杭州" />
                </el-select>
                <template #fallback>
                  <el-input v-model="newUser.city" placeholder="请选择城市" readonly />
                </template>
              </ClientOnly>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="addUser" :loading="isAdding"> 添加用户 </el-button>
              <el-button @click="generateRandomUsers"> 生成测试数据 </el-button>
            </el-form-item>
          </el-form>
        </el-col>

        <!-- <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span>数据统计</span>
            </template>
            <div class="stats-container">
              <div class="stat-item">
                <div class="stat-number">{{ totalUsers }}</div>
                <div class="stat-label">总用户数</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ citiesCount }}</div>
                <div class="stat-label">城市数量</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ avgAge }}</div>
                <div class="stat-label">平均年龄</div>
              </div>
            </div>
            <el-divider />
            <div class="action-buttons">
              <el-button type="success" @click="refreshData" :loading="isLoading">
                刷新数据
              </el-button>
              <el-button type="warning" @click="clearAllData" :loading="isClearing">
                清空数据
              </el-button>
              <el-button type="danger" @click="deleteDatabase">
                删除数据库
              </el-button>
            </div>
          </el-card>
        </el-col> -->
      </el-row>

      <el-card class="search-card" shadow="hover" style="margin-top: 20px">
        <template #header>
          <span>数据查询</span>
        </template>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input v-model="searchQuery.name" placeholder="按姓名搜索" clearable @input="handleSearch" />
          </el-col>
          <el-col :span="6">
            <el-select v-model="searchQuery.city" placeholder="按城市筛选" clearable @change="handleSearch">
              <el-option label="全部" value="" />
              <el-option label="北京" value="北京" />
              <el-option label="上海" value="上海" />
              <el-option label="广州" value="广州" />
              <el-option label="深圳" value="深圳" />
              <el-option label="杭州" value="杭州" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-input-number
              v-model="searchQuery.minAge"
              placeholder="最小年龄"
              :min="1"
              :max="120"
              @change="handleSearch"
            />
          </el-col>
          <el-col :span="6">
            <el-input-number
              v-model="searchQuery.maxAge"
              placeholder="最大年龄"
              :min="1"
              :max="120"
              @change="handleSearch"
            />
          </el-col>
        </el-row>
      </el-card>

      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>用户数据列表</span>
            <div class="table-controls">
              <el-button-group size="small">
                <el-button @click="sortBy('name')" :type="sortField === 'name' ? 'primary' : ''">
                  按姓名排序
                </el-button>
                <el-button @click="sortBy('age')" :type="sortField === 'age' ? 'primary' : ''"> 按年龄排序 </el-button>
                <el-button @click="sortBy('createTime')" :type="sortField === 'createTime' ? 'primary' : ''">
                  按创建时间排序
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <el-table :data="displayUsers" style="width: 100%" v-loading="isLoading" stripe border>
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
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button type="primary" size="small" @click="editUser(row)"> 编辑 </el-button>
              <el-button type="danger" size="small" @click="deleteUser(row.id)"> 删除 </el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-pagination
          v-if="totalUsers > pageSize"
          style="margin-top: 20px; text-align: right"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pageSize"
          :total="totalUsers"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </el-card>

      <el-dialog v-model="editDialogVisible" title="编辑用户" width="500px">
        <el-form :model="editingUser" label-width="80px">
          <el-form-item label="用户名">
            <el-input v-model="editingUser.name" />
          </el-form-item>
          <el-form-item label="邮箱">
            <el-input v-model="editingUser.email" />
          </el-form-item>
          <el-form-item label="年龄">
            <el-input-number v-model="editingUser.age" :min="1" :max="120" />
          </el-form-item>
          <el-form-item label="城市">
            <el-select v-model="editingUser.city">
              <el-option label="北京" value="北京" />
              <el-option label="上海" value="上海" />
              <el-option label="广州" value="广州" />
              <el-option label="深圳" value="深圳" />
              <el-option label="杭州" value="杭州" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="updateUser" :loading="isUpdating"> 保存 </el-button>
        </template>
      </el-dialog>

      <el-card shadow="hover" style="margin-top: 20px">
        <template #header>
          <div class="card-header">
            <span>操作日志</span>
            <el-button size="small" @click="clearLogs">清空日志</el-button>
          </div>
        </template>
        <div class="logs-container">
          <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
            <span class="log-time">{{ formatTime(log.time) }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
          <div v-if="logs.length === 0" class="no-logs">暂无操作日志</div>
        </div>
      </el-card>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
const layoutName = 'indexdb'
interface User {
  id?: string
  name: string
  email: string
  age: number
  city: string
  createTime?: string
}

interface LogItem {
  time: Date
  message: string
  type: 'success' | 'error' | 'info'
}

interface SearchQuery {
  name: string
  city: string
  minAge: number | null
  maxAge: number | null
}

// 响应式数据
const { $indexdb } = useNuxtApp()
const database = ref<IDBDatabase | null>(null)
const dbName = 'DemoDatabase'
const dbVersion = 1
const tableName = 'users'

// 用户数据
const users = ref<User[]>([])
const displayUsers = ref<User[]>([])
const totalUsers = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

// 表单数据
const newUser = ref<User>({
  name: '',
  email: '',
  age: 20,
  city: ''
})

const editingUser = ref<User>({
  name: '',
  email: '',
  age: 20,
  city: ''
})

// 搜索条件
const searchQuery = ref<SearchQuery>({
  name: '',
  city: '',
  minAge: null,
  maxAge: null
})

// 排序
const sortField = ref('')
const sortOrder = ref<'asc' | 'desc'>('desc')

// UI状态
const isMounted = ref(false)
const isInitializing = ref(false)
const isLoading = ref(false)
const isAdding = ref(false)
const isUpdating = ref(false)
const isClearing = ref(false)
const editDialogVisible = ref(false)

// 日志
const logs = ref<LogItem[]>([])

const avgAge = computed(() => {
  if (users.value.length === 0) return 0
  const total = users.value.reduce((sum, user) => sum + user.age, 0)
  return Math.round(total / users.value.length)
})

// 生命周期
onMounted(async () => {
  isMounted.value = true
  await initDatabase()
})

onBeforeUnmount(() => {
  if (database.value) {
    database.value.close()
  }
})

// 方法
const addLog = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  logs.value.unshift({
    time: new Date(),
    message,
    type
  })

  // 保持最多100条日志
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

const initDatabase = async () => {
  isInitializing.value = true
  addLog('正在初始化数据库...', 'info')

  try {
    database.value = await $indexdb.openDatabase(dbName, dbVersion)
    if (database.value) {
      addLog('数据库初始化成功', 'success')
      await refreshData()
    } else {
      throw new Error('数据库初始化失败')
    }
  } catch (error: any) {
    addLog(`数据库初始化失败: ${error.message}`, 'error')
  } finally {
    isInitializing.value = false
  }
}

const refreshData = async () => {
  if (!database.value) {
    addLog('数据库未初始化', 'error')
    return
  }

  isLoading.value = true
  try {
    const allUsers = await $indexdb.getAllData(database.value, tableName)
    users.value = allUsers as unknown as User[]
    totalUsers.value = users.value.length
    handleSearch() // 应用当前搜索条件
    addLog(`成功加载 ${users.value.length} 条用户数据`, 'success')
  } catch (error: any) {
    addLog(`加载数据失败: ${error.message}`, 'error')
  } finally {
    isLoading.value = false
  }
}

const addUser = async () => {
  if (!database.value) {
    addLog('数据库未初始化', 'error')
    return
  }

  if (!newUser.value.name || !newUser.value.email || !newUser.value.city) {
    ElMessage.warning('请填写完整的用户信息')
    return
  }

  isAdding.value = true
  try {
    const userData: User = {
      id: generateId(),
      ...newUser.value,
      createTime: new Date().toISOString()
    }

    await $indexdb.addDataAsync(database.value, tableName, [userData as any])
    addLog(`成功添加用户: ${userData.name}`, 'success')

    // 重置表单
    newUser.value = {
      name: '',
      email: '',
      age: 20,
      city: ''
    }

    await refreshData()
    ElMessage.success('用户添加成功')
  } catch (error: any) {
    addLog(`添加用户失败: ${error.message}`, 'error')
    ElMessage.error('用户添加失败')
  } finally {
    isAdding.value = false
  }
}

const generateRandomUsers = async () => {
  if (!database.value) {
    addLog('数据库未初始化', 'error')
    return
  }

  const names = ['张三', '李四', '王五', '赵六', '孙七', '周八', '吴九', '郑十']
  const cities = ['北京', '上海', '广州', '深圳', '杭州']
  const domains = ['gmail.com', 'qq.com', '163.com', 'sina.com']

  const testUsers: User[] = []

  for (let i = 0; i < 10; i++) {
    const name = names[Math.floor(Math.random() * names.length)]
    const city = cities[Math.floor(Math.random() * cities.length)]
    const domain = domains[Math.floor(Math.random() * domains.length)]

    testUsers.push({
      id: generateId(),
      name: `${name}${i + 1}`,
      email: `${name.toLowerCase()}${i + 1}@${domain}`,
      age: Math.floor(Math.random() * 50) + 18,
      city,
      createTime: new Date().toISOString()
    })
  }

  try {
    await $indexdb.addDataAsync(database.value, tableName, testUsers as any[])
    addLog(`成功生成 ${testUsers.length} 条测试数据`, 'success')
    await refreshData()
    ElMessage.success('测试数据生成成功')
  } catch (error: any) {
    addLog(`生成测试数据失败: ${error.message}`, 'error')
    ElMessage.error('生成测试数据失败')
  }
}

const editUser = (user: User) => {
  editingUser.value = { ...user }
  editDialogVisible.value = true
}

const updateUser = async () => {
  if (!database.value) {
    addLog('数据库未初始化', 'error')
    return
  }

  isUpdating.value = true
  try {
    await $indexdb.updateData(database.value, tableName, [editingUser.value as any])
    addLog(`成功更新用户: ${editingUser.value.name}`, 'success')
    editDialogVisible.value = false
    await refreshData()
    ElMessage.success('用户更新成功')
  } catch (error: any) {
    addLog(`更新用户失败: ${error.message}`, 'error')
    ElMessage.error('用户更新失败')
  } finally {
    isUpdating.value = false
  }
}

const deleteUser = async (userId: string) => {
  if (!database.value) {
    addLog('数据库未初始化', 'error')
    return
  }

  try {
    await ElMessageBox.confirm('确定要删除此用户吗？', '确认删除', {
      type: 'warning'
    })

    await $indexdb.deleteDataByCondition(database.value, tableName, 'id', userId)
    addLog(`成功删除用户ID: ${userId}`, 'success')
    await refreshData()
    ElMessage.success('用户删除成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      addLog(`删除用户失败: ${error.message}`, 'error')
      ElMessage.error('用户删除失败')
    }
  }
}

const clearAllData = async () => {
  if (!database.value) {
    addLog('数据库未初始化', 'error')
    return
  }

  try {
    await ElMessageBox.confirm('确定要清空所有数据吗？此操作不可恢复！', '确认清空', {
      type: 'warning'
    })

    isClearing.value = true
    await $indexdb.clearData(database.value, tableName)
    addLog('成功清空所有数据', 'success')
    await refreshData()
    ElMessage.success('数据清空成功')
  } catch (error: any) {
    if (error !== 'cancel') {
      addLog(`清空数据失败: ${error.message}`, 'error')
      ElMessage.error('清空数据失败')
    }
  } finally {
    isClearing.value = false
  }
}

const deleteDatabase = async () => {
  try {
    await ElMessageBox.confirm('确定要删除整个数据库吗？此操作不可恢复！', '确认删除', {
      type: 'warning'
    })

    if (database.value) {
      database.value.close()
      database.value = null
    }

    const success = await $indexdb.deleteDatabase(dbName)
    if (success) {
      addLog('数据库删除成功', 'success')
      users.value = []
      displayUsers.value = []
      totalUsers.value = 0
      ElMessage.success('数据库删除成功')
    } else {
      throw new Error('删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      addLog(`删除数据库失败: ${error.message}`, 'error')
      ElMessage.error('删除数据库失败')
    }
  }
}

const handleSearch = () => {
  let filtered = [...users.value]

  // 按姓名搜索
  if (searchQuery.value.name) {
    filtered = filtered.filter((user) => user.name.toLowerCase().includes(searchQuery.value.name.toLowerCase()))
  }

  // 按城市筛选
  if (searchQuery.value.city) {
    filtered = filtered.filter((user) => user.city === searchQuery.value.city)
  }

  // 按年龄范围筛选
  if (searchQuery.value.minAge !== null) {
    filtered = filtered.filter((user) => user.age >= searchQuery.value.minAge!)
  }

  if (searchQuery.value.maxAge !== null) {
    filtered = filtered.filter((user) => user.age <= searchQuery.value.maxAge!)
  }

  // 排序
  if (sortField.value) {
    filtered.sort((a, b) => {
      const aValue = a[sortField.value as keyof User]
      const bValue = b[sortField.value as keyof User]

      if (sortField.value === 'age') {
        return sortOrder.value === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number)
      } else if (sortField.value === 'createTime') {
        return sortOrder.value === 'asc'
          ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
          : new Date(bValue as string).getTime() - new Date(aValue as string).getTime()
      } else {
        return sortOrder.value === 'asc'
          ? String(aValue).localeCompare(String(bValue))
          : String(bValue).localeCompare(String(aValue))
      }
    })
  }

  displayUsers.value = filtered
  totalUsers.value = filtered.length
  currentPage.value = 1
}

const sortBy = (field: string) => {
  if (sortField.value === field) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortOrder.value = 'desc'
  }
  handleSearch()
}

const handleSizeChange = (newPageSize: number) => {
  pageSize.value = newPageSize
  currentPage.value = 1
}

const handleCurrentChange = (newPage: number) => {
  currentPage.value = newPage
}

const clearLogs = () => {
  logs.value = []
}

const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('zh-CN')
}
</script>

<style lang="scss" scoped>
.indexdb-container {
  width: 100%;
  height: 100%;
}
</style>
