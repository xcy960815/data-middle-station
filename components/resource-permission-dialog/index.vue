<template>
  <el-dialog v-model="dialogVisible" :title="dialogTitle" width="520px" @close="handleClose">
    <div v-loading="loading" class="permission-dialog">
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
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage } from 'element-plus'

const props = defineProps<{
  resourceType: PermissionVo.ResourceType
  resourceLabel?: string
}>()

const emit = defineEmits<{
  saved: []
}>()

const dialogVisible = ref(false)
const loading = ref(false)
const saving = ref(false)
const resourceId = ref<number | null>(null)
const resourceName = ref('')
const permissionList = ref<PermissionVo.ResourceRolePermissionItem[]>([])

const defaultLabel = computed(() => {
  const labelMap: Record<PermissionVo.ResourceType, string> = {
    analyze: '分析',
    dashboard: '看板',
    dataset: '数据集',
    datasource: '数据源',
    folder: '文件夹',
    scheduled_email: '定时邮件'
  }
  return props.resourceLabel || labelMap[props.resourceType] || '资源'
})

const dialogTitle = computed(() => `${defaultLabel.value}授权${resourceName.value ? `：${resourceName.value}` : ''}`)

const open = async (id: number, name?: string) => {
  resourceId.value = id
  resourceName.value = name || ''
  dialogVisible.value = true
  loading.value = true
  permissionList.value = []
  try {
    const res = await httpRequest<ApiResponseI<PermissionVo.ResourceRolePermissionsResponse>>(
      '/api/getResourceRolePermissions',
      {
        method: 'POST',
        body: {
          resourceType: props.resourceType,
          resourceId: id
        }
      }
    )
    if (res.code === 200 && res.data) {
      permissionList.value = res.data.list
    } else {
      ElMessage.error(res.message || `获取${defaultLabel.value}授权失败`)
    }
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!resourceId.value) return
  saving.value = true
  try {
    const res = await httpRequest<ApiResponseI<PermissionVo.ResourceRolePermissionsResponse>>(
      '/api/updateResourceRolePermissions',
      {
        method: 'POST',
        body: {
          resourceType: props.resourceType,
          resourceId: resourceId.value,
          permissions: permissionList.value.map((item) => ({
            roleId: item.id,
            permissionType: item.permissionType
          }))
        }
      }
    )
    if (res.code === 200) {
      ElMessage.success('授权已保存')
      dialogVisible.value = false
      emit('saved')
    } else {
      ElMessage.error(res.message || `保存${defaultLabel.value}授权失败`)
    }
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  permissionList.value = []
  resourceId.value = null
  resourceName.value = ''
}

defineExpose({ open })
</script>

<style scoped lang="scss">
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
