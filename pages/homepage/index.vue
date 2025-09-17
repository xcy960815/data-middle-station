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
              @click="handleCreateAnalyse"
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
          v-for="chart in analyseList"
          :create-time="chart.createTime"
          :update-time="chart.updateTime"
          :created-by="chart.createdBy"
          :updated-by="chart.updatedBy"
          :analyse-name="chart.analyseName"
          :id="chart.id"
          :key="chart.id"
          :view-count="chart.viewCount"
          @delete="handleDeleteAnalyse"
          @edit="handleEditAnalyse"
        >
        </chart-card>
      </div>

      <!-- 创建&编辑分析 -->
      <el-dialog v-model="addOrEditAnalyseDialogVisible" :title="addOrEditAnalyseTitle" width="30%">
        <el-form
          :model="addOrEditAnalyseFormData"
          ref="addOrEditAnalyseFormRef"
          label-width="auto"
          :rules="addOrEditAnalyseFormRules"
        >
          <el-form-item label="分析名称" prop="analyseName">
            <el-input v-model="addOrEditAnalyseFormData.analyseName" />
          </el-form-item>
          <el-form-item label="分析描述" prop="analyseDesc">
            <el-input v-model="addOrEditAnalyseFormData.analyseDesc" />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="addOrEditAnalyseDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="handleSaveAnalyse">确定</el-button>
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
const addOrEditAnalyseFormRef = ref<FormInstance>()
/**
 * @desc 创建&编辑分析标题
 */
const addOrEditAnalyseTitle = ref('创建分析')
const addOrEditAnalyseDialogVisible = ref(false)
/**
 * @desc 创建&编辑分析表单数据
 */
const addOrEditAnalyseFormData = reactive<{
  id: number | null
  analyseName: string
  analyseDesc: string
}>({
  id: null,
  analyseName: '',
  analyseDesc: ''
})
/**
 * @desc 创建&编辑分析表单验证规则
 */
const addOrEditAnalyseFormRules: FormRules = {
  analyseName: [
    {
      required: true,
      message: '请输入分析名称',
      trigger: 'blur'
    }
  ],
  analyseDesc: [
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
const analyseList = computed(() => {
  return homePageStore.getAnalyses
})
const container = ref<HTMLDivElement>()
/**
 * @description 获取所有的分析
 */
const getAnalyses = async () => {
  const res = await httpRequest('/api/getAnalyses', {
    method: 'POST'
  })
  if (res.code === 200) {
    homePageStore.setAnalyses(res.data || [])
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
const handleDeleteAnalyse = (id: number, analyseName: string) => {
  ElMessageBox.confirm(`确定删除【${analyseName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest('/api/deleteAnalyse', {
      method: 'DELETE',
      body: {
        id
      }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getAnalyses()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

/**
 * @desc 编辑分析 打开弹窗
 */
const handleEditAnalyse = async (id: number) => {
  const res = await httpRequest('/api/getAnalyse', {
    method: 'POST',
    body: {
      id
    }
  })
  if (res.code === 200) {
    addOrEditAnalyseFormData.id = res.data?.id || null
    addOrEditAnalyseFormData.analyseName = res.data?.analyseName || ''
    addOrEditAnalyseFormData.analyseDesc = res.data?.analyseDesc || ''
  }
  addOrEditAnalyseTitle.value = '编辑分析'
  addOrEditAnalyseDialogVisible.value = true
  nextTick(() => {
    addOrEditAnalyseFormRef.value?.resetFields()
  })
}

/**
 * @desc 创建分析 打开弹窗
 */
const handleCreateAnalyse = () => {
  addOrEditAnalyseDialogVisible.value = true
  addOrEditAnalyseTitle.value = '创建分析'
  nextTick(() => {
    addOrEditAnalyseFormRef.value?.resetFields()
  })
}

/**
 * @desc 保存分析
 */
const handleSaveAnalyse = async () => {
  if (!addOrEditAnalyseFormRef.value) return
  const valid = await addOrEditAnalyseFormRef.value.validate().catch(() => false)
  if (!valid) return
  if (addOrEditAnalyseFormData.id) {
    const res = await httpRequest('/api/updateAnalyse', {
      method: 'POST',
      body: {
        id: addOrEditAnalyseFormData.id,
        analyseName: addOrEditAnalyseFormData.analyseName,
        analyseDesc: addOrEditAnalyseFormData.analyseDesc
      }
    })
    if (res.code === 200) {
      ElMessage.success('更新成功')
      addOrEditAnalyseDialogVisible.value = false
      getAnalyses()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } else {
    const res = await httpRequest('/api/createAnalyse', {
      method: 'POST',
      body: {
        analyseName: addOrEditAnalyseFormData.analyseName,
        analyseDesc: addOrEditAnalyseFormData.analyseDesc
      }
    })
    if (res.code === 200) {
      ElMessage.success('创建成功')
      addOrEditAnalyseDialogVisible.value = false
      getAnalyses()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  }
}

onMounted(() => {
  getAnalyses()
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
