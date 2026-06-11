<template>
  <el-dialog v-model="dialogVisible" title="报警配置中心" width="800px" append-to-body>
    <div v-if="!isEditing" v-loading="loading">
      <div class="flex justify-between mb-4">
        <span>当前图表已配置的报警规则：</span>
        <el-button type="primary" size="small" @click="handleCreate">新增报警</el-button>
      </div>
      <el-table :data="alarms" border stripe>
        <el-table-column prop="alarmName" label="规则名称" />
        <el-table-column prop="cronExpression" label="检测频率" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-switch :model-value="row.isActive === 1" @change="handleToggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div v-else>
      <el-form :model="formData" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="规则名称" prop="alarmName">
          <el-input v-model="formData.alarmName" placeholder="如：销售额跌破预警" />
        </el-form-item>

        <el-form-item label="检测频率" prop="cronExpression">
          <el-select v-model="formData.cronExpression" placeholder="请选择频率" style="width: 100%">
            <el-option label="每分钟 (测试用)" value="* * * * *" />
            <el-option label="每小时" value="0 * * * *" />
            <el-option label="每天上午 9 点" value="0 9 * * *" />
            <el-option label="每周一上午 9 点" value="0 9 * * 1" />
          </el-select>
        </el-form-item>

        <el-form-item label="报警策略" prop="alarmStrategy">
          <el-select v-model="formData.alarmStrategy" style="width: 100%">
            <el-option label="每次触发均报警" value="always" />
            <el-option label="每天最多报警一次" value="once_per_day" />
            <el-option label="仅状态变更时报警" value="only_state_change" />
          </el-select>
        </el-form-item>

        <div class="font-bold mb-2">触发条件配置：</div>
        <div v-for="(cond, index) in formData.conditions" :key="index" class="flex gap-2 mb-2 items-center">
          <el-select v-model="cond.measureId" placeholder="选择指标" style="width: 180px">
            <el-option
              v-for="measure in measureOptions"
              :key="measure.columnName"
              :label="measure.displayName"
              :value="measure.columnName"
            />
          </el-select>
          <el-select v-model="cond.operator" placeholder="比较" style="width: 100px">
            <el-option label="大于 (>)" value=">" />
            <el-option label="小于 (<)" value="<" />
            <el-option label="等于 (=)" value="=" />
            <el-option label="大于等于 (>=)" value=">=" />
            <el-option label="小于等于 (<=)" value="<=" />
            <el-option label="不等于 (!=)" value="!=" />
          </el-select>
          <el-input-number v-model="cond.threshold" :controls="false" placeholder="阈值" style="width: 120px" />
          <el-button link type="danger" @click="removeCondition(index)" v-if="formData.conditions.length > 1"
            >移除</el-button
          >
        </div>
        <el-button type="primary" link @click="addCondition" class="mb-4">+ 添加条件</el-button>

        <div class="font-bold mb-2">通知配置：</div>
        <el-form-item label="接收邮箱">
          <el-input v-model="emailsStr" placeholder="多个邮箱请用逗号分隔" />
        </el-form-item>
        <el-form-item label="Webhook URL">
          <el-input v-model="formData.notificationConfig.webhookUrl" placeholder="如钉钉/飞书机器人地址" />
        </el-form-item>
      </el-form>

      <div class="text-right mt-6">
        <el-button @click="isEditing = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { httpRequest } from '@/composables/useHttpRequest'
import { ElMessage, ElMessageBox } from 'element-plus'

const dialogVisible = ref(false)
const isEditing = ref(false)
const loading = ref(false)
const saving = ref(false)
const alarms = ref<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>([])
const formRef = ref()

const analyzeStore = useAnalyzeStore()
const measureStore = useMeasuresStore()

const measureOptions = computed(() => measureStore.getMeasures)

const defaultForm = (): Partial<AnalyzeAlarmDao.AnalyzeAlarmRecord> => ({
  alarmName: '',
  cronExpression: '0 * * * *',
  alarmStrategy: 'always',
  conditions: [{ measureId: '', operator: '>', threshold: 0 }],
  notificationConfig: {
    emails: [],
    webhookUrl: ''
  }
})

const formData = ref<Partial<AnalyzeAlarmDao.AnalyzeAlarmRecord>>(defaultForm())
const emailsStr = ref('')

const rules = {
  alarmName: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  cronExpression: [{ required: true, message: '请选择检测频率', trigger: 'change' }]
}

const loadAlarms = async () => {
  const analyzeId = analyzeStore.getAnalyzeId
  if (!analyzeId) return

  loading.value = true
  const res = await httpRequest<ApiResponseI<AnalyzeAlarmDao.AnalyzeAlarmRecord[]>>('/api/analyze/alarm/list', {
    method: 'POST',
    body: { analyzeId }
  }).finally(() => {
    loading.value = false
  })

  if (res.code === 200 && res.data) {
    alarms.value = res.data
  }
}

const handleCreate = () => {
  formData.value = defaultForm()
  emailsStr.value = ''
  isEditing.value = true
}

const handleEdit = (row: AnalyzeAlarmDao.AnalyzeAlarmRecord) => {
  formData.value = JSON.parse(JSON.stringify(row))
  emailsStr.value = (formData.value.notificationConfig?.emails || []).join(',')
  isEditing.value = true
}

const addCondition = () => {
  if (!formData.value.conditions) formData.value.conditions = []
  formData.value.conditions.push({ measureId: '', operator: '>', threshold: 0 })
}

const removeCondition = (index: number) => {
  formData.value.conditions?.splice(index, 1)
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  const analyzeId = analyzeStore.getAnalyzeId
  if (!analyzeId) {
    ElMessage.error('当前未绑定图表ID')
    return
  }

  const conditionsValid = formData.value.conditions?.every(
    (c) => c.measureId && c.operator && c.threshold !== undefined
  )
  if (!conditionsValid) {
    ElMessage.error('请完整填写触发条件')
    return
  }

  // 处理邮箱
  const emails = emailsStr.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  formData.value.notificationConfig!.emails = emails

  saving.value = true
  const isUpdate = !!formData.value.id
  const url = isUpdate ? '/api/analyze/alarm/update' : '/api/analyze/alarm/create'
  const body = {
    ...formData.value,
    analyzeId
  }

  const res = await httpRequest<ApiResponseI<any>>(url, {
    method: 'POST',
    body
  }).finally(() => {
    saving.value = false
  })

  if (res.code === 200) {
    ElMessage.success('保存成功')
    isEditing.value = false
    loadAlarms()
  } else {
    ElMessage.error(res.message || '保存失败')
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该报警规则吗？', '提示', { type: 'warning' })
  const res = await httpRequest<ApiResponseI<boolean>>('/api/analyze/alarm/delete', {
    method: 'POST',
    body: { id }
  })
  if (res.code === 200 && res.data) {
    ElMessage.success('删除成功')
    loadAlarms()
  } else {
    ElMessage.error(res.message || '删除失败')
  }
}

const handleToggleStatus = async (row: AnalyzeAlarmDao.AnalyzeAlarmRecord) => {
  const res = await httpRequest<ApiResponseI<boolean>>('/api/analyze/alarm/toggle', {
    method: 'POST',
    body: { id: row.id }
  })
  if (res.code === 200 && res.data) {
    ElMessage.success('状态已切换')
    loadAlarms()
  } else {
    ElMessage.error(res.message || '切换失败')
  }
}

watch(dialogVisible, (val) => {
  if (val) {
    isEditing.value = false
    loadAlarms()
  }
})

// 暴露方法给外部调用打开弹窗
defineExpose({
  open: () => {
    dialogVisible.value = true
  }
})
</script>
