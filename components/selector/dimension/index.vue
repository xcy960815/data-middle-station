<template>
  <div class="dimension-selector" @contextmenu="contextmenuHandler">
    <selector-template v-bind="$attrs" :index="props.index">
      <template #prefix-icon>
        <slot name="prefix-icon"></slot>
      </template>
      <template #dimension-suffix>
        <slot name="dimension-suffix"></slot>
      </template>
    </selector-template>
  </div>
  <!-- 字段的操作选项 -->
  <context-menu ref="contextmenuRef">
    <context-menu-item v-if="drillEnabled && drillLevelState === 'path'" @click="handleRollUp">
      上卷到「{{ dimensionLabel }}」
    </context-menu-item>
    <context-menu-item
      v-if="drillEnabled && drillLevelState === 'current'"
      :disabled="availableDrillValues.length === 0"
      @click="handleOpenSelectDrillValue(false)"
    >
      选择「{{ dimensionLabel }}」值
    </context-menu-item>
    <context-menu-item
      v-if="drillEnabled && (drillLevelState === 'current' || drillLevelState === 'next')"
      :disabled="!nextLevelLabel"
      @click="handleDrillDown"
    >
      下钻到「{{ nextLevelLabel || dimensionLabel }}」
    </context-menu-item>
    <context-menu-item v-if="drillEnabled && drillLevelState === 'future'" disabled>
      请先下钻到上一层
    </context-menu-item>
    <context-menu-item v-if="drillEnabled" @click="emit('resetDrill')">重置钻取路径</context-menu-item>
    <context-menu-divider v-if="drillEnabled"></context-menu-divider>
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
  <el-dialog
    v-model="drillValueDialogVisible"
    :title="`选择「${currentLevelLabel || dimensionLabel}」值`"
    width="360px"
  >
    <el-select v-model="draftDrillValue" class="w-full" filterable placeholder="请选择下钻路径值">
      <el-option v-for="item in availableDrillValues" :key="item.value" :label="item.label" :value="item.value" />
    </el-select>
    <div class="dimension-selector__drill-hint">候选值来自当前查询结果。</div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="drillValueDialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!draftDrillValue" @click="handleConfirmSelectDrillValue">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox } from 'element-plus'
import ContextMenu from '../../context-menu/index.vue'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  index: {
    type: Number,
    default: null
  },
  dimension: {
    type: Object as PropType<DimensionStore.DimensionOption>,
    required: true,
    default: () => ({})
  },
  drillEnabled: {
    type: Boolean,
    default: false
  },
  drillLevelState: {
    type: String as PropType<'path' | 'current' | 'next' | 'future'>,
    default: 'current'
  },
  drillPathValue: {
    type: [String, Number, Boolean, null] as PropType<DimensionStore.DrillPathItem['value']>,
    default: null
  },
  currentLevelLabel: {
    type: String,
    default: ''
  },
  nextLevelLabel: {
    type: String,
    default: ''
  },
  canDrillDown: {
    type: Boolean,
    default: false
  },
  availableDrillValues: {
    type: Array as PropType<Array<{ label: string; value: string }>>,
    default: () => []
  }
})

const emit = defineEmits<{
  rollUp: []
  drillDown: [value?: DimensionStore.DrillPathItem['value']]
  selectDrillValue: [value: DimensionStore.DrillPathItem['value']]
  resetDrill: []
}>()

const dimensionStore = useDimensionsStore()

const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
const drillValueDialogVisible = ref(false)
const draftDrillValue = ref<string>('')
const selectValueThenDrill = ref(false)

const dimensionLabel = computed(
  () => props.dimension.displayName || props.dimension.columnComment || props.dimension.columnName
)

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

const handleRollUp = () => {
  emit('rollUp')
}

const handleDrillDown = () => {
  if (!props.canDrillDown) {
    handleOpenSelectDrillValue(true)
    return
  }
  emit('drillDown')
}

const handleOpenSelectDrillValue = (thenDrill = false) => {
  selectValueThenDrill.value = thenDrill
  draftDrillValue.value = props.drillPathValue == null ? '' : String(props.drillPathValue)
  drillValueDialogVisible.value = true
}

const handleConfirmSelectDrillValue = () => {
  if (!draftDrillValue.value) return
  emit('selectDrillValue', draftDrillValue.value)
  if (selectValueThenDrill.value) {
    emit('drillDown', draftDrillValue.value)
  }
  drillValueDialogVisible.value = false
  selectValueThenDrill.value = false
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
const handleSetWidth = () => {
  ElMessageBox.prompt('请输入列宽', {
    title: '设置列宽',
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern: /^[1-9]\d*$/,
    inputErrorMessage: '列宽仅支持正整数',
    inputValue: String(currentDimension.value!.width || ''),
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
.dimension-selector {
  cursor: context-menu;
}

.dimension-selector__drill-hint {
  margin-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
