<template>
  <div class="group-selecter" @contextmenu="contextmenuHandler">
    <selecter-template v-bind="$attrs"></selecter-template>
  </div>
  <!-- 字段的操作选项 -->
  <context-menu ref="contextmenuRef">
    <context-menu-item @click="handleSetAlias">设置别名</context-menu-item>
    <context-menu-item @click="handleSetWidth">设置列宽</context-menu-item>
    <!-- 开启排序 -->
    <context-menu-item @click="handleSetSortable">开启排序</context-menu-item>
    <!-- 开启表头过滤 -->
    <context-menu-item @click="handleSetFilterable">开启表头过滤</context-menu-item>
    <!-- 对齐方式 -->
    <context-menu-submenu title="设置对齐方式">
      <context-menu-item @click="handleSetAlign('left')">左对齐</context-menu-item>
      <context-menu-item @click="handleSetAlign('center')">居中对齐</context-menu-item>
      <context-menu-item @click="handleSetAlign('right')">右对齐</context-menu-item>
      <context-menu-item @click="handleSetAlign(null)">取消对齐</context-menu-item>
    </context-menu-submenu>
    <context-menu-divider></context-menu-divider>
    <context-menu-submenu title="固定列">
      <context-menu-item @click="handleSetFixed('left')">左固定</context-menu-item>
      <context-menu-item @click="handleSetFixed('right')">右固定</context-menu-item>
      <context-menu-item @click="handleSetFixed(null)">取消固定</context-menu-item>
    </context-menu-submenu>
  </context-menu>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import ContextMenu from '../../context-menu/index.vue'
import SelecterTemplate from '../template/index.vue'

const props = defineProps({
  group: {
    type: Object as PropType<GroupStore.GroupOption>,
    required: true,
    default: () => ({})
  }
})

const groupStore = useGroupStore()

const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

/**
 * @desc 当前选中的列
 */
const currentGroup = ref<GroupStore.GroupOption | null>(null)
/**
 * @desc 右键点击事件
 */
const contextmenuHandler = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  currentGroup.value = props.group
  // 直接显示右键菜单
  if (contextmenuRef.value) {
    contextmenuRef.value.show(event)
  }
}
/**
 * @desc 设置别名
 */
const handleSetAlias = () => {
  ElMessageBox.prompt('请输入别名', '设置别名', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[\u4e00-\u9fa5_a-zA-Z0-9\s]{1,30}$/,
    inputErrorMessage: '别名仅支持中英文、数字、下划线，且不能为空',
    inputValue: currentGroup.value!.displayName || '',
    autofocus: true
  })
    .then(({ value }) => {
      if (!currentGroup.value) return
      currentGroup.value.displayName = value
      groupStore.updateGroup(currentGroup.value)
      currentGroup.value = null
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
      currentGroup.value = null
    })
}

/**
 * @desc 设置列宽
 */
const handleSetWidth = () => {
  ElMessageBox.prompt('请输入列宽', {
    title: '设置列宽',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[1-9]\d*$/,
    inputErrorMessage: '列宽仅支持正整数',
    inputValue: String(currentGroup.value!.width || ''),
    autofocus: true
  })
    .then(({ value }) => {
      if (!currentGroup.value) return
      currentGroup.value.width = Number(value)
      groupStore.updateGroup(currentGroup.value)
      currentGroup.value = null
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
      currentGroup.value = null
    })
}

/**
 * @desc 设置固定列
 */
const handleSetFixed = (fixed: 'left' | 'right' | null) => {
  if (!currentGroup.value) return
  currentGroup.value.fixed = fixed
  groupStore.updateGroup(currentGroup.value)
  currentGroup.value = null
}

/**
 * @desc 设置对齐方式
 */
const handleSetAlign = (align: 'left' | 'right' | 'center' | null) => {
  if (!currentGroup.value) return
  currentGroup.value.align = align
  groupStore.updateGroup(currentGroup.value)
  currentGroup.value = null
}

/**
 * @desc 设置排序
 */
const handleSetSortable = () => {
  if (!currentGroup.value) return
  currentGroup.value.sortable = !currentGroup.value.sortable
  groupStore.updateGroup(currentGroup.value)
  currentGroup.value = null
}

/**
 * @desc 设置表头过滤
 */
const handleSetFilterable = () => {
  if (!currentGroup.value) return
  currentGroup.value.filterable = !currentGroup.value.filterable
  groupStore.updateGroup(currentGroup.value)
  currentGroup.value = null
}
</script>
<style lang="scss" scoped>
.group-selecter {
  cursor: context-menu;
}
</style>
