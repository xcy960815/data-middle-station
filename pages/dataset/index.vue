<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header />
    </template>

    <template #bar>
      <el-button link @click="router.push('/data-source')">数据源管理</el-button>
      <el-button link @click="handleOpenCreateDialog">新增数据集</el-button>
    </template>

    <template #toolbar>
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索数据集名称、描述或物理表"
        class="dataset-search"
        @keyup.enter="getDatasets(1)"
        @clear="getDatasets(1)"
      />
      <el-select v-model="sortField" class="dataset-select" @change="getDatasets(1)">
        <el-option label="最近更新" value="updateTime" />
        <el-option label="创建时间" value="createTime" />
        <el-option label="数据集名称" value="datasetName" />
      </el-select>
      <el-select v-model="sortOrder" class="dataset-select" @change="getDatasets(1)">
        <el-option label="降序" value="desc" />
        <el-option label="升序" value="asc" />
      </el-select>
      <el-button type="primary" @click="getDatasets(1)">搜索</el-button>
      <el-button @click="handleResetSearch">重置</el-button>
    </template>

    <template #list>
      <div v-loading="listLoading" class="dataset-list-loading">
        <ListCard
          v-for="item in datasets"
          :key="item.id"
          :title="item.datasetName"
          :description="item.datasetDesc || item.baseTable"
          :title-attr="item.baseTable"
          :creator="item.createdBy"
          :time="formatDate(item.updateTime || item.createTime)"
          @click="handleOpenPreview(item)"
        >
          <template #actions>
            <button class="dataset-card-action" type="button" @click.stop="handleOpenPreview(item)">
              <icon-park type="PreviewOpen" size="14" fill="#333" />
            </button>
            <button class="dataset-card-action" type="button" @click.stop="handleOpenFieldsDialog(item)">
              <icon-park type="Edit" size="14" fill="#333" />
            </button>
            <button class="dataset-card-action" type="button" @click.stop="handleEditDataset(item)">
              <icon-park type="SettingTwo" size="14" fill="#333" />
            </button>
            <button
              class="dataset-card-action dataset-card-action--delete"
              type="button"
              @click.stop="handleDeleteDataset(item)"
            >
              <icon-park type="DeleteOne" size="14" fill="#333" />
            </button>
          </template>
          <template #left-badges>
            <span class="dataset-badge" :class="`dataset-badge--${item.status}`">
              {{ item.status === 'enabled' ? '启用' : '禁用' }}
            </span>
          </template>
          <template #right-badges>
            <span class="dataset-count">{{ item.fieldCount || 0 }} 个字段</span>
          </template>
        </ListCard>
        <el-empty v-if="!listLoading && datasets.length === 0" class="dataset-empty" description="暂无数据集" />
      </div>
    </template>

    <template #pagination>
      <el-pagination
        v-if="total > 0"
        background
        layout="prev, pager, next, total"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="getDatasets"
      />
    </template>

    <template #dialogs>
      <el-dialog v-model="formDialogVisible" :title="formTitle" width="560px">
        <el-form ref="formRef" :model="form" :rules="formRules" label-width="96px">
          <el-form-item label="名称" prop="datasetName">
            <el-input v-model="form.datasetName" placeholder="请输入数据集名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="form.datasetDesc" type="textarea" :rows="3" placeholder="请输入数据集描述" />
          </el-form-item>
          <el-form-item v-if="!form.id" label="数据源" prop="dataSourceId">
            <el-select
              v-model="form.dataSourceId"
              class="w-full"
              filterable
              placeholder="请选择数据源"
              @change="handleDataSourceChange"
            >
              <el-option
                v-for="item in dataSources"
                :key="item.id"
                :label="`${item.sourceName} / ${item.databaseName}`"
                :value="item.id"
                :disabled="item.status !== 'enabled'"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="!form.id" label="物理表" prop="baseTable">
            <el-select
              v-model="form.baseTable"
              v-loading="tableLoading"
              class="w-full"
              filterable
              placeholder="请选择已同步的物理表"
            >
              <el-option
                v-for="table in tables"
                :key="table.id"
                :label="table.tableComment ? `${table.tableName} / ${table.tableComment}` : table.tableName"
                :value="table.tableName"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-else label="物理表">
            <el-input v-model="form.baseTable" disabled />
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
          <el-button type="primary" :loading="saving" @click="handleSaveDataset">保存</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="fieldsDialogVisible" :title="fieldsDialogTitle" width="980px">
        <div class="dataset-fields-panel" v-loading="fieldsLoading">
          <div class="dataset-fields-toolbar">
            <el-input v-model="fieldKeyword" clearable placeholder="搜索字段名或显示名" class="dataset-field-search" />
            <el-input v-model="changeNote" clearable placeholder="本次变更说明" class="dataset-change-note" />
          </div>
          <el-table :data="filteredFields" height="480px" size="small">
            <el-table-column prop="sortOrder" label="#" width="56" />
            <el-table-column prop="sourceColumnName" label="物理字段" min-width="150" show-overflow-tooltip />
            <el-table-column prop="displayName" label="显示名" min-width="170">
              <template #default="{ row }">
                <el-input v-model="row.displayName" size="small" />
              </template>
            </el-table-column>
            <el-table-column prop="fieldName" label="字段标识" min-width="150" show-overflow-tooltip />
            <el-table-column prop="dataType" label="类型" min-width="130" show-overflow-tooltip />
            <el-table-column prop="fieldType" label="字段角色" width="120">
              <template #default="{ row }">
                <el-select v-model="row.fieldType" size="small">
                  <el-option label="维度" value="dimension" />
                  <el-option label="指标" value="metric" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="aggregationType" label="默认聚合" width="130">
              <template #default="{ row }">
                <el-select v-model="row.aggregationType" size="small" clearable>
                  <el-option label="原始值" value="raw" />
                  <el-option label="计数" value="count" />
                  <el-option label="总计" value="sum" />
                  <el-option label="平均" value="avg" />
                  <el-option label="最大值" value="max" />
                  <el-option label="最小值" value="min" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="visible" label="显示" width="90" align="center">
              <template #default="{ row }">
                <el-switch v-model="row.visible" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <template #footer>
          <el-button @click="fieldsDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="fieldsSaving" @click="handleSaveFields">保存字段配置</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="previewDialogVisible" :title="previewDialogTitle" width="1080px">
        <div class="dataset-preview-panel">
          <div class="dataset-preview-toolbar">
            <el-input-number v-model="previewLimit" :min="1" :max="500" />
            <el-button type="primary" :loading="previewLoading" @click="handleLoadPreview">刷新预览</el-button>
          </div>
          <el-table v-loading="previewLoading" :data="previewRows" height="520px" size="small">
            <el-table-column
              v-for="column in previewColumns"
              :key="column.fieldName"
              :prop="column.fieldName"
              :label="column.displayName || column.fieldName"
              min-width="140"
              show-overflow-tooltip
            />
          </el-table>
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

const layoutName = 'dataset'
const router = useRouter()

const datasets = ref<DatasetVo.DatasetListItem[]>([])
const listLoading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const keyword = ref('')
const sortField = ref<DatasetDto.DatasetListSortField>('updateTime')
const sortOrder = ref<DatasetDto.DatasetListSortOrder>('desc')

const dataSources = ref<DataSourceVo.DataSourceListItem[]>([])
const tables = ref<DataSourceVo.DataSourceTableItem[]>([])
const tableLoading = ref(false)

const formDialogVisible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()
const form = reactive({
  id: null as number | null,
  datasetName: '',
  datasetDesc: '',
  dataSourceId: null as number | null,
  baseTable: '',
  status: 'enabled' as DatasetDao.DatasetStatus
})
const formTitle = computed(() => (form.id ? '编辑数据集' : '新增数据集'))
const formRules: FormRules = {
  datasetName: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }],
  dataSourceId: [{ required: true, message: '请选择数据源', trigger: 'change' }],
  baseTable: [{ required: true, message: '请选择物理表', trigger: 'change' }]
}

const fieldsDialogVisible = ref(false)
const fieldsLoading = ref(false)
const fieldsSaving = ref(false)
const activeDataset = ref<DatasetVo.DatasetDetailResponse | null>(null)
const editableFields = ref<DatasetDao.DatasetFieldConfigItem[]>([])
const fieldKeyword = ref('')
const changeNote = ref('')
const fieldsDialogTitle = computed(() => `${activeDataset.value?.datasetName || '数据集'}字段配置`)
const filteredFields = computed(() => {
  const normalizedKeyword = fieldKeyword.value.trim().toLowerCase()
  if (!normalizedKeyword) return editableFields.value
  return editableFields.value.filter((field) => {
    return [field.sourceColumnName, field.fieldName, field.displayName].some((value) =>
      String(value || '')
        .toLowerCase()
        .includes(normalizedKeyword)
    )
  })
})

const previewDialogVisible = ref(false)
const previewLoading = ref(false)
const previewDatasetId = ref<number | null>(null)
const previewDatasetName = ref('')
const previewLimit = ref(100)
const previewColumns = ref<DatasetDao.DatasetFieldConfigItem[]>([])
const previewRows = ref<AnalyzeDataVo.AnalyzeData[]>([])
const previewDialogTitle = computed(() => `${previewDatasetName.value || '数据集'}数据预览`)

const getDatasets = async (targetPage = page.value) => {
  listLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetListResponse>>('/api/getDatasets', {
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
      datasets.value = res.data.list || []
      page.value = res.data.page
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取数据集失败')
    }
  } finally {
    listLoading.value = false
  }
}

const handleResetSearch = () => {
  keyword.value = ''
  sortField.value = 'updateTime'
  sortOrder.value = 'desc'
  getDatasets(1)
}

const getDataSources = async () => {
  const res = await httpRequest<ApiResponseI<DataSourceVo.DataSourceListResponse>>('/api/getDataSources', {
    method: 'POST',
    body: {
      page: 1,
      pageSize: 100,
      sortField: 'updateTime',
      sortOrder: 'desc'
    }
  })
  if (res.code === 200 && res.data) {
    dataSources.value = res.data.list || []
  } else {
    dataSources.value = []
    ElMessage.error(res.message || '获取数据源失败')
  }
}

const getTables = async (dataSourceId: number) => {
  tableLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DataSourceVo.DataSourceTableItem[]>>('/api/getDataSourceTables', {
      method: 'POST',
      body: { id: dataSourceId }
    })
    if (res.code === 200) {
      tables.value = res.data || []
      if (!tables.value.length) {
        ElMessage.warning('当前数据源还没有同步表结构，请先到数据源管理中同步')
      }
    } else {
      tables.value = []
      ElMessage.error(res.message || '获取物理表失败')
    }
  } finally {
    tableLoading.value = false
  }
}

const handleDataSourceChange = (dataSourceId: number) => {
  form.baseTable = ''
  tables.value = []
  if (dataSourceId) {
    getTables(dataSourceId)
  }
}

const resetForm = () => {
  form.id = null
  form.datasetName = ''
  form.datasetDesc = ''
  form.dataSourceId = null
  form.baseTable = ''
  form.status = 'enabled'
  tables.value = []
}

const handleOpenCreateDialog = async () => {
  resetForm()
  formDialogVisible.value = true
  await getDataSources()
  nextTick(() => formRef.value?.clearValidate())
}

const handleEditDataset = (item: DatasetVo.DatasetListItem) => {
  form.id = item.id
  form.datasetName = item.datasetName
  form.datasetDesc = item.datasetDesc
  form.dataSourceId = item.dataSourceId
  form.baseTable = item.baseTable
  form.status = item.status
  formDialogVisible.value = true
  nextTick(() => formRef.value?.clearValidate())
}

const handleSaveDataset = async () => {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const body = form.id
      ? {
          id: form.id,
          datasetName: form.datasetName,
          datasetDesc: form.datasetDesc,
          status: form.status
        }
      : {
          datasetName: form.datasetName,
          datasetDesc: form.datasetDesc,
          dataSourceId: form.dataSourceId!,
          baseTable: form.baseTable,
          status: form.status
        }
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetDetailResponse>>(
      form.id ? '/api/updateDataset' : '/api/createDataset',
      {
        method: 'POST',
        body
      }
    )
    if (res.code === 200) {
      ElMessage.success('数据集已保存')
      formDialogVisible.value = false
      getDatasets(form.id ? page.value : 1)
    } else {
      ElMessage.error(res.message || '保存数据集失败')
    }
  } finally {
    saving.value = false
  }
}

const handleDeleteDataset = (item: DatasetVo.DatasetListItem) => {
  ElMessageBox.confirm(`确定删除【${item.datasetName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest<ApiResponseI<boolean>>('/api/deleteDataset', {
      method: 'DELETE',
      body: { id: item.id }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getDatasets(page.value)
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

const getDatasetDetail = async (id: number) => {
  const res = await httpRequest<ApiResponseI<DatasetVo.DatasetDetailResponse>>('/api/getDataset', {
    method: 'POST',
    body: { id }
  })
  if (res.code === 200 && res.data) {
    return res.data
  }
  ElMessage.error(res.message || '获取数据集详情失败')
  return null
}

const handleOpenFieldsDialog = async (item: DatasetVo.DatasetListItem) => {
  fieldsDialogVisible.value = true
  fieldsLoading.value = true
  fieldKeyword.value = ''
  changeNote.value = ''
  try {
    const detail = await getDatasetDetail(item.id)
    if (!detail) {
      fieldsDialogVisible.value = false
      return
    }
    activeDataset.value = detail
    editableFields.value = detail.fieldsConfig.map((field) => ({ ...field }))
  } finally {
    fieldsLoading.value = false
  }
}

const handleSaveFields = async () => {
  if (!activeDataset.value) return
  fieldsSaving.value = true
  try {
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetDetailResponse>>('/api/updateDataset', {
      method: 'POST',
      body: {
        id: activeDataset.value.id,
        fieldsConfig: editableFields.value,
        changeNote: changeNote.value.trim() || '更新字段配置'
      }
    })
    if (res.code === 200) {
      ElMessage.success('字段配置已保存')
      fieldsDialogVisible.value = false
      getDatasets(page.value)
    } else {
      ElMessage.error(res.message || '保存字段配置失败')
    }
  } finally {
    fieldsSaving.value = false
  }
}

const handleOpenPreview = async (item: DatasetVo.DatasetListItem) => {
  previewDatasetId.value = item.id
  previewDatasetName.value = item.datasetName
  previewColumns.value = []
  previewRows.value = []
  previewDialogVisible.value = true
  await handleLoadPreview()
}

const handleLoadPreview = async () => {
  if (!previewDatasetId.value) return
  previewLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetPreviewResponse>>('/api/previewDataset', {
      method: 'POST',
      body: {
        id: previewDatasetId.value,
        limit: previewLimit.value
      }
    })
    if (res.code === 200 && res.data) {
      previewColumns.value = res.data.columns || []
      previewRows.value = res.data.rows || []
    } else {
      previewColumns.value = []
      previewRows.value = []
      ElMessage.error(res.message || '预览数据集失败')
    }
  } finally {
    previewLoading.value = false
  }
}

const formatDate = (value: string) => {
  return value ? value.split('T')[0].slice(0, 10) : ''
}

onMounted(() => {
  getDatasets()
})
</script>

<style scoped lang="scss">
.dataset-search {
  max-width: 340px;
}

.dataset-select {
  width: 140px;
}

.dataset-list-loading {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 20px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dataset-card-action {
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

.dataset-card-action:hover {
  background: #eef6ff;
}

.dataset-card-action--delete:hover {
  background: #ffeaea;
}

.dataset-badge,
.dataset-count {
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 12px;
}

.dataset-badge--enabled {
  color: #047857;
  background: #d1fae5;
}

.dataset-badge--disabled {
  color: #6b7280;
  background: #f3f4f6;
}

.dataset-count {
  color: #2563eb;
  background: #dbeafe;
}

.dataset-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.dataset-fields-panel,
.dataset-preview-panel {
  min-height: 0;
}

.dataset-fields-toolbar,
.dataset-preview-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.dataset-field-search {
  width: 260px;
}

.dataset-change-note {
  width: 360px;
}
</style>
