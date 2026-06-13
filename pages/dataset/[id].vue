<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #title>
          <HeaderTitle
            v-model:title="datasetForm.datasetName"
            v-model:desc="datasetForm.datasetDesc"
            :editable="!isReadonly"
            title-fallback="未命名数据集"
            desc-fallback="暂无描述"
            title-required-message="数据集名称不能为空"
          />
        </template>
      </custom-header>
    </template>

    <template #bar>
      <DatasetBar
        v-model:preview-limit="previewLimit"
        v-model:status="datasetForm.status"
        :preview-loading="previewLoading"
        :saving="saving"
        :preview-elapsed-ms="previewElapsedMs"
        :readonly="isReadonly"
        :can-manage="canManageDataset"
        :resource-id="isNewDataset ? null : Number(datasetId)"
        :resource-name="datasetForm.datasetName"
        @trial-run="handleTrialRun"
        @open-fields-dialog="handleOpenFieldsDialog"
        @save="handleSaveDataset"
      />
    </template>

    <template #content>
      <div v-loading="detailLoading" class="dataset-detail">
        <section class="dataset-detail__editor">
          <MonacoEditor
            v-if="editorReady"
            v-model="datasetForm.querySql"
            :height="'100%'"
            :width="'100%'"
            :monaco-editor-theme="'vs-dark'"
            :monaco-editor-option="{ readOnly: isReadonly }"
            :database-options="databaseOptions"
          />
        </section>
        <section class="dataset-detail__preview">
          <div v-if="previewError" class="dataset-detail__error">{{ previewError }}</div>
          <ClientOnly v-else>
            <TableChart
              :title="datasetForm.datasetName || '数据预览'"
              :data="previewRows"
              :x-axis-fields="previewTableFields"
              :y-axis-fields="[]"
              :chart-width="'100%'"
              :chart-height="previewChartHeight"
            />
          </ClientOnly>
        </section>
      </div>
    </template>

    <template #dialogs>
      <el-dialog v-model="fieldsDialogVisible" title="字段配置" width="980px">
        <div class="dataset-fields-panel">
          <div class="dataset-fields-toolbar">
            <el-input v-model="fieldKeyword" clearable placeholder="搜索字段名或显示名" class="dataset-field-search" />
            <el-input v-model="changeNote" clearable placeholder="本次变更说明" class="dataset-change-note" />
          </div>
          <el-table :data="filteredFields" height="480px" size="small">
            <el-table-column prop="sortOrder" label="#" width="56" />
            <el-table-column prop="sourceColumnName" label="结果列" min-width="150" show-overflow-tooltip />
            <el-table-column prop="displayName" label="显示名" min-width="170">
              <template #default="{ row }">
                <el-input v-model="row.displayName" size="small" :disabled="isReadonly" />
              </template>
            </el-table-column>
            <el-table-column prop="fieldName" label="字段标识" min-width="150" show-overflow-tooltip />
            <el-table-column prop="dataType" label="类型" min-width="130" show-overflow-tooltip />
            <el-table-column prop="fieldType" label="字段角色" width="120">
              <template #default="{ row }">
                <el-select v-model="row.fieldType" size="small" :disabled="isReadonly">
                  <el-option label="维度" value="dimension" />
                  <el-option label="指标" value="measure" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="aggregationType" label="默认聚合" width="130">
              <template #default="{ row }">
                <el-select v-model="row.aggregationType" size="small" clearable :disabled="isReadonly">
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
                <el-switch v-model="row.visible" :disabled="isReadonly" />
              </template>
            </el-table-column>
          </el-table>
        </div>
        <template #footer>
          <el-button @click="fieldsDialogVisible = false">关闭</el-button>
          <el-button type="primary" :disabled="isReadonly" @click="handleApplyFields">应用到当前预览</el-button>
        </template>
      </el-dialog>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import { useDatabaseSchema } from '@/composables/useDatabaseSchema'
import HeaderTitle from '@/components/header-title/index.vue'
import { createDefaultAnalyzeDimensionFieldRule } from '@/shared/analyzeConfigFieldRules'
import TableChart from '~/components/table-chart/index.vue'
import { ElMessage } from 'element-plus'
import DatasetBar from './components/bar/index.vue'

const MonacoEditor = defineAsyncComponent(() => import('~/components/monaco-editor/index.vue'))

const layoutName = 'dataset'
const route = useRoute()
const router = useRouter()
const { databaseOptions, loadSchema } = useDatabaseSchema()

const DEFAULT_QUERY_SQL = `SELECT *
FROM operation_analysis
LIMIT 100`

const datasetId = computed(() => String(route.params.id || ''))
const isNewDataset = computed(() => datasetId.value === 'new')

const detailLoading = ref(false)
const editorReady = ref(false)
const saving = ref(false)
const previewLoading = ref(false)
const previewError = ref('')
const previewElapsedMs = ref(0)
const previewLimit = ref(100)
const previewRows = ref<AnalyzeDataVo.AnalyzeData[]>([])
const previewColumns = ref<DatasetDao.DatasetFieldConfigItem[]>([])
const previewChartHeight = ref(360)
const datasetPermission = ref<PermissionVo.ResourcePermissionType>('manage')
const permissionLevelMap: Record<PermissionVo.ResourcePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}
const isReadonly = computed(() => {
  if (isNewDataset.value) return false
  return permissionLevelMap[datasetPermission.value] < permissionLevelMap.edit
})
const canManageDataset = computed(() => {
  if (isNewDataset.value) return false
  return permissionLevelMap[datasetPermission.value] >= permissionLevelMap.manage
})
const datasetForm = reactive({
  datasetName: '未命名数据集',
  datasetDesc: '',
  querySql: DEFAULT_QUERY_SQL,
  status: 'enabled' as DatasetDao.DatasetStatus
})

const fieldsDialogVisible = ref(false)
const editableFields = ref<DatasetDao.DatasetFieldConfigItem[]>([])
const fieldKeyword = ref('')
const changeNote = ref('')

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

const previewTableFields = computed<DimensionStore.DimensionOption[]>(() => {
  return previewColumns.value
    .filter((field) => field.visible)
    .map((field, index) => ({
      columnName: field.fieldName,
      displayName: field.displayName || field.fieldName,
      columnType: field.dataType || 'string',
      columnComment: field.displayName || field.fieldName,
      nullable: 'YES',
      ordinalPosition: field.sortOrder || index + 1,
      dimensionRule: createDefaultAnalyzeDimensionFieldRule()
    }))
})

const loadDatasetDetail = async () => {
  if (isNewDataset.value) return
  detailLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetDetailResponse>>('/api/getDataset', {
      method: 'POST',
      body: { id: Number(datasetId.value) }
    })
    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '获取数据集详情失败')
      await router.replace('/dataset')
      return
    }
    datasetForm.datasetName = res.data.datasetName
    datasetForm.datasetDesc = res.data.datasetDesc || ''
    datasetForm.querySql = res.data.querySql || DEFAULT_QUERY_SQL
    datasetForm.status = res.data.status
    datasetPermission.value = res.data.datasetPermission || 'manage'
    previewColumns.value = res.data.fieldsConfig || []
    if (datasetForm.querySql.trim()) {
      await handleTrialRun()
    }
  } finally {
    detailLoading.value = false
  }
}

const handleTrialRun = async () => {
  if (!datasetForm.querySql.trim()) {
    ElMessage.warning('请先编写 SQL')
    return
  }

  previewLoading.value = true
  previewError.value = ''
  try {
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetPreviewResponse>>('/api/previewDatasetSql', {
      method: 'POST',
      body: {
        querySql: datasetForm.querySql,
        limit: previewLimit.value
      }
    })
    if (res.code !== 200 || !res.data) {
      previewRows.value = []
      previewError.value = res.message || '试运行失败'
      return
    }
    previewColumns.value = res.data.columns || []
    previewRows.value = res.data.rows || []
    previewElapsedMs.value = res.data.elapsedMs || 0
  } catch (error) {
    previewRows.value = []
    previewError.value = error instanceof Error ? error.message : '试运行失败'
  } finally {
    previewLoading.value = false
  }
}

const handleSaveDataset = async () => {
  if (isReadonly.value) {
    ElMessage.warning('当前权限不足，无法保存')
    return
  }
  if (!datasetForm.datasetName.trim()) {
    ElMessage.warning('请输入数据集名称')
    return
  }
  if (!datasetForm.querySql.trim()) {
    ElMessage.warning('请先编写 SQL')
    return
  }
  if (!previewColumns.value.length) {
    ElMessage.warning('请先试运行 SQL 并确认结果')
    return
  }

  saving.value = true
  try {
    const body = isNewDataset.value
      ? {
          datasetName: datasetForm.datasetName.trim(),
          datasetDesc: datasetForm.datasetDesc.trim(),
          querySql: datasetForm.querySql,
          status: datasetForm.status,
          fieldsConfig: previewColumns.value
        }
      : {
          id: Number(datasetId.value),
          datasetName: datasetForm.datasetName.trim(),
          datasetDesc: datasetForm.datasetDesc.trim(),
          querySql: datasetForm.querySql,
          status: datasetForm.status,
          fieldsConfig: previewColumns.value,
          changeNote: changeNote.value.trim() || '更新 SQL 数据集'
        }

    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetDetailResponse>>(
      isNewDataset.value ? '/api/createDataset' : '/api/updateDataset',
      {
        method: 'POST',
        body
      }
    )

    if (res.code !== 200 || !res.data) {
      ElMessage.error(res.message || '保存数据集失败')
      return
    }

    ElMessage.success('数据集已保存')
    if (isNewDataset.value) {
      await router.replace(`/dataset/${res.data.id}`)
      return
    }
    previewColumns.value = res.data.fieldsConfig || previewColumns.value
  } finally {
    saving.value = false
  }
}

const handleOpenFieldsDialog = () => {
  if (!previewColumns.value.length) {
    ElMessage.warning('请先试运行 SQL')
    return
  }
  editableFields.value = previewColumns.value.map((field) => ({ ...field }))
  fieldKeyword.value = ''
  fieldsDialogVisible.value = true
}

const handleApplyFields = () => {
  previewColumns.value = editableFields.value.map((field) => ({ ...field }))
  fieldsDialogVisible.value = false
}

const updatePreviewChartHeight = () => {
  const panel = document.querySelector('.dataset-detail__preview') as HTMLElement | null
  if (!panel) return
  previewChartHeight.value = Math.max(240, panel.clientHeight - 12)
}

onMounted(async () => {
  loadSchema()
  if (!isNewDataset.value) {
    await loadDatasetDetail()
  }
  editorReady.value = true
  await nextTick()
  nextTick(() => {
    updatePreviewChartHeight()
    window.addEventListener('resize', updatePreviewChartHeight)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updatePreviewChartHeight)
})

watch(
  () => route.params.id,
  async () => {
    editorReady.value = false
    await loadDatasetDetail()
    editorReady.value = true
  }
)
</script>

<style scoped lang="scss">
.dataset-detail {
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-rows: minmax(280px, 42%) minmax(320px, 1fr);
  gap: 10px;
  padding: 10px;
}

.dataset-detail__editor,
.dataset-detail__preview {
  min-height: 0;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: #ffffff;
}

.dataset-detail__editor {
  background: #1e1e1e;
}

.dataset-detail__preview {
  position: relative;
  padding: 6px;
}

.dataset-detail__error {
  display: flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 16px;
  color: #f56c6c;
  font-size: 13px;
  text-align: center;
}

.dataset-fields-toolbar {
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
