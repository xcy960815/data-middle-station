<template>
  <el-dialog v-model="dialogVisible" title="发送图表邮件" width="800px" :close-on-click-modal="false">
    <el-form
      ref="emailFormRef"
      :model="emailFormData"
      :rules="emailFormRules"
      label-width="100px"
      label-position="left"
    >
      <el-form-item label="收件人" prop="recipients">
        <el-input
          v-model="emailFormData.recipients"
          placeholder="请输入收件人邮箱，多个邮箱用逗号分隔"
          type="textarea"
          :rows="2"
        />
        <div class="text-sm text-gray-500 mt-1">支持多个邮箱地址，用逗号分隔</div>
      </el-form-item>

      <el-form-item label="邮件主题" prop="emailSubject">
        <el-input v-model="emailFormData.emailSubject" placeholder="请输入邮件主题" />
      </el-form-item>

      <el-form-item label="额外说明">
        <el-input
          v-model="emailFormData.messageContent"
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
          {{ isSending ? '发送中...' : '发送邮件' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { ElButton, ElDialog, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'

export interface EmailFormData {
  recipients: string // 收件人邮箱地址
  emailSubject: string // 邮件主题
  messageContent: string // 额外消息内容
}

const props = defineProps<{
  visible: boolean
  chartRef?: SendEmailDto.ChartComponentRef
}>()

const emits = defineEmits<{
  'update:visible': [value: boolean]
  success: [messageId: string]
  error: [error: any]
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
  recipients: 'xinxin87v5@icloud.com',
  emailSubject: '',
  messageContent: ''
})

// 表单引用
const emailFormRef = ref<FormInstance | null>(null)

// 获取邮件相关函数
const { validateEmails, sendEmailFromChartRef } = useSendChartEmail()

// 发送状态
const isSending = ref(false)

// 表单验证规则
const emailFormRules: FormRules<EmailFormData> = {
  recipients: [
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
  emailSubject: [
    { required: true, message: '请输入邮件主题', trigger: 'blur' },
    { min: 1, max: 200, message: '邮件主题长度应在 1 到 200 个字符之间', trigger: 'blur' }
  ]
}

// 获取 store
const analyseStore = useAnalyseStore()

// 生成默认邮件主题
const generateDefaultSubject = () => {
  return `数据分析报告 - ${analyseStore.getAnalyseName || '无标题'} (${new Date().toLocaleDateString('zh-CN')})`
}

// 监听对话框显示状态，设置默认主题
watch(
  () => props.visible,
  (newVisible) => {
    if (newVisible) {
      emailFormData.emailSubject = generateDefaultSubject()
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
    emits('error', new Error('图表引用不存在'))
    return
  }

  // const analyseName = analyseStore.getAnalyseName

  isSending.value = true
  ElMessage.info('正在发送邮件...')
  console.log('props.chartRef', props.chartRef)

  // try {
  //   // 发送邮件
  //   const result = await sendEmailFromChartRef(
  //     props.chartRef,
  //     analyseName,
  //     {
  //       to: emailFormData.recipients.split(',').map((email) => email.trim()),
  //       subject: emailFormData.emailSubject,
  //       additionalContent: emailFormData.messageContent
  //     },
  //     `${analyseName}_${new Date().getTime()}`
  //   )

  //   ElMessage.success(`邮件发送成功！消息ID: ${result.messageId}`)
  //   emits('success', result.messageId)
  //   emits('update:visible', false)

  //   // 重置表单
  //   resetEmailForm()
  // } catch (error) {
  //   ElMessage.error('邮件发送失败，请稍后重试')
  //   console.error('邮件发送错误:', error)
  //   emits('error', error)
  // } finally {
  //   isSending.value = false
  // }
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
  emailFormData.recipients = 'xinxin87v5@icloud.com'
  emailFormData.emailSubject = ''
  emailFormData.messageContent = ''
}

// 暴露方法给父组件
defineExpose({
  resetEmailForm
})
</script>
