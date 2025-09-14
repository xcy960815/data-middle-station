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
          <el-radio value="recurring">重复任务</el-radio>
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

      <!-- 重复任务设置 -->
      <template v-if="emailFormData.sendMode === 'recurring'">
        <el-form-item label="重复周期" prop="recurringDays">
          <div class="recurring-days">
            <el-checkbox-group v-model="emailFormData.recurringDays">
              <el-checkbox value="1">周一</el-checkbox>
              <el-checkbox value="2">周二</el-checkbox>
              <el-checkbox value="3">周三</el-checkbox>
              <el-checkbox value="4">周四</el-checkbox>
              <el-checkbox value="5">周五</el-checkbox>
              <el-checkbox value="6">周六</el-checkbox>
              <el-checkbox value="0">周日</el-checkbox>
            </el-checkbox-group>
            <div class="text-xs text-gray-500 mt-1">选择每周的哪几天执行任务</div>
          </div>
        </el-form-item>

        <el-form-item label="执行时间" prop="recurringTime">
          <el-time-picker
            v-model="emailFormData.recurringTime"
            placeholder="选择每日执行时间"
            format="HH:mm"
            value-format="HH:mm"
            style="width: 200px"
          />
        </el-form-item>

        <el-form-item label="任务名称" prop="taskName">
          <el-input
            v-model="emailFormData.taskName"
            placeholder="为这个重复任务起个名字（可选）"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="备注说明">
          <el-input
            v-model="emailFormData.remark"
            type="textarea"
            placeholder="对这个重复任务的补充说明（可选）"
            :rows="2"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <!-- 下次执行时间预览 -->
        <el-form-item v-if="nextExecutionTime" label="下次执行">
          <div class="next-execution-preview">
            <el-tag type="info" size="large"> 📅 {{ nextExecutionTime }} </el-tag>
          </div>
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
  ElCheckbox,
  ElCheckboxGroup,
  ElDatePicker,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElRadio,
  ElRadioGroup,
  ElTag,
  ElTimePicker
} from 'element-plus'

export interface EmailFormData {
  /**
   * 收件人邮箱地址
   */
  to: string
  /**
   * 邮件主题
   */
  subject: string // 邮件主题
  /**
   * 发送模式：立即发送 | 定时发送 | 重复任务
   */
  sendMode: 'immediate' | 'scheduled' | 'recurring'
  /**
   * 额外消息内容
   */
  additionalContent: string
  /**
   * 任务名称（定时发送时使用）
   */
  taskName: string
  /**
   * 计划执行时间
   */
  scheduleTime: string | null
  /**
   * 备注说明
   */
  remark: string
  /**
   * 重复的星期几 (0=周日, 1=周一, ..., 6=周六)
   */
  recurringDays: string[]
  /**
   * 重复任务的执行时间 (HH:mm格式)
   */
  recurringTime: string | null // 重复任务的执行时间 (HH:mm格式)
}

const props = defineProps<{
  visible: boolean
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
  additionalContent: '额外说明额外说明额外说明',
  sendMode: 'immediate',
  taskName: '',
  scheduleTime: null,
  remark: '',
  recurringDays: [],
  recurringTime: null
})

// 表单引用
const emailFormRef = ref<FormInstance | null>(null)

// 发送状态
const isSending = ref(false)

// 下次执行时间预览
const nextExecutionTime = computed(() => {
  if (
    emailFormData.sendMode !== 'recurring' ||
    !emailFormData.recurringTime ||
    emailFormData.recurringDays.length === 0
  ) {
    return null
  }

  // 使用与后端相同的计算逻辑
  const now = new Date()
  const today = now.getDay() // 0=周日, 1=周一, ..., 6=周六
  const currentTime24 = now.getHours() * 60 + now.getMinutes()

  const [targetHour, targetMinute] = emailFormData.recurringTime.split(':').map(Number)
  const targetTime24 = targetHour * 60 + targetMinute

  const validDays = emailFormData.recurringDays.map(Number).filter((day) => day >= 0 && day <= 6)
  if (validDays.length === 0) {
    return null
  }

  // 找到下一个执行时间
  for (let i = 0; i < 7; i++) {
    const checkDay = (today + i) % 7

    if (validDays.includes(checkDay)) {
      // 如果是今天，需要检查时间是否已过
      if (i === 0 && currentTime24 >= targetTime24) {
        continue // 今天的时间已过，检查下一个匹配日期
      }

      // 计算目标日期
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + i)
      targetDate.setHours(targetHour, targetMinute, 0, 0)

      return targetDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short'
      })
    }
  }

  return null
})

// 表单验证规则
const emailFormRules: FormRules<EmailFormData> = {
  /**
   * @desc 收件人
   */
  to: [
    { required: true, message: '请输入收件人邮箱', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback: Function) => {
        if (!value) {
          callback(new Error('请输入收件人邮箱'))
          return
        }
        // const emails = value
        //   .split(',')
        //   .map((email) => email.trim())
        //   .filter((email) => email)
        // const emailValidation = validateEmails(emails)
        // if (!emailValidation.valid) {
        //   callback(new Error(`邮件地址格式错误: ${emailValidation.invalidEmails.join(', ')}`))
        // } else {
        //   callback()
        // }
        callback()
      },
      trigger: 'blur'
    }
  ],
  /**
   * @desc 邮件主题
   */
  subject: [
    { required: true, message: '请输入邮件主题', trigger: 'blur' },
    { min: 1, max: 200, message: '邮件主题长度应在 1 到 200 个字符之间', trigger: 'blur' }
  ],
  /**
   * @desc 发送模式
   */
  sendMode: [{ required: true, message: '请选择发送模式', trigger: 'change' }],
  /**
   * @desc 计划执行时间
   */
  scheduleTime: [
    { required: true, message: '请选择执行时间', trigger: 'change' },
    {
      required: true,
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
  /**
   * @desc 重复日期
   */
  recurringDays: [
    {
      required: true,
      validator: (_rule: any, value: string[], callback: Function) => {
        if (emailFormData.sendMode === 'recurring') {
          if (!value || value.length === 0) {
            callback(new Error('请选择至少一个重复日期'))
            return
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  /**
   * @desc 重复时间
   */
  recurringTime: [
    {
      required: true,
      validator: (_rule: any, value: string, callback: Function) => {
        if (emailFormData.sendMode === 'recurring') {
          if (!value) {
            callback(new Error('请选择执行时间'))
            return
          }
        }
        callback()
      },
      trigger: 'change'
    }
  ],
  /**
   * @desc 任务名称
   */
  taskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
    { max: 100, message: '任务名称不能超过100个字符', trigger: 'blur' }
  ]
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
    if (emailFormData.sendMode === 'immediate') return '发送中...'
    if (emailFormData.sendMode === 'scheduled') return '保存中...'
    if (emailFormData.sendMode === 'recurring') return '保存中...'
  }

  if (emailFormData.sendMode === 'immediate') return '发送邮件'
  if (emailFormData.sendMode === 'scheduled') return '保存定时任务'
  if (emailFormData.sendMode === 'recurring') return '保存重复任务'

  return '确认'
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
    if ((newMode === 'scheduled' || newMode === 'recurring') && !emailFormData.taskName) {
      emailFormData.taskName = generateDefaultTaskName()
    }
  }
)

watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      emailFormData.subject = generateDefaultSubject()
      // 重置发送设置
      emailFormData.sendMode = 'immediate'
      emailFormData.scheduleTime = null
      emailFormData.taskName = ''
      emailFormData.remark = ''
      emailFormData.recurringDays = []
      emailFormData.recurringTime = null
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

  isSending.value = true
  if (emailFormData.sendMode === 'immediate') {
    await sendEmail()
  } else if (emailFormData.sendMode === 'scheduled') {
    // 定时任务
    await saveScheduledTask()
  } else if (emailFormData.sendMode === 'recurring') {
    // 重复任务
    await saveRecurringTask()
  }

  emits('update:visible', false)
  resetEmailForm()
}

/**
 * 发送邮件
 */
const sendEmail = async () => {
  const valid = await emailFormRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  // 构建邮件数据
  const emailData: SendEmailDto.SendChartEmailRequest = {
    emailConfig: {
      to: emailFormData.to,
      subject: emailFormData.subject,
      additionalContent: emailFormData.additionalContent
    },
    analyseOptions: {
      filename: analyseStore.getAnalyseName,
      chartType: analyseStore.getChartType,
      analyseName: analyseStore.getAnalyseName,
      analyseId: analyseStore.getAnalyseId!
    }
  }
  const response = await $fetch('/api/sendEmail', {
    method: 'POST',
    body: emailData
  }).finally(() => {
    isSending.value = false
  })
  if (response.code === 200) {
    ElMessage.success('邮件发送成功！')
  } else {
    ElMessage.error('邮件发送失败！')
  }
}

/**
 * 保存定时任务
 */
const saveScheduledTask = async () => {
  const valid = await emailFormRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  // 构建定时任务数据
  const scheduledEmailData: ScheduledEmailDto.CreateScheduledEmailOptions = {
    taskName: emailFormData.taskName || generateDefaultTaskName(),
    taskType: 'scheduled',
    scheduleTime: emailFormData.scheduleTime!,
    recurringDays: null,
    recurringTime: null,
    emailConfig: {
      to: emailFormData.to,
      subject: emailFormData.subject,
      additionalContent: emailFormData.additionalContent
    },
    analyseOptions: {
      filename: analyseStore.getAnalyseName,
      chartType: analyseStore.getChartType, // 图表类型
      analyseName: analyseStore.getAnalyseName,
      analyseId: analyseStore.getAnalyseId!
    },
    remark: emailFormData.remark
  }

  // 调用API保存定时任务
  const response = await $fetch('/api/scheduledEmails', {
    method: 'POST',
    body: scheduledEmailData
  }).finally(() => {
    isSending.value = false
  })

  if (response.code === 200) {
    ElMessage.success('定时任务保存成功！')
  } else {
    ElMessage.error('定时任务保存失败！')
  }
}

/**
 * 保存重复任务
 */
const saveRecurringTask = async () => {
  const valid = await emailFormRef.value?.validate().catch(() => false)
  if (!valid) {
    return
  }
  // 构建重复任务数据
  const recurringTaskData: ScheduledEmailDto.CreateScheduledEmailOptions = {
    taskName: emailFormData.taskName || generateDefaultTaskName(),
    taskType: 'recurring',
    scheduleTime: null,
    recurringDays: emailFormData.recurringDays.map(Number), // 转换为数字数组
    recurringTime: emailFormData.recurringTime,
    remark: emailFormData.remark,
    emailConfig: {
      to: emailFormData.to,
      subject: emailFormData.subject,
      additionalContent: emailFormData.additionalContent
    },
    analyseOptions: {
      filename: analyseStore.getAnalyseName,
      chartType: analyseStore.getChartType,
      analyseName: analyseStore.getAnalyseName,
      analyseId: analyseStore.getAnalyseId!
    }
  }

  // 调用API保存重复任务
  const response = await $fetch('/api/scheduledEmails', {
    method: 'POST',
    body: recurringTaskData
  }).finally(() => {
    isSending.value = false
  })

  if (response.code === 200) {
    ElMessage.success('重复任务保存成功！')
  } else {
    ElMessage.error('重复任务保存失败！')
  }
}

/**
 * 计算下次执行时间
 */
const calculateNextExecutionTime = (recurringDays: number[], recurringTime: string): string => {
  const now = new Date()
  const today = now.getDay() // 0=周日, 1=周一, ..., 6=周六
  const currentTime = now.getHours() * 60 + now.getMinutes()
  const [targetHour, targetMinute] = recurringTime.split(':').map(Number)
  const targetTime = targetHour * 60 + targetMinute

  // 找到下一个执行时间
  for (let i = 0; i < 7; i++) {
    const checkDay = (today + i) % 7

    if (recurringDays.includes(checkDay)) {
      const checkDate = new Date(now)
      checkDate.setDate(now.getDate() + i)
      checkDate.setHours(targetHour, targetMinute, 0, 0)

      // 如果是今天，需要检查时间是否已过
      if (i === 0 && targetTime <= currentTime) {
        continue
      }

      return checkDate.toISOString().slice(0, 19).replace('T', ' ')
    }
  }

  // 如果没有找到，返回下周的第一个执行日
  const firstDay = Math.min(...recurringDays)
  const nextWeekDate = new Date(now)
  nextWeekDate.setDate(now.getDate() + 7 + firstDay - today)
  nextWeekDate.setHours(targetHour, targetMinute, 0, 0)

  return nextWeekDate.toISOString().slice(0, 19).replace('T', ' ')
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
  emailFormData.recurringDays = []
  emailFormData.recurringTime = null
}

// 暴露方法给父组件
defineExpose({
  resetEmailForm
})
</script>

<style scoped>
.recurring-days {
  .el-checkbox-group {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .el-checkbox {
    margin-right: 0;
  }
}

.next-execution-preview {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
