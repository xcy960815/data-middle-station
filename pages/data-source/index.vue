<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #header-right>
          <el-tooltip effect="dark" content="新增数据源" placement="bottom">
            <icon-park
              type="newlybuild"
              size="30"
              fill="#333"
              class="cursor-pointer"
              @click="handleOpenCreateDialog"
            ></icon-park>
          </el-tooltip>
        </template>
      </custom-header>
    </template>

    <template #content>
      <div class="data-source-page">
        <div class="data-source-toolbar">
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索数据源名称、描述或数据库"
            class="data-source-search"
            @keyup.enter="getDataSources(1)"
            @clear="getDataSources(1)"
          />
          <el-select v-model="sortField" class="data-source-select" @change="getDataSources(1)">
            <el-option label="最近更新" value="updateTime" />
            <el-option label="创建时间" value="createTime" />
            <el-option label="数据源名称" value="sourceName" />
          </el-select>
          <el-select v-model="sortOrder" class="data-source-select" @change="getDataSources(1)">
            <el-option label="降序" value="desc" />
            <el-option label="升序" value="asc" />
          </el-select>
          <el-button type="primary" @click="getDataSources(1)">搜索</el-button>
          <el-button @click="handleResetSearch">重置</el-button>
        </div>

        <div v-loading="listLoading" class="data-source-list">
          <ListCard
            v-for="item in dataSources"
            :key="item.id"
            :title="item.sourceName"
            :description="item.sourceDesc || item.databaseName"
            :title-attr="item.databaseName"
            :creator="item.createdBy"
            :time="formatDate(item.updateTime || item.createTime)"
            @click="handleOpenTables(item)"
          >
            <template #actions>
              <button class="data-source-card-action" type="button" @click.stop="handleOpenTables(item)">
                <icon-park type="TableReport" size="14" fill="#333" />
              </button>
              <button class="data-source-card-action" type="button" @click.stop="handleSyncSchema(item)">
                <icon-park type="Refresh" size="14" fill="#333" />
              </button>
              <button class="data-source-card-action" type="button" @click.stop="handleEditDataSource(item)">
                <icon-park type="Edit" size="14" fill="#333" />
              </button>
              <button
                class="data-source-card-action data-source-card-action--delete"
                type="button"
                @click.stop="handleDeleteDataSource(item)"
              >
                <icon-park type="DeleteOne" size="14" fill="#333" />
              </button>
            </template>
            <template #left-badges>
              <span class="data-source-badge" :class="`data-source-badge--${item.status}`">
                {{ item.status === 'enabled' ? '启用' : '禁用' }}
              </span>
            </template>
            <template #right-badges>
              <span class="data-source-count">{{ item.tableCount }} 张表</span>
            </template>
          </ListCard>
          <el-empty
            v-if="!listLoading && dataSources.length === 0"
            class="data-source-empty"
            description="暂无数据源"
          />
        </div>

        <div v-if="total > 0" class="data-source-pagination">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            @current-change="getDataSources"
          />
        </div>
      </div>

      <el-dialog v-model="formDialogVisible" :title="formTitle" width="520px">
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="92px">
          <el-form-item label="名称" prop="sourceName">
            <el-input v-model="form.sourceName" placeholder="请输入数据源名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.sourceDesc" type="textarea" :rows="3" placeholder="请输入数据源描述" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="form.sourceType" class="w-full">
              <el-option label="MySQL" value="mysql" />
            </el-select>
          </el-form-item>
          <el-form-item label="主机" prop="host">
            <el-input v-model="form.host" placeholder="例如 mysql-data 或 127.0.0.1" />
          </el-form-item>
          <el-form-item label="端口" prop="port">
            <el-input-number v-model="form.port" :min="1" :max="65535" class="w-full" />
          </el-form-item>
          <el-form-item label="数据库" prop="databaseName">
            <el-input v-model="form.databaseName" placeholder="当前版本建议填写 kanban_data" />
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="form.status" class="w-full">
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="formDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSaveDataSource">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="tableDialogVisible" :title="tableDialogTitle" width="860px">
        <div class="data-source-table-panel">
          <div class="data-source-table-panel__left">
            <el-input
              v-model="tableKeyword"
              clearable
              placeholder="搜索表"
              @keyup.enter="getTables"
              @clear="getTables"
            />
            <div v-loading="tableLoading" class="data-source-table-list">
              <div
                v-for="table in tables"
                :key="table.id"
                class="data-source-table-item"
                :class="{ 'is-active': activeTable?.tableName === table.tableName }"
                @click="handleSelectTable(table)"
              >
                <span class="data-source-table-item__name">{{ table.tableName }}</span>
                <span class="data-source-table-item__meta">{{ table.tableRows || 0 }} 行</span>
              </div>
              <el-empty v-if="!tableLoading && tables.length === 0" description="暂无表" />
            </div>
          </div>
          <div class="data-source-table-panel__right">
            <el-table v-loading="columnLoading" :data="columns" height="420px" size="small">
              <el-table-column prop="ordinalPosition" label="#" width="64" />
              <el-table-column prop="columnName" label="字段名" min-width="160" />
              <el-table-column prop="columnType" label="类型" min-width="140" />
              <el-table-column prop="columnComment" label="备注" min-width="180" />
              <el-table-column prop="nullable" label="可空" width="80" />
            </el-table>
          </div>
        </div>
      </el-dialog>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import ListCard from '@/components/list-card/index.vue'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const layoutName = 'dashboard'

const dataSources = ref<DataSourceVo.DataSourceListItem[]>([])
const listLoading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const keyword = ref('')
const sortField = ref<DataSourceDto.DataSourceListSortField>('updateTime')
const sortOrder = ref<DataSourceDto.DataSourceListSortOrder>('desc')

const formDialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  id: null as number | null,
  sourceName: '',
  sourceDesc: '',
  sourceType: 'mysql' as DataSourceDao.DataSourceType,
  host: 'mysql-data',
  port: 3306,
  databaseName: 'kanban_data',
  username: 'root',
  status: 'enabled' as DataSourceDao.DataSourceStatus
})
const formTitle = computed(() => (form.id ? '编辑数据源' : '新增数据源'))
const formRules: FormRules = {
  sourceName: [{ required: true, message: '请输入数据源名称', trigger: 'blur' }],
  host: [{ required: true, message: '请输入主机', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口', trigger: 'blur' }],
  databaseName: [{ required: true, message: '请输入数据库', trigger: 'blur' }],
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

const tableDialogVisible = ref(false)
const activeDataSource = ref<DataSourceVo.DataSourceListItem | null>(null)
const tableKeyword = ref('')
const tableLoading = ref(false)
const columnLoading = ref(false)
const tables = ref<DataSourceVo.DataSourceTableItem[]>([])
const columns = ref<DataSourceVo.DataSourceColumnItem[]>([])
const activeTable = ref<DataSourceVo.DataSourceTableItem | null>(null)
const tableDialogTitle = computed(() => `${activeDataSource.value?.sourceName || '数据源'}表结构`)

const getDataSources = async (targetPage = page.value) => {
  listLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DataSourceVo.DataSourceListResponse>>('/api/getDataSources', {
      method: 'POST',
      body: {
        page: targetPage,
        pageSize: pageSize.value,
        keyword: keyword.value.trim(),
        sortField: sortField.value,
        sortOrder: sortOrder.value
      }
    })
    if (res.code === 200 && res.data) {
      dataSources.value = res.data.list || []
      page.value = res.data.page
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取数据源失败')
    }
  } finally {
    listLoading.value = false
  }
}

const handleResetSearch = () => {
  keyword.value = ''
  sortField.value = 'updateTime'
  sortOrder.value = 'desc'
  getDataSources(1)
}

const resetForm = () => {
  form.id = null
  form.sourceName = ''
  form.sourceDesc = ''
  form.sourceType = 'mysql'
  form.host = 'mysql-data'
  form.port = 3306
  form.databaseName = 'kanban_data'
  form.username = 'root'
  form.status = 'enabled'
}

const handleOpenCreateDialog = () => {
  resetForm()
  formDialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleEditDataSource = (item: DataSourceVo.DataSourceListItem) => {
  form.id = item.id
  form.sourceName = item.sourceName
  form.sourceDesc = item.sourceDesc
  form.sourceType = item.sourceType
  form.host = item.host
  form.port = item.port
  form.databaseName = item.databaseName
  form.username = item.username
  form.status = item.status
  formDialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleSaveDataSource = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const res = await httpRequest<ApiResponseI<DataSourceVo.DataSourceDetailResponse>>(
      form.id ? '/api/updateDataSource' : '/api/createDataSource',
      {
        method: 'POST',
        body: { ...form }
      }
    )
    if (res.code === 200) {
      ElMessage.success('数据源已保存')
      formDialogVisible.value = false
      getDataSources(form.id ? page.value : 1)
    } else {
      ElMessage.error(res.message || '保存数据源失败')
    }
  } finally {
    saving.value = false
  }
}

const handleDeleteDataSource = (item: DataSourceVo.DataSourceListItem) => {
  ElMessageBox.confirm(`确定删除【${item.sourceName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest<ApiResponseI<boolean>>('/api/deleteDataSource', {
      method: 'DELETE',
      body: { id: item.id }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getDataSources(page.value)
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

const handleSyncSchema = async (item: DataSourceVo.DataSourceListItem) => {
  const res = await httpRequest<ApiResponseI<DataSourceVo.SyncDataSourceSchemaResponse>>('/api/syncDataSourceSchema', {
    method: 'POST',
    body: { id: item.id }
  })
  if (res.code === 200 && res.data) {
    ElMessage.success(`同步完成：${res.data.tableCount} 张表，${res.data.columnCount} 个字段`)
    getDataSources(page.value)
  } else {
    ElMessage.error(res.message || '同步失败')
  }
}

const handleOpenTables = async (item: DataSourceVo.DataSourceListItem) => {
  activeDataSource.value = item
  tableDialogVisible.value = true
  tableKeyword.value = ''
  columns.value = []
  activeTable.value = null
  await getTables()
}

const getTables = async () => {
  if (!activeDataSource.value) return
  tableLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DataSourceVo.DataSourceTableItem[]>>('/api/getDataSourceTables', {
      method: 'POST',
      body: {
        id: activeDataSource.value.id,
        keyword: tableKeyword.value.trim()
      }
    })
    if (res.code === 200) {
      tables.value = res.data || []
      if (tables.value[0]) {
        handleSelectTable(tables.value[0])
      }
    } else {
      ElMessage.error(res.message || '获取表失败')
    }
  } finally {
    tableLoading.value = false
  }
}

const handleSelectTable = async (table: DataSourceVo.DataSourceTableItem) => {
  if (!activeDataSource.value) return
  activeTable.value = table
  columnLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DataSourceVo.DataSourceColumnItem[]>>('/api/getDataSourceColumns', {
      method: 'POST',
      body: {
        id: activeDataSource.value.id,
        tableName: table.tableName
      }
    })
    if (res.code === 200) {
      columns.value = res.data || []
    } else {
      ElMessage.error(res.message || '获取字段失败')
    }
  } finally {
    columnLoading.value = false
  }
}

const formatDate = (value: string) => {
  return value ? value.split('T')[0].slice(0, 10) : ''
}

onMounted(() => {
  getDataSources()
})
</script>

<style scoped lang="scss">
.data-source-page {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
}

.data-source-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
}

.data-source-search {
  max-width: 320px;
}

.data-source-select {
  width: 140px;
}

.data-source-list {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 20px;
  min-height: 0;
  overflow: auto;
  padding: 10px;
}

.data-source-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
}

.data-source-card-action {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  cursor: pointer;
}

.data-source-card-action:hover {
  background: #eef6ff;
}

.data-source-card-action--delete:hover {
  background: #ffeaea;
}

.data-source-badge,
.data-source-count {
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 12px;
}

.data-source-badge--enabled {
  color: #047857;
  background: #d1fae5;
}

.data-source-badge--disabled {
  color: #6b7280;
  background: #f3f4f6;
}

.data-source-count {
  color: #2563eb;
  background: #dbeafe;
}

.data-source-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.data-source-table-panel {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 12px;
}

.data-source-table-panel__left,
.data-source-table-panel__right {
  min-height: 0;
}

.data-source-table-list {
  height: 420px;
  margin-top: 10px;
  overflow: auto;
  border: 1px solid #ebeef5;
  border-radius: 6px;
}

.data-source-table-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 10px;
  border-bottom: 1px solid #f2f3f5;
  cursor: pointer;
}

.data-source-table-item.is-active {
  color: #2563eb;
  background: #eff6ff;
}

.data-source-table-item__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-source-table-item__meta {
  flex: 0 0 auto;
  color: #909399;
  font-size: 12px;
}
</style>
