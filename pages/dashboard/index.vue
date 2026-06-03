<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #header-right>
          <div class="dashboard-header-actions">
            <el-button type="primary" @click="handleOpenCreateDialog">新建看板</el-button>
          </div>
        </template>
      </custom-header>
    </template>

    <template #content>
      <div class="dashboard-list-page">
        <div class="dashboard-toolbar">
          <el-input
            v-model="dashboardKeyword"
            clearable
            placeholder="搜索看板名称或描述"
            class="dashboard-search"
            @keyup.enter="getDashboards(1)"
            @clear="getDashboards(1)"
          />
          <el-select v-model="dashboardSortField" class="dashboard-select" @change="getDashboards(1)">
            <el-option label="最近更新" value="updateTime" />
            <el-option label="创建时间" value="createTime" />
            <el-option label="看板名称" value="dashboardName" />
          </el-select>
          <el-select v-model="dashboardSortOrder" class="dashboard-select" @change="getDashboards(1)">
            <el-option label="降序" value="desc" />
            <el-option label="升序" value="asc" />
          </el-select>
          <el-button type="primary" @click="getDashboards(1)">搜索</el-button>
          <el-button @click="handleResetDashboardSearch">重置</el-button>
        </div>

        <div v-loading="dashboardListLoading" class="dashboard-list">
          <div
            v-for="dashboard in dashboards"
            :key="dashboard.id"
            class="dashboard-card relative h-[180px] w-[245px] cursor-pointer"
            @click="handleOpenDashboard(dashboard.id)"
            :title="`${dashboard.widgetCount} 个分析`"
          >
            <div class="dashboard-card__inset">
              <div class="dashboard-card__title">{{ dashboard.dashboardName }}</div>
              <div class="dashboard-card__desc">{{ dashboard.dashboardDesc || '暂无描述' }}</div>
              <div class="dashboard-card__open-icon" @click.stop="handleOpenDashboard(dashboard.id)">
                <icon-park type="PreviewOpen" size="14" fill="#333" />
              </div>
              <div
                v-if="canManageDashboard(dashboard)"
                class="dashboard-card__permission-icon"
                @click.stop="handleOpenPermissionDialog(dashboard)"
              >
                <icon-park type="Permissions" size="14" fill="#333" />
              </div>
              <div
                v-if="canManageDashboard(dashboard)"
                class="dashboard-card__delete-icon"
                @click.stop="handleDeleteDashboard(dashboard)"
              >
                <icon-park type="DeleteOne" size="14" fill="#333" />
              </div>
              <span class="dashboard-card__badge">{{ dashboard.widgetCount }} 个分析</span>
              <span
                class="dashboard-card__permission-badge"
                :class="`dashboard-card__permission-badge--${dashboard.dashboardPermission || 'view'}`"
              >
                {{ getPermissionText(dashboard.dashboardPermission || 'view') }}
              </span>
              <div class="dashboard-card__info">
                <div class="dashboard-card__info-row">
                  <span class="dashboard-card__creator">{{ dashboard.createdBy || '未知' }}</span>
                  <span class="dashboard-card__time">{{
                    formatDate(dashboard.updateTime || dashboard.createTime)
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <el-empty
            v-if="!dashboardListLoading && dashboards.length === 0"
            class="dashboard-empty"
            description="暂无看板"
          />
        </div>

        <div v-if="dashboardTotal > 0" class="dashboard-pagination">
          <el-pagination
            background
            layout="prev, pager, next, total"
            :current-page="dashboardPage"
            :page-size="dashboardPageSize"
            :total="dashboardTotal"
            @current-change="getDashboards"
          />
        </div>
      </div>

      <el-dialog v-model="createDialogVisible" title="新建看板" width="420px">
        <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px">
          <el-form-item label="名称" prop="dashboardName">
            <el-input v-model="createForm.dashboardName" placeholder="请输入看板名称" />
          </el-form-item>
          <el-form-item label="描述">
            <el-input v-model="createForm.dashboardDesc" type="textarea" :rows="3" placeholder="请输入看板描述" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="creating" @click="handleCreateDashboard">确定</el-button>
        </template>
      </el-dialog>

      <el-dialog v-model="permissionDialogVisible" :title="permissionDialogTitle" width="520px">
        <div v-loading="permissionLoading" class="permission-dialog">
          <div v-for="item in permissionList" :key="item.id" class="permission-row">
            <div class="permission-role">
              <span class="permission-role__name">{{ item.roleName }}</span>
              <span class="permission-role__code">{{ item.roleCode }}</span>
            </div>
            <el-select v-model="item.permissionType" class="permission-select">
              <el-option label="无权限" value="none" />
              <el-option label="仅查看" value="view" />
              <el-option label="可编辑" value="edit" />
              <el-option label="可管理" value="manage" />
            </el-select>
          </div>
        </div>
        <template #footer>
          <el-button @click="permissionDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="permissionSaving" @click="handleSavePermissions">保存</el-button>
        </template>
      </el-dialog>
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'

const layoutName = 'dashboard'
const router = useRouter()
const GRID_COLUMNS = 24
const ROW_HEIGHT = 60

const dashboards = ref<DashboardVo.DashboardListItem[]>([])
const dashboardListLoading = ref(false)
const dashboardPage = ref(1)
const dashboardPageSize = ref(12)
const dashboardTotal = ref(0)
const dashboardKeyword = ref('')
const dashboardSortField = ref<DashboardDto.DashboardListSortField>('updateTime')
const dashboardSortOrder = ref<DashboardDto.DashboardListSortOrder>('desc')

const createDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  dashboardName: '',
  dashboardDesc: ''
})
const createRules: FormRules = {
  dashboardName: [{ required: true, message: '请输入看板名称', trigger: 'blur' }]
}
const permissionDialogVisible = ref(false)
const permissionLoading = ref(false)
const permissionSaving = ref(false)
const permissionResourceId = ref<number | null>(null)
const permissionResourceName = ref('')
const permissionList = ref<PermissionVo.ResourceRolePermissionItem[]>([])
const permissionDialogTitle = computed(
  () => `看板授权${permissionResourceName.value ? `：${permissionResourceName.value}` : ''}`
)
const permissionLevelMap: Record<PermissionVo.ResourcePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}

const getDashboards = async (targetPage = dashboardPage.value) => {
  dashboardListLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DashboardVo.DashboardListResponse>>('/api/getDashboards', {
      method: 'POST',
      body: {
        page: targetPage,
        pageSize: dashboardPageSize.value,
        keyword: dashboardKeyword.value.trim(),
        sortField: dashboardSortField.value,
        sortOrder: dashboardSortOrder.value
      }
    })
    if (res.code === 200 && res.data) {
      dashboards.value = res.data.list || []
      dashboardPage.value = res.data.page
      dashboardTotal.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取看板列表失败')
    }
  } finally {
    dashboardListLoading.value = false
  }
}

const handleResetDashboardSearch = () => {
  dashboardKeyword.value = ''
  dashboardSortField.value = 'updateTime'
  dashboardSortOrder.value = 'desc'
  getDashboards(1)
}

const formatDate = (value: string) => {
  return value ? value.split('T')[0].slice(0, 10) : ''
}

const handleOpenDashboard = (dashboardId: number) => {
  router.push(`/dashboard/${dashboardId}`)
}

const canManageDashboard = (dashboard: DashboardVo.DashboardListItem) => {
  return permissionLevelMap[dashboard.dashboardPermission || 'none'] >= permissionLevelMap.manage
}

const getPermissionText = (permissionType: PermissionVo.ResourcePermissionType) => {
  return (
    {
      none: '无权限',
      view: '仅查看',
      edit: '可编辑',
      manage: '可管理'
    }[permissionType] || '仅查看'
  )
}

const handleOpenCreateDialog = () => {
  createForm.dashboardName = ''
  createForm.dashboardDesc = ''
  createDialogVisible.value = true
  nextTick(() => createFormRef.value?.clearValidate())
}

const handleCreateDashboard = async () => {
  if (!createFormRef.value) return
  const valid = await createFormRef.value.validate().catch(() => false)
  if (!valid) return
  creating.value = true
  try {
    const res = await httpRequest<ApiResponseI<DashboardVo.DashboardDetailResponse>>('/api/createDashboard', {
      method: 'POST',
      body: {
        dashboardName: createForm.dashboardName,
        dashboardDesc: createForm.dashboardDesc,
        layoutConfig: {
          columnCount: GRID_COLUMNS,
          rowHeight: ROW_HEIGHT
        }
      }
    })
    if (res.code === 200 && res.data) {
      createDialogVisible.value = false
      ElMessage.success('看板已创建')
      router.push(`/dashboard/${res.data.id}`)
    } else {
      ElMessage.error(res.message || '创建看板失败')
    }
  } finally {
    creating.value = false
  }
}

const handleDeleteDashboard = (dashboard: DashboardVo.DashboardListItem) => {
  ElMessageBox.confirm(`确定删除【${dashboard.dashboardName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest<ApiResponseI<boolean>>('/api/deleteDashboard', {
      method: 'DELETE',
      body: {
        id: dashboard.id
      }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getDashboards()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

const handleOpenPermissionDialog = async (dashboard: DashboardVo.DashboardListItem) => {
  permissionResourceId.value = dashboard.id
  permissionResourceName.value = dashboard.dashboardName
  permissionDialogVisible.value = true
  permissionLoading.value = true
  permissionList.value = []
  try {
    const res = await httpRequest<ApiResponseI<PermissionVo.ResourceRolePermissionsResponse>>(
      '/api/getResourceRolePermissions',
      {
        method: 'POST',
        body: {
          resourceType: 'dashboard',
          resourceId: dashboard.id
        }
      }
    )
    if (res.code === 200 && res.data) {
      permissionList.value = res.data.list
    } else {
      ElMessage.error(res.message || '获取看板授权失败')
    }
  } finally {
    permissionLoading.value = false
  }
}

const handleSavePermissions = async () => {
  if (!permissionResourceId.value) return
  permissionSaving.value = true
  try {
    const res = await httpRequest<ApiResponseI<PermissionVo.ResourceRolePermissionsResponse>>(
      '/api/updateResourceRolePermissions',
      {
        method: 'POST',
        body: {
          resourceType: 'dashboard',
          resourceId: permissionResourceId.value,
          permissions: permissionList.value.map((item) => ({
            roleId: item.id,
            permissionType: item.permissionType
          }))
        }
      }
    )
    if (res.code === 200) {
      ElMessage.success('授权已保存')
      permissionDialogVisible.value = false
      getDashboards(dashboardPage.value)
    } else {
      ElMessage.error(res.message || '保存看板授权失败')
    }
  } finally {
    permissionSaving.value = false
  }
}

onMounted(() => {
  getDashboards()
})
</script>

<style scoped lang="scss">
.dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-list-page {
  display: flex;
  height: 100%;
  min-height: 0;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
}

.dashboard-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #ebeef5;
}

.dashboard-search {
  max-width: 320px;
}

.dashboard-select {
  width: 140px;
}

.dashboard-list {
  position: relative;
  display: flex;
  flex: 1 1 0;
  flex-wrap: wrap;
  align-content: flex-start;
  align-items: flex-start;
  justify-content: flex-start;
  column-gap: 1.25rem;
  row-gap: 0.6rem;
  min-height: 0;
  overflow: auto;
  padding: 10px;
  background: #f5f7fa;
}

.dashboard-empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dashboard-card {
  position: relative;
  z-index: 1;
  overflow: hidden;
  border-radius: 12px;
  background: #f7f8fa;
  box-shadow:
    0 2px 12px 0 rgba(0, 0, 0, 0.08),
    0 1.5px 6px 0 rgba(0, 0, 0, 0.04);
  font-family: 'Microsoft YaHei';
  transition:
    transform 0.18s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.18s;

  &:hover {
    transform: translateY(-4px) scale(1.03);
    box-shadow:
      0 6px 24px 0 rgba(0, 0, 0, 0.13),
      0 2px 8px 0 rgba(0, 0, 0, 0.08);

    .dashboard-card__open-icon,
    .dashboard-card__permission-icon,
    .dashboard-card__delete-icon {
      display: flex;
    }
  }
}

.dashboard-card__inset {
  position: absolute;
  inset: 2px;
  z-index: 3;
  display: flex;
  height: calc(100% - 4px);
  flex-direction: column;
  justify-content: space-between;
  border-radius: inherit;
  background: #ffffff;
}

.dashboard-card__title {
  margin-top: 24px;
  padding: 0 16px;
  color: #222222;
  font-size: 18px;
  font-weight: bold;
  line-height: 1.4;
  word-break: break-all;
}

.dashboard-card__desc {
  display: -webkit-box;
  margin: 10px 16px 0;
  overflow: hidden;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dashboard-card__open-icon,
.dashboard-card__permission-icon,
.dashboard-card__delete-icon {
  position: absolute;
  top: 10px;
  z-index: 10;
  display: none;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
  transition: background 0.2s;
}

.dashboard-card__open-icon {
  right: 90px;

  &:hover {
    background: #eef6ff;
  }
}

.dashboard-card__permission-icon {
  right: 50px;

  &:hover {
    background: #f0f9eb;
  }
}

.dashboard-card__delete-icon {
  right: 10px;

  &:hover {
    background: #ffeaea;
  }
}

.dashboard-card__badge {
  position: absolute;
  right: 12px;
  bottom: 40px;
  z-index: 4;
  padding: 2px 7px;
  border-radius: 999px;
  color: #2563eb;
  background: #dbeafe;
  font-size: 12px;
}

.dashboard-card__permission-badge {
  position: absolute;
  left: 12px;
  bottom: 40px;
  z-index: 4;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 12px;
}

.dashboard-card__permission-badge--view {
  color: #2563eb;
  background: #dbeafe;
}

.dashboard-card__permission-badge--edit {
  color: #166534;
  background: #dcfce7;
}

.dashboard-card__permission-badge--manage {
  color: #9333ea;
  background: #f3e8ff;
}

.dashboard-card__permission-badge--none {
  color: #6b7280;
  background: #f3f4f6;
}

.dashboard-card__info {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 8px 16px;
  border-radius: 0 0 12px 12px;
  background: rgba(245, 245, 245, 0.85);
  color: #444444;
  font-size: 13px;
  backdrop-filter: blur(2px);
}

.dashboard-card__info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  line-height: 1.8;
}

.dashboard-card__creator {
  color: #666666;
}

.dashboard-card__time {
  color: #999999;
  font-size: 12px;
}

.dashboard-pagination {
  display: flex;
  justify-content: flex-end;
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;
}

.permission-dialog {
  display: flex;
  min-height: 160px;
  flex-direction: column;
  gap: 10px;
}

.permission-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.permission-role {
  display: flex;
  min-width: 0;
  flex: 1 1 0;
  flex-direction: column;
}

.permission-role__name {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
}

.permission-role__code {
  color: #909399;
  font-size: 12px;
}

.permission-select {
  width: 160px;
}
</style>
