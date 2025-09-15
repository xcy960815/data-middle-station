<template>
  <div class="dimension-selecter" @contextmenu="contextmenuHandler">
    <selecter-template v-bind="$attrs" :dimension="dimension"></selecter-template>
  </div>
  <!-- 字段的操作选项 -->
  <context-menu ref="contextmenuRef">
    <context-menu-item @click="handleSetAlias">设置别名</context-menu-item>
    <context-menu-item @click="handleSetColumnWidth">设置列宽</context-menu-item>
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
  dimension: {
    type: Object as PropType<DimensionStore.DimensionOption>,
    required: true,
    default: () => ({})
  }
})
const dimensionStore = useDimensionsStore()
const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

/**
 * @desc 当前选中的列
 */
const currentDimension = ref<DimensionStore.DimensionOption | null>(null)
/**
 * @desc 右键点击事件
 */
const contextmenuHandler = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  currentDimension.value = props.dimension

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
    inputValue: currentDimension.value!.displayName || '',
    autofocus: true
  })
    .then(({ value }) => {
      if (!currentDimension.value) return
      currentDimension.value.displayName = value
      dimensionStore.updateDimension(currentDimension.value)
      currentDimension.value = null
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
      currentDimension.value = null
    })
}

/**
 * @desc 设置列宽
 */
const handleSetColumnWidth = () => {
  if (!currentDimension.value) return

  // 获取列的显示名称（优先使用别名，否则使用原始名称）
  const columnName = currentDimension.value.displayName || currentDimension.value.columnName || '未知列'

  ElMessageBox.prompt(`请输入列"${columnName}"的宽度`, {
    title: `设置列宽 - ${columnName}`,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[1-9]\d*$/,
    inputErrorMessage: '列宽仅支持正整数',
    inputValue: String(currentDimension.value.width || ''),
    autofocus: true
  })
    .then(({ value }) => {
      if (!currentDimension.value) return
      currentDimension.value.width = Number(value)
      dimensionStore.updateDimension(currentDimension.value)
      currentDimension.value = null
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
      currentDimension.value = null
    })
}

/**
 * @desc 设置固定列
 */
const handleSetFixed = (fixed: 'left' | 'right' | null) => {
  if (!currentDimension.value) return
  currentDimension.value.fixed = fixed
  dimensionStore.updateDimension(currentDimension.value)
  currentDimension.value = null
}

/**
 * @desc 设置对齐方式
 */
const handleSetAlign = (align: 'left' | 'right' | 'center' | null) => {
  if (!currentDimension.value) return
  currentDimension.value.align = align
  dimensionStore.updateDimension(currentDimension.value)
  currentDimension.value = null
}

/**
 * @desc 设置排序
 */
const handleSetSortable = () => {
  if (!currentDimension.value) return
  currentDimension.value.sortable = !currentDimension.value.sortable
  dimensionStore.updateDimension(currentDimension.value)
  currentDimension.value = null
}

/**
 * @desc 设置表头过滤
 */
const handleSetFilterable = () => {
  if (!currentDimension.value) return
  currentDimension.value.filterable = !currentDimension.value.filterable
  dimensionStore.updateDimension(currentDimension.value)
  currentDimension.value = null
}
</script>
<style lang="scss" scoped>
.dimension-selecter {
  cursor: context-menu;
}
</style>
