<template>
  <el-dialog
    :model-value="visible"
    title="历史版本"
    width="760px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="emit('update:visible', $event)"
  >
    <div v-loading="loading">
      <el-table :data="versionList" stripe border>
        <el-table-column prop="versionNo" label="版本号" width="100" />
        <el-table-column label="当前版本" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.id === currentConfigId" type="success">当前版本</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="widgetCount" label="组件数" width="100" align="center" />
        <el-table-column prop="createdBy" label="创建人" min-width="120" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              :disabled="row.id === currentConfigId || switching"
              @click="emit('switch-version', row)"
            >
              {{ row.id === currentConfigId ? '当前版本' : '切换' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && versionList.length === 0" description="暂无历史版本" />
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:visible', false)">关闭</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
  loading: boolean
  switching: boolean
  versionList: DashboardVo.DashboardConfigHistoryItem[]
  currentConfigId?: number | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  'switch-version': [row: DashboardVo.DashboardConfigHistoryItem]
}>()
</script>
