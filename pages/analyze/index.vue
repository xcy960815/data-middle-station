<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #nav />
        <template #header-right>
          <el-tooltip effect="dark" content="创建分析" placement="bottom">
            <icon-park
              type="newlybuild"
              size="30"
              fill="#333"
              class="cursor-pointer"
              @click="handleCreateAnalyze"
            ></icon-park>
          </el-tooltip>
        </template>
      </custom-header>
    </template>
    <template #content>
      <div class="analyze-list-page flex h-full min-h-0 flex-col overflow-hidden">
        <div class="analyze-list-toolbar flex items-center gap-3 px-4 py-3">
          <el-input
            v-model="keyword"
            clearable
            placeholder="搜索分析名称或描述"
            class="toolbar-search"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-select v-model="sortField" class="toolbar-select" @change="handleSortChange">
            <el-option v-for="item in sortFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="sortOrder" class="toolbar-select" @change="handleSortChange">
            <el-option v-for="item in sortOrderOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
          <el-select v-model="pageSize" class="toolbar-select toolbar-page-size" @change="handlePageSizeChange">
            <el-option v-for="size in pageSizeOptions" :key="size" :label="`${size} 条/页`" :value="size" />
          </el-select>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </div>

        <div class="analyze-list-container relative h-full" v-loading="listLoading">
          <ListCard
            class="card-chart"
            v-for="chart in analyzeList"
            :key="chart.id"
            :title="chart.analyzeName"
            :title-attr="`访问次数${chart.viewCount}`"
            :creator="chart.createdBy"
            :time="formatDate(chart.createTime)"
            @click="handleOpenAnalyze(chart.id)"
          >
            <template #actions>
              <button
                v-if="canEditAnalyze(chart)"
                class="analyze-list-card-action analyze-list-card-action--edit"
                type="button"
                @click.stop="handleEditAnalyze(chart.id)"
              >
                <icon-park type="Edit" size="14" fill="#333" />
              </button>
              <button
                v-if="canManageAnalyze(chart)"
                class="analyze-list-card-action analyze-list-card-action--permission"
                type="button"
                @click.stop="permissionDialogRef?.open(chart.id, chart.analyzeName)"
              >
                <icon-park type="Permissions" size="14" fill="#333" />
              </button>
              <button
                v-if="canManageAnalyze(chart)"
                class="analyze-list-card-action analyze-list-card-action--delete"
                type="button"
                @click.stop="handleDeleteAnalyze(chart.id, chart.analyzeName)"
              >
                <icon-park type="DeleteOne" size="14" fill="#333" />
              </button>
            </template>
            <template #right-badges>
              <span
                class="analyze-list-card__permission-badge"
                :class="`analyze-list-card__permission-badge--${chart.analyzePermission || 'view'}`"
              >
                {{ getAnalyzePermissionText(chart.analyzePermission || 'view') }}
              </span>
            </template>
          </ListCard>

          <el-empty
            v-if="!listLoading && analyzeList.length === 0"
            class="analyze-list-empty"
            description="暂无符合条件的分析"
          />
        </div>

        <div class="analyze-list-pagination px-4 py-3 flex justify-end" v-if="total > 0">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            @current-change="handlePageChange"
          />
        </div>
      </div>

      <el-dialog v-model="addOrEditAnalyzeDialogVisible" :title="addOrEditAnalyzeTitle" width="30%">
        <el-form
          :model="addOrEditAnalyzeFormData"
          ref="addOrEditAnalyzeFormRef"
          label-width="auto"
          :rules="addOrEditAnalyzeFormRules"
        >
          <el-form-item label="分析名称" prop="analyzeName">
            <el-input v-model="addOrEditAnalyzeFormData.analyzeName" placeholder="请输入分析名称" />
          </el-form-item>
          <el-form-item label="分析描述" prop="analyzeDesc">
            <el-input v-model="addOrEditAnalyzeFormData.analyzeDesc" placeholder="请输入分析描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addOrEditAnalyzeDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveAnalyze">确定</el-button>
          </span>
        </template>
      </el-dialog>

      <ResourcePermissionDialog ref="permissionDialogRef" resource-type="analyze" @saved="getAnalyzes(page)" />
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import ListCard from '@/components/list-card/index.vue'
import ResourcePermissionDialog from '@/components/resource-permission-dialog/index.vue'
import { httpRequest } from '@/composables/useHttpRequest'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const layoutName = 'analyze'
const analyzeList = ref<AnalyzeVo.AnalyzeListItem[]>([])
const total = ref(0)
const listLoading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const keyword = ref('')
const sortField = ref<AnalyzeDto.AnalyzeListSortField>('updateTime')
const sortOrder = ref<AnalyzeDto.AnalyzeListSortOrder>('desc')
const pageSizeOptions = [12, 24, 48]
const sortFieldOptions: Array<{ label: string; value: AnalyzeDto.AnalyzeListSortField }> = [
  { label: '最近更新', value: 'updateTime' },
  { label: '创建时间', value: 'createTime' },
  { label: '访问次数', value: 'viewCount' },
  { label: '分析名称', value: 'analyzeName' }
]
const sortOrderOptions: Array<{ label: string; value: AnalyzeDto.AnalyzeListSortOrder }> = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' }
]

const addOrEditAnalyzeFormRef = ref<FormInstance>()
const addOrEditAnalyzeTitle = ref('创建分析')
const addOrEditAnalyzeDialogVisible = ref(false)
const addOrEditAnalyzeFormData = reactive<{
  id: number | null
  analyzeName: string
  analyzeDesc: string
}>({
  id: null,
  analyzeName: '',
  analyzeDesc: ''
})
const addOrEditAnalyzeFormRules: FormRules = {
  analyzeName: [
    {
      required: true,
      message: '请输入分析名称',
      trigger: 'blur'
    }
  ],
  analyzeDesc: [
    {
      required: true,
      message: '请输入分析描述',
      trigger: 'blur'
    }
  ]
}

const permissionDialogRef = ref<InstanceType<typeof ResourcePermissionDialog>>()
const permissionLevelMap: Record<PermissionVo.AnalyzePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}

const getAnalyzes = async (targetPage = page.value) => {
  listLoading.value = true
  const res = await httpRequest<ApiResponseI<AnalyzeVo.AnalyzeListResponse>>('/api/getAnalyzes', {
    method: 'POST',
    body: {
      page: targetPage,
      pageSize: pageSize.value,
      keyword: keyword.value.trim(),
      sortField: sortField.value,
      sortOrder: sortOrder.value
    }
  }).finally(() => {
    listLoading.value = false
  })
  if (res.code === 200 && res.data) {
    page.value = res.data.page
    pageSize.value = res.data.pageSize
    analyzeList.value = res.data.list || []
    total.value = res.data.total || 0
  } else {
    analyzeList.value = []
    total.value = 0
    ElMessage.error(res.message || '获取分析列表失败')
  }
}

const handleSearch = () => {
  getAnalyzes(1)
}

const handleReset = () => {
  keyword.value = ''
  sortField.value = 'updateTime'
  sortOrder.value = 'desc'
  pageSize.value = 12
  getAnalyzes(1)
}

const handleSortChange = () => {
  getAnalyzes(1)
}

const handlePageSizeChange = () => {
  getAnalyzes(1)
}

const handlePageChange = (nextPage: number) => {
  getAnalyzes(nextPage)
}

const formatDate = (value: string) => {
  return value ? value.split('T')[0].slice(0, 10) : ''
}

const handleOpenAnalyze = (id: number) => {
  navigateTo(`/analyze/${id}`)
}

const canEditAnalyze = (analyze: AnalyzeVo.AnalyzeListItem) => {
  return permissionLevelMap[analyze.analyzePermission || 'none'] >= permissionLevelMap.edit
}

const canManageAnalyze = (analyze: AnalyzeVo.AnalyzeListItem) => {
  return permissionLevelMap[analyze.analyzePermission || 'none'] >= permissionLevelMap.manage
}

const getAnalyzePermissionText = (permissionType: PermissionVo.AnalyzePermissionType) => {
  return (
    {
      none: '无权限',
      view: '只读',
      edit: '可编辑',
      manage: '可管理'
    }[permissionType] || '只读'
  )
}

const handleDeleteAnalyze = (id: number, analyzeName: string) => {
  ElMessageBox.confirm(`确定删除【${analyzeName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest('/api/deleteAnalyze', {
      method: 'DELETE',
      body: {
        id
      }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getAnalyzes()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

/**
 * 编辑分析
 * @param id
 */
const handleEditAnalyze = async (id: number) => {
  const res = await httpRequest('/api/getAnalyze', {
    method: 'POST',
    body: {
      id
    }
  })
  if (res.code === 200) {
    addOrEditAnalyzeFormData.id = res.data?.id || null
    addOrEditAnalyzeFormData.analyzeName = res.data?.analyzeName || ''
    addOrEditAnalyzeFormData.analyzeDesc = res.data?.analyzeDesc || ''
  }
  addOrEditAnalyzeTitle.value = '编辑分析'
  addOrEditAnalyzeDialogVisible.value = true
  nextTick(() => {
    addOrEditAnalyzeFormRef.value?.clearValidate()
  })
}

const handleCreateAnalyze = () => {
  addOrEditAnalyzeFormData.id = null
  addOrEditAnalyzeFormData.analyzeName = ''
  addOrEditAnalyzeFormData.analyzeDesc = ''
  addOrEditAnalyzeDialogVisible.value = true
  addOrEditAnalyzeTitle.value = '创建分析'
  nextTick(() => {
    addOrEditAnalyzeFormRef.value?.clearValidate()
  })
}

const handleSaveAnalyze = async () => {
  if (!addOrEditAnalyzeFormRef.value) return
  const valid = await addOrEditAnalyzeFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (addOrEditAnalyzeFormData.id) {
    const res = await httpRequest('/api/updateAnalyze', {
      method: 'POST',
      body: {
        id: addOrEditAnalyzeFormData.id,
        analyzeName: addOrEditAnalyzeFormData.analyzeName,
        analyzeDesc: addOrEditAnalyzeFormData.analyzeDesc
      }
    })
    if (res.code === 200) {
      ElMessage.success('更新成功')
      addOrEditAnalyzeDialogVisible.value = false
      getAnalyzes()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } else {
    const res = await httpRequest('/api/createAnalyze', {
      method: 'POST',
      body: {
        analyzeName: addOrEditAnalyzeFormData.analyzeName,
        analyzeDesc: addOrEditAnalyzeFormData.analyzeDesc
      }
    })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      addOrEditAnalyzeDialogVisible.value = false
      getAnalyzes()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  }
}

onMounted(() => {
  getAnalyzes()
})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/theme-util.scss' as theme;

.analyze-list-container {
  @include theme.useTheme {
    background-color: theme.getVar('bgColor');
  }

  display: flex;
  flex: 1 1 0;
  flex-wrap: wrap;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  padding: 10px;
  margin: 0;
  overflow-x: hidden;
  overflow-y: auto;
  justify-content: flex-start;
  align-items: flex-start;
  align-content: flex-start;
  column-gap: 1.25rem;
  row-gap: 0.6rem;
}

.analyze-list-toolbar {
  .toolbar-search {
    max-width: 320px;
  }

  .toolbar-select {
    width: 140px;
  }

  .toolbar-page-size {
    width: 120px;
  }
}

.card-chart {
  margin: 0;
}

.analyze-list-card-action {
  display: flex;
  height: 28px;
  width: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  cursor: pointer;
  padding: 0;
  transition: background 0.2s;
}

.analyze-list-card-action--edit:hover {
  background: #f0f9ff;
}

.analyze-list-card-action--permission:hover {
  background: #eef6ff;
}

.analyze-list-card-action--delete:hover {
  background: #ffeaea;
}

.analyze-list-card__permission-badge {
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 12px;
}

.analyze-list-card__permission-badge--view {
  color: #2563eb;
  background: #dbeafe;
}

.analyze-list-card__permission-badge--edit {
  color: #047857;
  background: #d1fae5;
}

.analyze-list-card__permission-badge--manage {
  color: #7c3aed;
  background: #ede9fe;
}

.analyze-list-card__permission-badge--none {
  color: #6b7280;
  background: #f3f4f6;
}

.analyze-list-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
