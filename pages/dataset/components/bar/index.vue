<template>
  <div class="dataset-bar">
    <div class="dataset-bar__primary">
      <el-input-number :model-value="previewLimit" :min="1" :max="500" @update:model-value="updatePreviewLimit" />
      <el-button link :loading="previewLoading" @click="emit('trial-run')">试运行</el-button>
      <el-button link :loading="saving" @click="emit('open-fields-dialog')">字段配置</el-button>
      <el-button link :loading="saving" @click="emit('save')">保存</el-button>
      <el-tag v-if="previewElapsedMs" size="small" type="info">{{ previewElapsedMs }} ms</el-tag>
    </div>
    <el-select :model-value="status" class="dataset-bar__status" @update:model-value="updateStatus">
      <el-option label="启用" value="enabled" />
      <el-option label="禁用" value="disabled" />
    </el-select>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  previewLimit: number
  status: DatasetDao.DatasetStatus
  previewLoading: boolean
  saving: boolean
  previewElapsedMs: number
}>()

const emit = defineEmits<{
  'trial-run': []
  'open-fields-dialog': []
  save: []
  'update:previewLimit': [value: number]
  'update:status': [value: DatasetDao.DatasetStatus]
}>()

const updatePreviewLimit = (value: number | undefined) => {
  emit('update:previewLimit', value ?? 100)
}

const updateStatus = (value: DatasetDao.DatasetStatus) => {
  emit('update:status', value)
}
</script>

<style scoped lang="scss">
.dataset-bar {
  display: flex;
  width: 100%;
  min-height: 36px;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
}

.dataset-bar__primary {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.dataset-bar__status {
  width: 120px;
  flex: 0 0 auto;
}
</style>
