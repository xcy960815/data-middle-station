<template>
  <div class="dashboard-bar">
    <div class="dashboard-bar__status">
      <el-tag v-if="editorMode && hasUnsavedChanges" size="small" type="warning">未保存</el-tag>
      <el-tag v-else-if="editorMode && !hasUnsavedChanges" size="small" type="success">已保存</el-tag>
    </div>
    <div class="dashboard-bar__primary">
      <el-button link @click="emit('refresh-dashboard')">刷新</el-button>
      <el-button v-if="canEditDashboard && !editorMode" link @click="emit('enter-editor-mode')">编辑</el-button>
      <template v-if="editorMode">
        <el-button link @click="emit('open-version-dialog')">历史版本</el-button>
        <el-button link @click="emit('cancel-editor-mode')">退出编辑</el-button>
        <el-button link :loading="saving" :disabled="saving || !hasUnsavedChanges" @click="emit('save-dashboard')">
          保存
        </el-button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  editorMode: boolean
  canEditDashboard: boolean
  saving: boolean
  hasUnsavedChanges: boolean
}>()

const emit = defineEmits<{
  'refresh-dashboard': []
  'enter-editor-mode': []
  'cancel-editor-mode': []
  'save-dashboard': []
  'open-version-dialog': []
}>()
</script>

<style scoped lang="scss">
.dashboard-bar {
  display: flex;
  min-height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dashboard-bar__primary,
.dashboard-bar__status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dashboard-bar__primary {
  min-width: 0;
  margin-left: auto;
}

.dashboard-bar__status {
  flex: 0 0 auto;
}
</style>
