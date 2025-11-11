<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #header-right>
          <el-tooltip effect="dark" content="创建分析" placement="bottom">
            <icon-park
              type="newlybuild"
              size="30"
              fill="#333"
              class="cursor-pointer"
              @click="handleCreateAnalyze"
            ></icon-park>
          </el-tooltip>
        </template>
      </custom-header>
    </template>
    <template #content>
      <div class="homepage-container relative" ref="container">
        <chart-card
          ref="cards"
          class="card-chart"
          v-for="chart in analyzeList"
          :create-time="chart.createTime"
          :update-time="chart.updateTime"
          :created-by="chart.createdBy"
          :updated-by="chart.updatedBy"
          :analyze-name="chart.analyzeName"
          :id="chart.id"
          :key="chart.id"
          :view-count="chart.viewCount"
          @delete="handleDeleteAnalyze"
          @edit="handleEditAnalyze"
        >
        </chart-card>
      </div>

      <!-- 创建&编辑分析 -->
      <el-dialog v-model="addOrEditAnalyzeDialogVisible" :title="addOrEditAnalyzeTitle" width="30%">
        <el-form
          :model="addOrEditAnalyzeFormData"
          ref="addOrEditAnalyzeFormRef"
          label-width="auto"
          :rules="addOrEditAnalyzeFormRules"
        >
          <el-form-item label="分析名称" prop="analyzeName">
            <el-input v-model="addOrEditAnalyzeFormData.analyzeName" />
          </el-form-item>
          <el-form-item label="分析描述" prop="analyzeDesc">
            <el-input v-model="addOrEditAnalyzeFormData.analyzeDesc" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addOrEditAnalyzeDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveAnalyze">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </template>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import ChartCard from './components/chart-card.vue'
const layoutName = 'homepage'

const homePageStore = useHomepageStore()
/**
 * @desc 创建&编辑分析表单
 */
const addOrEditAnalyzeFormRef = ref<FormInstance>()
/**
 * @desc 创建&编辑分析标题
 */
const addOrEditAnalyzeTitle = ref('创建分析')
const addOrEditAnalyzeDialogVisible = ref(false)
/**
 * @desc 创建&编辑分析表单数据
 */
const addOrEditAnalyzeFormData = reactive<{
  id: number | null
  analyzeName: string
  analyzeDesc: string
}>({
  id: null,
  analyzeName: '',
  analyzeDesc: ''
})
/**
 * @desc 创建&编辑分析表单验证规则
 */
const addOrEditAnalyzeFormRules: FormRules = {
  analyzeName: [
    {
      required: true,
      message: '请输入分析名称',
      trigger: 'blur'
    }
  ],
  analyzeDesc: [
    {
      required: true,
      message: '请输入分析描述',
      trigger: 'blur'
    }
  ]
}

/**
 * @desc 分析列表
 */
const analyzeList = computed(() => {
  return homePageStore.getAnalyzes
})
const container = ref<HTMLDivElement>()
/**
 * @description 获取所有的分析
 */
const getAnalyzes = async () => {
  const res = await httpRequest('/api/getAnalyzes', {
    method: 'POST'
  })
  if (res.code === 200) {
    homePageStore.setAnalyzes(res.data || [])
    // nextTick(() => {
    //   // 添加window 日历效果
    //   const cards =
    //     container.value!.querySelectorAll<HTMLDivElement>(
    //       '.card-chart'
    //     )
    //   container.value!.onmousemove = (e) => {
    //     for (const card of cards) {
    //       const rect = card.getBoundingClientRect()
    //       const x = e.clientX - rect.left - rect.width / 2
    //       const y = e.clientY - rect.top - rect.height / 2
    //       card.style.setProperty('--x', `${x}px`)
    //       card.style.setProperty('--y', `${y}px`)
    //     }
    //   }
    // })
  }
}

/**
 * @desc 删除分析
 */
const handleDeleteAnalyze = (id: number, analyzeName: string) => {
  ElMessageBox.confirm(`确定删除【${analyzeName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest('/api/deleteAnalyze', {
      method: 'DELETE',
      body: {
        id
      }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getAnalyzes()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

/**
 * @desc 编辑分析 打开弹窗
 */
const handleEditAnalyze = async (id: number) => {
  const res = await httpRequest('/api/getAnalyze', {
    method: 'POST',
    body: {
      id
    }
  })
  if (res.code === 200) {
    addOrEditAnalyzeFormData.id = res.data?.id || null
    addOrEditAnalyzeFormData.analyzeName = res.data?.analyzeName || ''
    addOrEditAnalyzeFormData.analyzeDesc = res.data?.analyzeDesc || ''
  }
  addOrEditAnalyzeTitle.value = '编辑分析'
  addOrEditAnalyzeDialogVisible.value = true
  nextTick(() => {
    addOrEditAnalyzeFormRef.value?.resetFields()
  })
}

/**
 * @desc 创建分析 打开弹窗
 */
const handleCreateAnalyze = () => {
  addOrEditAnalyzeDialogVisible.value = true
  addOrEditAnalyzeTitle.value = '创建分析'
  nextTick(() => {
    addOrEditAnalyzeFormRef.value?.resetFields()
  })
}

/**
 * @desc 保存分析
 */
const handleSaveAnalyze = async () => {
  if (!addOrEditAnalyzeFormRef.value) return
  const valid = await addOrEditAnalyzeFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (addOrEditAnalyzeFormData.id) {
    const res = await httpRequest('/api/updateAnalyze', {
      method: 'POST',
      body: {
        id: addOrEditAnalyzeFormData.id,
        analyzeName: addOrEditAnalyzeFormData.analyzeName,
        analyzeDesc: addOrEditAnalyzeFormData.analyzeDesc
      }
    })
    if (res.code === 200) {
      ElMessage.success('更新成功')
      addOrEditAnalyzeDialogVisible.value = false
      getAnalyzes()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } else {
    const res = await httpRequest('/api/createAnalyze', {
      method: 'POST',
      body: {
        analyzeName: addOrEditAnalyzeFormData.analyzeName,
        analyzeDesc: addOrEditAnalyzeFormData.analyzeDesc
      }
    })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      addOrEditAnalyzeDialogVisible.value = false
      getAnalyzes()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  }
}

onMounted(() => {
  getAnalyzes()
})

onUnmounted(() => {})
</script>

<style lang="scss" scoped>
@use '~/assets/styles/theme-util.scss' as theme;

.homepage-container {
  @include theme.useTheme {
    background-color: theme.getVar('bgColor');
  }

  display: flex;
  flex-wrap: wrap;
  width: 100%;
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  justify-content: flex-start;
  align-items: flex-start;
}

.card-chart {
  margin: 1rem;
}
</style>
