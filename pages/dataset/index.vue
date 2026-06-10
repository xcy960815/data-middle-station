<template>
  <NuxtLayout :name="layoutName">
    <template #header>
      <custom-header>
        <template #nav />
      </custom-header>
    </template>

    <template #bar>
      <el-button link @click="router.push('/data-source')">数据源管理</el-button>
      <el-button link @click="handleCreateDataset">新增数据集</el-button>
    </template>

    <template #toolbar>
      <el-input
        v-model="keyword"
        clearable
        placeholder="搜索数据集名称、描述或 SQL"
        class="dataset-search"
        @keyup.enter="getDatasets(1)"
        @clear="getDatasets(1)"
      />
      <el-select v-model="sortField" class="dataset-select" @change="getDatasets(1)">
        <el-option label="最近更新" value="updateTime" />
        <el-option label="创建时间" value="createTime" />
        <el-option label="数据集名称" value="datasetName" />
      </el-select>
      <el-select v-model="sortOrder" class="dataset-select" @change="getDatasets(1)">
        <el-option label="降序" value="desc" />
        <el-option label="升序" value="asc" />
      </el-select>
      <el-button type="primary" @click="getDatasets(1)">搜索</el-button>
      <el-button @click="handleResetSearch">重置</el-button>
    </template>

    <template #list>
      <div v-loading="listLoading" class="dataset-list-loading">
        <ListCard
          v-for="item in datasets"
          :key="item.id"
          :title="item.datasetName"
          :description="item.datasetDesc || 'SQL 数据集'"
          :title-attr="item.querySql || ''"
          :creator="item.createdBy"
          :time="formatDate(item.updateTime || item.createTime)"
          @click="handleOpenDataset(item)"
        >
          <template #actions>
            <button
              class="dataset-card-action dataset-card-action--delete"
              type="button"
              @click.stop="handleDeleteDataset(item)"
            >
              <icon-park type="DeleteOne" size="14" fill="#333" />
            </button>
          </template>
          <template #left-badges>
            <span class="dataset-badge" :class="`dataset-badge--${item.status}`">
              {{ item.status === 'enabled' ? '启用' : '禁用' }}
            </span>
          </template>
          <template #right-badges>
            <span class="dataset-count">{{ item.fieldCount || 0 }} 个字段</span>
          </template>
        </ListCard>
        <el-empty v-if="!listLoading && datasets.length === 0" class="dataset-empty" description="暂无数据集" />
      </div>
    </template>

    <template #pagination>
      <el-pagination
        v-if="total > 0"
        background
        layout="prev, pager, next, total"
        :current-page="page"
        :page-size="pageSize"
        :total="total"
        @current-change="getDatasets"
      />
    </template>
  </NuxtLayout>
</template>

<script setup lang="ts">
import { httpRequest } from '@/composables/useHttpRequest'
import ListCard from '@/components/list-card/index.vue'
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage, ElMessageBox } from 'element-plus'

const layoutName = 'dataset'
const router = useRouter()

const datasets = ref<DatasetVo.DatasetListItem[]>([])
const listLoading = ref(false)
const page = ref(1)
const pageSize = ref(12)
const total = ref(0)
const keyword = ref('')
const sortField = ref<DatasetDto.DatasetListSortField>('updateTime')
const sortOrder = ref<DatasetDto.DatasetListSortOrder>('desc')

const getDatasets = async (targetPage = page.value) => {
  listLoading.value = true
  try {
    const res = await httpRequest<ApiResponseI<DatasetVo.DatasetListResponse>>('/api/getDatasets', {
      method: 'POST',
      body: {
        page: targetPage,
        pageSize: pageSize.value,
        keyword: keyword.value.trim(),
        sortField: sortField.value,
        sortOrder: sortOrder.value
      }
    })
    if (res.code === 200 && res.data) {
      datasets.value = res.data.list || []
      page.value = res.data.page
      total.value = res.data.total
    } else {
      ElMessage.error(res.message || '获取数据集失败')
    }
  } finally {
    listLoading.value = false
  }
}

const handleResetSearch = () => {
  keyword.value = ''
  sortField.value = 'updateTime'
  sortOrder.value = 'desc'
  getDatasets(1)
}

const handleCreateDataset = () => {
  router.push('/dataset/new')
}

const handleOpenDataset = (item: DatasetVo.DatasetListItem) => {
  router.push(`/dataset/${item.id}`)
}

const handleDeleteDataset = (item: DatasetVo.DatasetListItem) => {
  ElMessageBox.confirm(`确定删除【${item.datasetName}】吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(async () => {
    const res = await httpRequest<ApiResponseI<boolean>>('/api/deleteDataset', {
      method: 'DELETE',
      body: { id: item.id }
    })
    if (res.code === 200) {
      ElMessage.success('删除成功')
      getDatasets(page.value)
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  })
}

const formatDate = (value: string) => {
  return value ? value.split('T')[0].slice(0, 10) : ''
}

onMounted(() => {
  getDatasets()
})
</script>

<style scoped lang="scss">
.dataset-search {
  max-width: 340px;
}

.dataset-select {
  width: 140px;
}

.dataset-list-loading {
  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  gap: 10px 20px;
  width: 100%;
  height: 100%;
  min-height: 0;
}

.dataset-card-action {
  display: inline-flex;
  width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 2px 8px rgb(0 0 0 / 8%);
  cursor: pointer;
}

.dataset-card-action:hover {
  background: #eef6ff;
}

.dataset-card-action--delete:hover {
  background: #ffeaea;
}

.dataset-badge,
.dataset-count {
  border-radius: 999px;
  padding: 2px 7px;
  font-size: 12px;
}

.dataset-badge--enabled {
  color: #047857;
  background: #d1fae5;
}

.dataset-badge--disabled {
  color: #6b7280;
  background: #f3f4f6;
}

.dataset-count {
  color: #2563eb;
  background: #dbeafe;
}

.dataset-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
