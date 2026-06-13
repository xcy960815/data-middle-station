<template>
  <div class="dashboard-bar">
    <el-button link @click="emit('refresh-dashboard')" class="mr-auto">刷新</el-button>
    <el-select
      v-if="editorMode || globalRefreshInterval > 0"
      :model-value="globalRefreshInterval"
      :disabled="!editorMode"
      size="small"
      style="width: 110px"
      placeholder="刷新频率"
      @change="emit('change-refresh-interval', $event)"
    >
      <el-option label="不自动刷新" :value="0" />
      <el-option label="10秒" :value="10" />
      <el-option label="30秒" :value="30" />
      <el-option label="1分钟" :value="60" />
      <el-option label="5分钟" :value="300" />
    </el-select>
    <el-button v-if="canEditDashboard && !editorMode" link @click="emit('enter-editor-mode')">编辑</el-button>
    <el-button v-if="canManage" link @click="permissionDialogRef?.open(resourceId!, resourceName)">权限</el-button>
    <template v-if="editorMode">
      <el-button link @click="emit('open-version-dialog')">历史版本</el-button>
      <el-button link @click="emit('cancel-editor-mode')">退出编辑</el-button>
      <el-button link :loading="saving" :disabled="saving || !hasUnsavedChanges" @click="emit('save-dashboard')">
        保存
      </el-button>
    </template>
    <el-tag v-if="editorMode && hasUnsavedChanges" size="small" class="ml-[10px]" type="warning">未保存</el-tag>
    <el-tag v-else-if="editorMode && !hasUnsavedChanges" size="small" class="ml-[10px]" type="success">已保存</el-tag>
  </div>

  <ResourcePermissionDialog v-if="resourceId" ref="permissionDialogRef" resource-type="dashboard" />
</template>

<script setup lang="ts">
import ResourcePermissionDialog from '@/components/resource-permission-dialog/index.vue'

defineProps<{
  editorMode: boolean
  canEditDashboard: boolean
  canManage: boolean
  resourceId: number | null
  resourceName: string
  saving: boolean
  hasUnsavedChanges: boolean
  globalRefreshInterval: number
}>()

const emit = defineEmits<{
  'refresh-dashboard': []
  'enter-editor-mode': []
  'cancel-editor-mode': []
  'save-dashboard': []
  'open-version-dialog': []
  'change-refresh-interval': [value: number]
}>()

const permissionDialogRef = ref<InstanceType<typeof ResourcePermissionDialog>>()
</script>

<style scoped lang="scss">
.dashboard-bar {
  display: flex;
  min-height: 36px;
  align-items: center;
  gap: 12px;
}
</style>
