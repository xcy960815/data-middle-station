<template>
  <div class="analyze-source analyze-source--grow">
    <div class="analyze-source__title">分析列表</div>
    <el-input
      :model-value="keyword"
      clearable
      placeholder="搜索分析"
      @update:model-value="emit('update:keyword', $event)"
      @keyup.enter="emit('search', 1)"
      @clear="emit('search', 1)"
    />
    <div v-loading="loading" class="analyze-source__list">
      <div
        v-for="analyze in analyzes"
        :key="analyze.id"
        class="analyze-source-item"
        draggable="true"
        @dragstart="emit('dragstart', analyze)"
        @dblclick="emit('add', analyze)"
      >
        <div class="analyze-source-item__name">{{ analyze.analyzeName }}</div>
        <div class="analyze-source-item__desc">{{ analyze.analyzeDesc || '暂无描述' }}</div>
      </div>
      <el-empty v-if="!loading && analyzes.length === 0" description="暂无分析" />
    </div>
    <el-pagination
      small
      layout="prev, pager, next"
      :current-page="page"
      :page-size="pageSize"
      :total="total"
      @current-change="emit('search', $event)"
    />
  </div>
</template>

<script setup lang="ts">
defineProps<{
  analyzes: AnalyzeVo.AnalyzeListItem[]
  loading: boolean
  page: number
  pageSize: number
  total: number
  keyword: string
}>()

const emit = defineEmits<{
  'update:keyword': [value: string]
  search: [page: number]
  dragstart: [analyze: AnalyzeVo.AnalyzeListItem]
  add: [analyze: AnalyzeVo.AnalyzeListItem]
}>()
</script>

<style scoped lang="scss">
.analyze-source {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.analyze-source--grow {
  flex: 1 1 0;
  min-height: 0;
}

.analyze-source__title {
  color: #303133;
  font-size: 14px;
  font-weight: 700;
}

.analyze-source__list {
  display: flex;
  flex: 1 1 0;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  overflow: auto;
}

.analyze-source-item {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #fafafa;
  cursor: grab;
}

.analyze-source-item__name {
  color: #303133;
  font-size: 13px;
  font-weight: 700;
}

.analyze-source-item__desc {
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}
</style>
