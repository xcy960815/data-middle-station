<template>
  <div class="bar relative flex">
    <el-button link @click="handleClickRefresh" class="mr-auto"> 刷新 </el-button>
    <el-button link @click="handleClickAlarm">报警</el-button>
    <el-button link @click="handleOpenVersionDialog">历史版本</el-button>
    <el-button link @click="handleClickSetting">设置</el-button>
    <el-button link @click="handleDownload">下载</el-button>
    <el-button link @click="handleClickSendEmailDto">邮件</el-button>
    <el-button v-if="canManageAnalyze" link @click="handleOpenPermissionDialog">权限</el-button>
    <el-button link @click="handleAnalyze" :loading="editorSaving" :disabled="!editorDirty && !editorSaving"
      >保存</el-button
    >
    <el-tag v-show="editorDirty" size="small" class="pr-[10px] ml-[10px]" type="warning">未保存</el-tag>
    <el-tag v-show="!editorDirty && lastSavedAt" size="small" class="pr-[10px] ml-[10px]" type="success"
      >已保存：{{ lastSavedAt }}</el-tag
    >
    <el-tag v-show="chartUpdateTakesTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新耗时 ：{{ chartUpdateTakesTime }}</el-tag
    >
    <el-tag v-show="chartUpdateTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新时间 ：{{ chartUpdateTime }}</el-tag
    >
  </div>

  <!-- 邮件发送对话框 -->
  <SendEmailDtoDialog v-model:visible="emailDialogVisible" ref="emailDialogRef" />

  <!-- 报警配置对话框 -->
  <AlarmDialog ref="alarmDialogRef" />

  <VersionDialog ref="versionDialogRef" />

  <!-- 权限配置弹窗 -->
  <ResourcePermissionDialog ref="permissionDialogRef" resource-type="analyze" />
</template>

<script setup lang="ts">
import { useChartDownload } from '@/composables/useChartDownload'
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
import { onBeforeRouteLeave } from 'vue-router'
import { updateAnalyzeHandler } from '../../updateAnalyze'
import { useAnalyzeDataHandler } from '../../useAnalyzeDataHandler'
import { useAnalyzeHandler } from '../../useAnalyzeHandler'
import SendEmailDtoDialog from './components/send-email-dialog.vue'
import AlarmDialog from '../alarm-dialog.vue'
import VersionDialog from '../version-dialog.vue'
import ResourcePermissionDialog from '@/components/resource-permission-dialog/index.vue'
const { handleUpdateAnalyze, serializeAnalyzeDraft } = updateAnalyzeHandler()
const { getAnalyzeData } = useAnalyzeDataHandler()
const { analyzePermission } = useAnalyzeHandler()
const analyzeStore = useAnalyzeStore()
const chartConfigStore = useChartConfigStore()
const { handleDownload } = useChartDownload()
const chartUpdateTime = computed(() => analyzeStore.getChartUpdateTime)
const chartUpdateTakesTime = computed(() => analyzeStore.getChartUpdateTakesTime)
const editorDirty = computed(() => analyzeStore.getEditorDirty)
const editorSaving = computed(() => analyzeStore.getEditorSaving)
const lastSavedAt = computed(() => analyzeStore.getLastSavedAt)
const draftSnapshot = computed(() => serializeAnalyzeDraft())

const permissionDialogRef = ref<InstanceType<typeof ResourcePermissionDialog>>()
const permissionLevelMap: Record<PermissionVo.AnalyzePermissionType, number> = {
  none: 0,
  view: 1,
  edit: 2,
  manage: 3
}
const canManageAnalyze = computed(() => {
  return permissionLevelMap[analyzePermission.value] >= permissionLevelMap.manage
})
const handleOpenPermissionDialog = () => {
  const id = analyzeStore.getAnalyzeId
  if (id != null) {
    permissionDialogRef.value?.open(id, analyzeStore.getAnalyzeName)
  }
}

// 发送邮件对话框相关状态
const emailDialogVisible = ref(false)

const emailDialogRef = ref<InstanceType<typeof SendEmailDtoDialog> | null>(null)
const alarmDialogRef = ref<InstanceType<typeof AlarmDialog> | null>(null)
const versionDialogRef = ref<InstanceType<typeof VersionDialog> | null>(null)

const emits = defineEmits<{
  requestChartRef: []
}>()

watch(
  draftSnapshot,
  (snapshot) => {
    if (analyzeStore.getEditorHydrating) return
    analyzeStore.setEditorDirty(snapshot !== analyzeStore.getLastSavedSnapshot)
  },
  {
    immediate: true
  }
)

/**
 * @desc 键盘事件处理
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Cmd+S (Mac) 或 Ctrl+S (Windows/Linux) 快捷键
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault() // 阻止浏览器默认的保存行为
    void handleAnalyze()
  }
}

const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  if (!analyzeStore.getEditorDirty || analyzeStore.getEditorSaving) return
  event.preventDefault()
  event.returnValue = ''
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

onBeforeRouteLeave(async () => {
  if (!analyzeStore.getEditorDirty || analyzeStore.getEditorSaving) {
    return true
  }

  try {
    await ElMessageBox.confirm('当前分析有未保存的改动，确认要离开当前页面吗？', '未保存改动', {
      type: 'warning',
      confirmButtonText: '仍然离开',
      cancelButtonText: '继续编辑'
    })
    return true
  } catch (_error) {
    return false
  }
})
/**
 * @desc 点刷新按钮
 * @returns void
 */
const handleClickRefresh = async () => {
  getAnalyzeData({ force: true })
}
/**
 * @desc 点报警按钮
 * @returns void
 */
const handleClickAlarm = () => {
  alarmDialogRef.value?.open()
}

const handleOpenVersionDialog = async () => {
  versionDialogRef.value?.open()
}
/**
 * @desc 点设置按钮
 * @returns void
 */
const handleClickSetting = () => {
  chartConfigStore.setChartConfigDrawer(true)
}
/**
 * @desc 点保存按钮
 * @returns void
 */
const handleAnalyze = async () => {
  if (!analyzeStore.getEditorDirty && !analyzeStore.getEditorSaving) {
    ElMessage.info('当前没有需要保存的改动')
    return
  }

  await handleUpdateAnalyze()
}

/**
 * @desc 发送邮件按钮点击事件
 */
const handleClickSendEmailDto = () => {
  // 确保图表引用可用
  emits('requestChartRef')
  emailDialogVisible.value = true
}
</script>

<style lang="scss" scoped>
.bar {
  display: flex;
  align-items: center;
}
</style>
