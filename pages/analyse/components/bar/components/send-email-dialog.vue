<template>
  <el-dialog v-model="dialogVisible" title="发送图表邮件" width="800px" :close-on-click-modal="false">
    <el-form
      ref="emailFormRef"
      :model="emailFormData"
      :rules="emailFormRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="收件人" prop="to">
        <el-input
          v-model="emailFormData.to"
          placeholder="请输入收件人邮箱，多个邮箱用逗号分隔"
          type="textarea"
          :rows="2"
        />
      </el-form-item>

      <el-form-item label="邮件主题" prop="subject">
        <el-input v-model="emailFormData.subject" placeholder="请输入邮件主题" />
      </el-form-item>

      <!-- 发送模式选择 -->
      <el-form-item label="发送模式" prop="sendMode">
        <el-radio-group v-model="emailFormData.sendMode">
          <el-radio value="immediate">立即发送</el-radio>
          <el-radio value="scheduled">定时发送</el-radio>
        </el-radio-group>
      </el-form-item>

      <!-- 定时发送设置 -->
      <template v-if="emailFormData.sendMode === 'scheduled'">
        <el-form-item label="执行时间" prop="scheduleTime">
          <el-date-picker
            v-model="emailFormData.scheduleTime"
            type="datetime"
            placeholder="选择执行时间"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-date="disabledDate"
            :disabled-hours="disabledHours"
            :disabled-minutes="disabledMinutes"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="emailFormData.taskName"
            placeholder="为这个定时任务起个名字（可选）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="emailFormData.remark"
            type="textarea"
            placeholder="对这个定时任务的补充说明（可选）"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </template>

      <el-form-item label="额外说明">
        <el-input
          v-model="emailFormData.additionalContent"
          placeholder="可添加额外的说明内容（可选）"
          type="textarea"
          :rows="3"
        />
      </el-form-item>

      <el-form-item>
        <div class="text-sm text-gray-600">
          <p>📊 将会发送当前图表的高清图片</p>
          <p>📧 邮件将包含完整的数据分析报告</p>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" :disabled="isSending">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="isSending">
          {{ getConfirmButtonText() }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRadio,
  ElRadioGroup
} from 'element-plus'

export interface EmailFormData {
  to: string // 收件人邮箱地址
  subject: string // 邮件主题
  additionalContent: string // 额外消息内容
  sendMode: 'immediate' | 'scheduled' // 发送模式：立即发送 | 定时发送
  taskName: string // 任务名称（定时发送时使用）
  scheduleTime: string | null // 计划执行时间
  remark: string // 备注说明
}

const props = defineProps<{
  visible: boolean
  chartRef?: ChartComponentRef
}>()

const emits = defineEmits<{
  'update:visible': [value: boolean]
}>()

// 响应式状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emits('update:visible', value)
})

/**
 * @desc 邮件表单数据
 */
const emailFormData = reactive<EmailFormData>({
  to: 'xinxin87v5@icloud.com',
  subject: '',
  additionalContent: '',
  sendMode: 'immediate',
  taskName: '',
  scheduleTime: null,
  remark: ''
})

// 表单引用
const emailFormRef = ref<FormInstance | null>(null)

// 获取邮件相关函数
const { validateEmails, sendEmailFromChartRef, exportChartsFromRef } = useSendChartEmail()

// 发送状态
const isSending = ref(false)

// 表单验证规则
const emailFormRules: FormRules<EmailFormData> = {
  to: [
    { required: true, message: '请输入收件人邮箱', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback: Function) => {
        if (!value) {
          callback(new Error('请输入收件人邮箱'))
          return
        }
        const emails = value
          .split(',')
          .map((email) => email.trim())
          .filter((email) => email)
        const emailValidation = validateEmails(emails)
        if (!emailValidation.valid) {
          callback(new Error(`邮件地址格式错误: ${emailValidation.invalidEmails.join(', ')}`))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  subject: [
    { required: true, message: '请输入邮件主题', trigger: 'blur' },
    { min: 1, max: 200, message: '邮件主题长度应在 1 到 200 个字符之间', trigger: 'blur' }
  ],
  sendMode: [{ required: true, message: '请选择发送模式', trigger: 'change' }],
  scheduleTime: [
    {
      validator: (_rule: any, value: any, callback: Function) => {
        if (emailFormData.sendMode === 'scheduled') {
          if (!value) {
            callback(new Error('请选择执行时间'))
            return
          }
          const scheduleDate = new Date(value)
          const now = new Date()
          if (scheduleDate <= now) {
            callback(new Error('执行时间必须大于当前时间'))
            return
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  taskName: [{ max: 100, message: '任务名称不能超过100个字符', trigger: 'blur' }]
}

// 获取 store
const analyseStore = useAnalyseStore()

// 生成默认邮件主题
const generateDefaultSubject = () => {
  return `数据分析报告 - ${analyseStore.getAnalyseName || '无标题'} (${new Date().toLocaleDateString('zh-CN')})`
}

// 生成默认任务名称
const generateDefaultTaskName = () => {
  return `${emailFormData.subject} - 定时发送`
}

// 获取确认按钮文本
const getConfirmButtonText = () => {
  if (isSending.value) {
    return emailFormData.sendMode === 'immediate' ? '发送中...' : '保存中...'
  }
  return emailFormData.sendMode === 'immediate' ? '发送邮件' : '保存定时任务'
}

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 24 * 60 * 60 * 1000
}

// 禁用过去的小时
const disabledHours = () => {
  const now = new Date()
  const selectedDate = emailFormData.scheduleTime ? new Date(emailFormData.scheduleTime) : null

  if (!selectedDate) return []

  // 如果是今天，禁用过去的小时
  if (selectedDate.toDateString() === now.toDateString()) {
    const currentHour = now.getHours()
    return Array.from({ length: currentHour + 1 }, (_, i) => i)
  }

  return []
}

// 禁用过去的分钟
const disabledMinutes = (hour: number) => {
  const now = new Date()
  const selectedDate = emailFormData.scheduleTime ? new Date(emailFormData.scheduleTime) : null

  if (!selectedDate) return []

  // 如果是今天且是当前小时，禁用过去的分钟
  if (selectedDate.toDateString() === now.toDateString() && hour === now.getHours()) {
    const currentMinute = now.getMinutes()
    return Array.from({ length: currentMinute + 1 }, (_, i) => i)
  }

  return []
}

// 监听对话框显示状态，设置默认主题
// 监听发送模式变化，自动生成任务名称
watch(
  () => emailFormData.sendMode,
  (newMode) => {
    if (newMode === 'scheduled' && !emailFormData.taskName) {
      emailFormData.taskName = generateDefaultTaskName()
    }
  }
)

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      emailFormData.subject = generateDefaultSubject()
      // 重置定时发送设置
      emailFormData.sendMode = 'immediate'
      emailFormData.scheduleTime = null
      emailFormData.taskName = ''
      emailFormData.remark = ''
    }
  }
)

/**
 * @desc 确认发送邮件
 */
const handleConfirm = async () => {
  // 表单验证
  const valid = await emailFormRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }

  // 检查必要的参数
  if (!props.chartRef) {
    ElMessage.error('无法获取图表引用，请稍后重试')
    return
  }

  const analyseName = analyseStore.getAnalyseName
  isSending.value = true

  try {
    if (emailFormData.sendMode === 'immediate') {
      // 立即发送
      ElMessage.info('正在发送邮件...')
      const result = await sendEmailFromChartRef(props.chartRef, analyseName, emailFormData, analyseName)
      ElMessage.success(`邮件发送成功！消息ID: ${result.data?.messageId}`)
    } else {
      // 定时发送
      ElMessage.info('正在保存定时任务...')
      await saveScheduledTask()
      ElMessage.success('定时任务保存成功！')
    }

    emits('update:visible', false)
    resetEmailForm()
  } catch (error) {
    const errorMessage =
      emailFormData.sendMode === 'immediate' ? '邮件发送失败，请稍后重试' : '定时任务保存失败，请稍后重试'
    ElMessage.error(errorMessage)
    console.error('操作错误:', error)
  } finally {
    isSending.value = false
  }
}

/**
 * 保存定时任务
 */
const saveScheduledTask = async () => {
  // 导出图表数据
  const chartData = await exportChartsFromRef(
    props.chartRef!,
    analyseStore.getAnalyseName || '图表',
    analyseStore.getAnalyseName
  )

  // 构建定时任务数据
  const scheduleTaskData: ScheduleTaskDto.ScheduleTaskOptions = {
    taskName: emailFormData.taskName || generateDefaultTaskName(),
    taskType: 'email',
    scheduleTime: emailFormData.scheduleTime!,
    emailConfig: {
      to: emailFormData.to,
      subject: emailFormData.subject,
      additionalContent: emailFormData.additionalContent
    },
    chartData: {
      chartId: chartData.chartId,
      title: chartData.title,
      base64Image: chartData.base64Image,
      filename: chartData.filename,
      analyseName: analyseStore.getAnalyseName
    },
    remark: emailFormData.remark
  }

  // 调用API保存定时任务
  const response = await $fetch('/api/scheduleTasks', {
    method: 'POST',
    body: scheduleTaskData
  })

  return response
}

/**
 * @desc 取消发送邮件
 */
const handleCancel = () => {
  // 重置表单验证状态
  if (emailFormRef.value) {
    emailFormRef.value.resetFields()
  }

  emits('update:visible', false)
}

// 重置邮件表单的方法，供父组件调用
const resetEmailForm = () => {
  if (emailFormRef.value) {
    emailFormRef.value.resetFields()
  }
  emailFormData.to = 'xinxin87v5@icloud.com'
  emailFormData.subject = ''
  emailFormData.additionalContent = ''
  emailFormData.sendMode = 'immediate'
  emailFormData.taskName = ''
  emailFormData.scheduleTime = null
  emailFormData.remark = ''
}

// 暴露方法给父组件
defineExpose({
  resetEmailForm
})
</script>
