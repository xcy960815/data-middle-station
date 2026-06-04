<template>
  <div class="header-title">
    <h4 class="header-title__name" :class="{ 'is-editable': editable }" @click="handleUpdateTitle">
      {{ title || titleFallback }}
      <span v-if="editable" class="header-title__edit">
        <i class="icon-park-outline-edit"></i>
      </span>
    </h4>
    <p class="header-title__desc" :class="{ 'is-editable': editable }" @click="handleUpdateDesc">
      {{ desc || descFallback }}
      <span v-if="editable" class="header-title__edit">
        <i class="icon-park-outline-edit"></i>
      </span>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'

const props = withDefaults(
  defineProps<{
    title: string
    desc: string
    editable?: boolean
    titlePromptTitle?: string
    titlePromptMessage?: string
    descPromptTitle?: string
    descPromptMessage?: string
    titleFallback?: string
    descFallback?: string
    titleRequiredMessage?: string
  }>(),
  {
    editable: true,
    titlePromptTitle: '编辑名称',
    titlePromptMessage: '请输入名称',
    descPromptTitle: '编辑描述',
    descPromptMessage: '请输入描述',
    titleFallback: '未命名',
    descFallback: '暂无描述',
    titleRequiredMessage: '名称不能为空'
  }
)

const emit = defineEmits<{
  'update:title': [value: string]
  'update:desc': [value: string]
}>()

const titlePattern = /^[\u4e00-\u9fa5_a-zA-Z0-9\s_()（）-]{1,30}$/
const descPattern = /^[\u4e00-\u9fa5_a-zA-Z0-9\s_()（）-]{0,100}$/

const handleUpdateTitle = () => {
  if (!props.editable) return
  ElMessageBox.prompt(props.titlePromptMessage, props.titlePromptTitle, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: titlePattern,
    inputErrorMessage: '名称仅支持中英文、数字、空格、下划线、短横线和括号，且不能为空',
    inputValue: props.title || props.titleFallback,
    autofocus: true
  }).then(({ value }) => {
    const normalizedValue = value.trim()
    if (!normalizedValue) {
      ElMessage.error(props.titleRequiredMessage)
      return
    }
    emit('update:title', normalizedValue)
  })
}

const handleUpdateDesc = () => {
  if (!props.editable) return
  ElMessageBox.prompt(props.descPromptMessage, props.descPromptTitle, {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: descPattern,
    inputErrorMessage: '描述仅支持中英文、数字、空格、下划线、短横线和括号',
    inputValue: props.desc || '',
    autofocus: true
  }).then(({ value }) => {
    emit('update:desc', value.trim())
  })
}
</script>

<style scoped lang="scss">
.header-title {
  display: flex;
  min-width: 0;
  max-width: 520px;
  flex-direction: column;
  align-items: center;
  padding: 4px 0;
}

.header-title__name {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 8px;
  margin: 0;
  overflow: hidden;
  color: #303133;
  font-size: 18px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-editable {
    cursor: pointer;
  }
}

.header-title__desc {
  display: flex;
  max-width: 100%;
  align-items: center;
  gap: 8px;
  margin: 4px 0 0;
  overflow: hidden;
  color: #606266;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;

  &.is-editable {
    cursor: pointer;
  }
}

.header-title__edit {
  opacity: 0;
  color: #909399;
  font-size: 14px;
  transition: opacity 0.2s;

  &:hover {
    color: #409eff;
  }
}

.header-title__name:hover .header-title__edit,
.header-title__desc:hover .header-title__edit {
  opacity: 1;
}
</style>
