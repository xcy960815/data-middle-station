<template>
  <div class="bar relative flex">
    <el-button link @click="handleClickRefresh" class="mr-auto"> 刷新 </el-button>
    <el-button link @click="handleClickAlarm">报警</el-button>
    <el-button link @click="handleClickSetting">设置</el-button>
    <el-button link @click="handleClickFullScreen">全屏</el-button>
    <el-button link @click="handleDownload">下载</el-button>
    <el-button link @click="handleClickSendEmailDto">邮件</el-button>
    <el-button link @click="handleAnalyse">保存</el-button>
    <el-tag v-show="chartUpdateTakesTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新耗时 ：{{ chartUpdateTakesTime }}</el-tag
    >
    <el-tag v-show="chartUpdateTime" size="small" class="pr-[10px] ml-[10px]" type="info"
      >更新时间 ：{{ chartUpdateTime }}</el-tag
    >
  </div>

  <!-- 邮件发送对话框 -->
  <SendEmailDtoDialog v-model:visible="emailDialogVisible" :chart-ref="props.chartRef" ref="emailDialogRef" />
</template>

<script setup lang="ts">
import { ElButton, ElMessage, ElTag } from 'element-plus'
import { getChartDataHandler } from '../../getChartData'
import { updateAnalyseHandler } from '../../updateAnalyse'
import SendEmailDtoDialog from './components/send-email-dialog.vue'
const { queryChartData } = getChartDataHandler()
const { handleUpdateAnalyse } = updateAnalyseHandler()
const analyseStore = useAnalyseStore()
const chartConfigStore = useChartConfigStore()
const { handleDownload } = useChartDownload()
const chartUpdateTime = computed(() => analyseStore.getChartUpdateTime)
const chartUpdateTakesTime = computed(() => analyseStore.getChartUpdateTakesTime)

// 发送邮件对话框相关状态
const emailDialogVisible = ref(false)

const emailDialogRef = ref<InstanceType<typeof SendEmailDtoDialog> | null>(null)

// 图表组件引用（需要从父组件传入）
const props = defineProps<{
  chartRef?: SendEmailDto.ChartComponentRef
}>()

const emits = defineEmits<{
  requestChartRef: []
}>()

/**
 * @desc 键盘事件处理
 */
const handleKeyDown = (event: KeyboardEvent) => {
  // Cmd+S (Mac) 或 Ctrl+S (Windows/Linux) 快捷键
  if ((event.metaKey || event.ctrlKey) && event.key === 's') {
    event.preventDefault() // 阻止浏览器默认的保存行为
    handleAnalyse()
  }
}

// 组件挂载时添加键盘事件监听
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除键盘事件监听
onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
/**
 * @desc 点刷新按钮
 * @returns void
 */
const handleClickRefresh = () => {
  queryChartData()
}
/**
 * @desc 点报警按钮
 * @returns void
 */
const handleClickAlarm = () => {
  console.log('handleClickAlarm')
}
/**
 * @desc 点设置按钮
 * @returns void
 */
const handleClickSetting = () => {
  chartConfigStore.setChartConfigDrawer(true)
}
/**
 * @desc 点全屏按钮
 * @returns void
 */
const handleClickFullScreen = () => {
  console.log('handleClickFullScreen')
}

/**
 * @desc 点保存按钮
 * @returns void
 */
const handleAnalyse = () => {
  // 给用户提示
  ElMessageBox({
    title: '请确认',
    message: h('div', [
      '确认保存分析',
      h(
        'span',
        {
          style: {
            color: '#409eff',
            fontWeight: 'bold',
            backgroundColor: '#ecf5ff',
            padding: '2px 6px',
            borderRadius: '4px',
            margin: '0 4px'
          }
        },
        analyseStore.getAnalyseName
      ),
      '吗？'
    ]),
    showCancelButton: true,
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  })
    .then(() => {
      handleUpdateAnalyse()
    })
    .catch(() => {
      ElMessage.info('取消保存')
    })
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
