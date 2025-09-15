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
  <SendEmailDtoDialog v-model:visible="emailDialogVisible" ref="emailDialogRef" />
</template>

<script setup lang="ts">
import { ElButton, ElMessage, ElMessageBox, ElTag } from 'element-plus'
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
    title: '确认保存',
    customClass: 'custom-message-box',
    message: h(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          padding: '8px 0'
        }
      },
      [
        // 图标区域
        h(
          'div',
          {
            style: {
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#e6f7ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: '#1890ff'
            }
          },
          '💾'
        ),

        // 主要文本
        h(
          'div',
          {
            style: {
              textAlign: 'center',
              fontSize: '16px',
              color: '#333',
              lineHeight: '1.5'
            }
          },
          [
            h('div', { style: { marginBottom: '8px' } }, '即将保存分析'),
            h(
              'div',
              {
                style: {
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }
              },
              [
                h('span', '「'),
                h(
                  'span',
                  {
                    style: {
                      color: '#1890ff',
                      fontWeight: '600',
                      backgroundColor: '#f0f9ff',
                      padding: '4px 12px',
                      borderRadius: '6px',
                      border: '1px solid #bae7ff'
                    }
                  },
                  analyseStore.getAnalyseName
                ),
                h('span', '」')
              ]
            )
          ]
        ),

        // 提示文本
        h(
          'div',
          {
            style: {
              color: '#666',
              fontSize: '14px',
              textAlign: 'center'
            }
          },
          '确认要保存当前的分析配置吗？'
        )
      ]
    ),
    showCancelButton: true,
    confirmButtonText: '确认保存',
    cancelButtonText: '取消',
    confirmButtonClass: 'el-button--primary',
    cancelButtonClass: 'el-button--default',
    center: true,
    customStyle: {
      borderRadius: '12px',
      padding: '24px'
    }
  })
    .then(() => {
      handleUpdateAnalyse()
    })
    .catch(() => {
      ElMessage.info('已取消保存')
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

<style lang="scss">
.custom-message-box {
  .el-message-box__header {
    text-align: center;
    padding-bottom: 20px;

    .el-message-box__title {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }

  .el-message-box__content {
    padding: 0 20px 20px;
  }
}
</style>
