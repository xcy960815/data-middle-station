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
      <div class="homepage-toolbar flex items-center gap-3 px-4 py-3">
        <el-input
          v-model="keyword"
          clearable
          placeholder="搜索分析名称或描述"
          class="toolbar-search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select v-model="sortField" class="toolbar-select" @change="handleSortChange">
          <el-option v-for="item in sortFieldOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="sortOrder" class="toolbar-select" @change="handleSortChange">
          <el-option v-for="item in sortOrderOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <el-select v-model="pageSize" class="toolbar-select toolbar-page-size" @change="handlePageSizeChange">
          <el-option v-for="size in pageSizeOptions" :key="size" :label="`${size} 条/页`" :value="size" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button @click="handleReset">重置</el-button>
      </div>

      <div class="homepage-container relative h-full" v-loading="listLoading">
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

      <el-empty v-if="!listLoading && analyzeList.length === 0" description="暂无符合条件的分析" />

      <div class="homepage-pagination px-4 py-3 flex justify-end" v-if="total > 0">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :current-page="page"
          :page-size="pageSize"
          :total="total"
          @current-change="handlePageChange"
        />
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
            <el-input v-model="addOrEditAnalyzeFormData.analyzeName" placeholder="请输入分析名称" />
          </el-form-item>
          <el-form-item label="分析描述" prop="analyzeDesc">
            <el-input v-model="addOrEditAnalyzeFormData.analyzeDesc" placeholder="请输入分析描述" />
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
import { httpRequest } from '@/composables/useHttpRequest'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import ChartCard from './components/chart-card.vue'
const layoutName = 'homepage'

const homePageStore = useHomepageStore()
const page = ref(1)
const pageSize = ref(12)
const keyword = ref('')
const sortField = ref<AnalyzeDto.AnalyzeListSortField>('updateTime')
const sortOrder = ref<AnalyzeDto.AnalyzeListSortOrder>('desc')
const pageSizeOptions = [12, 24, 48]
const sortFieldOptions: Array<{ label: string; value: AnalyzeDto.AnalyzeListSortField }> = [
  { label: '最近更新', value: 'updateTime' },
  { label: '创建时间', value: 'createTime' },
  { label: '访问次数', value: 'viewCount' },
  { label: '分析名称', value: 'analyzeName' }
]
const sortOrderOptions: Array<{ label: string; value: AnalyzeDto.AnalyzeListSortOrder }> = [
  { label: '降序', value: 'desc' },
  { label: '升序', value: 'asc' }
]
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
const total = computed(() => homePageStore.getTotal)
const listLoading = computed(() => homePageStore.getLoading)
/**
 * @description 获取所有的分析
 */
const getAnalyzes = async (targetPage = page.value) => {
  homePageStore.setLoading(true)
  const res = await httpRequest<ApiResponseI<AnalyzeVo.GetAnalyzesOptions>>('/api/getAnalyzes', {
    method: 'POST',
    body: {
      page: targetPage,
      pageSize: pageSize.value,
      keyword: keyword.value.trim(),
      sortField: sortField.value,
      sortOrder: sortOrder.value
    }
  }).finally(() => {
    homePageStore.setLoading(false)
  })
  if (res.code === 200 && res.data) {
    page.value = res.data.page
    pageSize.value = res.data.pageSize
    homePageStore.setAnalyzes(res.data.list || [])
    homePageStore.setTotal(res.data.total || 0)
  } else {
    homePageStore.setAnalyzes([])
    homePageStore.setTotal(0)
    ElMessage.error(res.message || '获取分析列表失败')
  }
}

const handleSearch = () => {
  getAnalyzes(1)
}

const handleReset = () => {
  keyword.value = ''
  sortField.value = 'updateTime'
  sortOrder.value = 'desc'
  pageSize.value = 12
  getAnalyzes(1)
}

const handleSortChange = () => {
  getAnalyzes(1)
}

const handlePageSizeChange = () => {
  getAnalyzes(1)
}

const handlePageChange = (nextPage: number) => {
  getAnalyzes(nextPage)
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
    addOrEditAnalyzeFormRef.value?.clearValidate()
  })
}

/**
 * @desc 创建分析 打开弹窗
 */
const handleCreateAnalyze = () => {
  addOrEditAnalyzeFormData.id = null
  addOrEditAnalyzeFormData.analyzeName = ''
  addOrEditAnalyzeFormData.analyzeDesc = ''
  addOrEditAnalyzeDialogVisible.value = true
  addOrEditAnalyzeTitle.value = '创建分析'
  nextTick(() => {
    addOrEditAnalyzeFormRef.value?.clearValidate()
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
  padding: 10px;
  margin: 0;
  justify-content: flex-start;
  align-items: flex-start;
  /* 多行时让所有行挤在顶部，避免中间被拉出大空白 */
  align-content: flex-start;
  /* 控制卡片之间的间距：横向稍大、纵向更紧凑 */
  column-gap: 1.25rem;
  row-gap: 0.6rem;
}

.homepage-toolbar {
  .toolbar-search {
    max-width: 320px;
  }

  .toolbar-select {
    width: 140px;
  }

  .toolbar-page-size {
    width: 120px;
  }
}

.card-chart {
  /* 间距由父容器的 gap 控制，这里不再额外增加外边距 */
  margin: 0;
}
</style>
