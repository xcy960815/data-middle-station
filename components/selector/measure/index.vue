<template>
  <div class="measure-selector" @contextmenu="contextmenuHandler">
    <selector-template v-bind="$attrs" :index="props.index" :measure="measure">
      <template #suffix-icon>
        <slot name="suffix-icon"></slot>
      </template>
      <template #default="{ closePopover }">
        <slot :close-popover="closePopover"></slot>
      </template>
    </selector-template>
  </div>
  <!-- 字段的操作选项 -->
  <context-menu ref="contextmenuRef">
    <!-- 设置别名 -->
    <context-menu-item @click="handleSetAlias">设置别名</context-menu-item>
    <!-- 设置列宽 -->
    <context-menu-item @click="handleSetColumnWidth">设置列宽</context-menu-item>
    <!-- 开启排序 -->
    <context-menu-item @click="handleSetSortable">开启排序</context-menu-item>
    <!-- 开启表头过滤 -->
    <context-menu-item @click="handleSetFilterable">开启表头过滤</context-menu-item>
    <!-- 对齐方式 -->
    <context-menu-submenu title="设置对齐方式">
      <!-- 左对齐 -->
      <context-menu-item @click="handleSetAlign('left')">左对齐</context-menu-item>
      <!-- 居中对齐 -->
      <context-menu-item @click="handleSetAlign('center')">居中对齐</context-menu-item>
      <!-- 右对齐 -->
      <context-menu-item @click="handleSetAlign('right')">右对齐</context-menu-item>
      <!-- 取消对齐 -->
      <context-menu-item @click="handleSetAlign(null)">取消对齐</context-menu-item>
    </context-menu-submenu>
    <context-menu-divider></context-menu-divider>
    <context-menu-submenu title="固定列">
      <!-- 左固定 -->
      <context-menu-item @click="handleSetFixed('left')">左固定</context-menu-item>
      <!-- 右固定 -->
      <context-menu-item @click="handleSetFixed('right')">右固定</context-menu-item>
      <!-- 取消固定 -->
      <context-menu-item @click="handleSetFixed(null)">取消固定</context-menu-item>
    </context-menu-submenu>
  </context-menu>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import ContextMenu from '../../context-menu/index.vue'

const props = defineProps({
  index: {
    type: Number,
    default: null
  },
  measure: {
    type: Object as PropType<MeasureStore.MeasureOption>,
    required: true,
    default: () => ({})
  }
})
const measureStore = useMeasuresStore()
const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)

const updateCurrentMeasure = () => {
  if (!currentMeasure.value || props.index === null) return
  measureStore.updateMeasureByIndex(props.index, currentMeasure.value)
}

/**
 * @desc 当前选中的列
 */
const currentMeasure = ref<MeasureStore.MeasureOption | null>(null)
/**
 * @desc 右键点击事件
 */
const contextmenuHandler = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  currentMeasure.value = props.measure

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
    inputValue: currentMeasure.value!.displayName || '',
    autofocus: true
  })
    .then(({ value }) => {
      if (!currentMeasure.value) return
      currentMeasure.value.displayName = value
      updateCurrentMeasure()
      currentMeasure.value = null
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
      currentMeasure.value = null
    })
}

/**
 * @desc 设置列宽
 */
const handleSetColumnWidth = () => {
  if (!currentMeasure.value) return

  // 获取列的显示名称（优先使用别名，否则使用原始名称）
  const columnName = currentMeasure.value.displayName || currentMeasure.value.columnName || '未知列'

  ElMessageBox.prompt(`请输入列"${columnName}"的宽度`, {
    title: `设置列宽 - ${columnName}`,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[1-9]\d*$/,
    inputErrorMessage: '列宽仅支持正整数',
    inputValue: String(currentMeasure.value.width || ''),
    autofocus: true
  })
    .then(({ value }) => {
      if (!currentMeasure.value) return
      currentMeasure.value.width = Number(value)
      updateCurrentMeasure()
      currentMeasure.value = null
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '取消操作'
      })
      currentMeasure.value = null
    })
}

/**
 * @desc 设置固定列
 * @param {"left" | "right" | null} fixed 固定列
 * @returns {void}
 */
const handleSetFixed = (fixed: 'left' | 'right' | null) => {
  if (!currentMeasure.value) return
  currentMeasure.value.fixed = fixed
  updateCurrentMeasure()
  currentMeasure.value = null
}

/**
 * @desc 设置对齐方式
 * @param {"left" | "right" | "center" | null} align 对齐方式
 * @returns {void}
 */
const handleSetAlign = (align: 'left' | 'right' | 'center' | null) => {
  if (!currentMeasure.value) return
  currentMeasure.value.align = align
  updateCurrentMeasure()
  currentMeasure.value = null
}

/**
 * @desc 设置排序
 * @returns {void}
 */
const handleSetSortable = () => {
  if (!currentMeasure.value) return
  currentMeasure.value.sortable = !currentMeasure.value.sortable
  updateCurrentMeasure()
  currentMeasure.value = null
}

/**
 * @desc 设置表头过滤
 * @returns {void}
 */
const handleSetFilterable = () => {
  if (!currentMeasure.value) return
  currentMeasure.value.filterable = !currentMeasure.value.filterable
  updateCurrentMeasure()
  currentMeasure.value = null
}
</script>
<style lang="scss" scoped>
.measure-selector {
  cursor: context-menu;
}
</style>
