<template>
  <div class="measure-selector" :class="$attrs.class" @contextmenu="contextmenuHandler">
    <selector-template
      :index="props.index"
      cast="measure"
      :display-name="props.displayName"
      :invalid="props.invalid"
      :invalid-message="props.invalidMessage"
    >
      <template #measure-aggregation>
        <el-popover
          ref="aggregationPopoverRef"
          placement="bottom-start"
          trigger="click"
          width="auto"
          :disabled="!hasAggregationSlot"
        >
          <template #reference>
            <span class="measure-aggregation-trigger" @click.stop @mousedown.stop @contextmenu.stop>
              <slot name="measure-aggregation"></slot>
            </span>
          </template>
          <div class="measure-aggregation-options">
            <slot :close-popover="closeAggregationPopover"></slot>
          </div>
        </el-popover>
      </template>
    </selector-template>
  </div>
  <!-- 字段的操作选项 -->
  <context-menu ref="contextmenuRef">
    <!-- 设置别名 -->
    <context-menu-item @click="handleSetAlias">设置别名</context-menu-item>
  </context-menu>
</template>

<script lang="ts" setup>
import { ElMessage, ElMessageBox, ElPopover } from 'element-plus'
import ContextMenu from '../../context-menu/index.vue'

defineOptions({
  inheritAttrs: false
})

const props = defineProps({
  index: {
    type: Number,
    default: null
  },
  displayName: {
    type: String,
    default: ''
  },
  invalid: {
    type: Boolean,
    default: false
  },
  invalidMessage: {
    type: String,
    default: ''
  },
  measure: {
    type: Object as PropType<MeasureStore.MeasureOption>,
    required: true,
    default: () => ({})
  }
})
const measureStore = useMeasuresStore()
const contextmenuRef = ref<InstanceType<typeof ContextMenu> | null>(null)
const slots = useSlots()
const aggregationPopoverRef = ref<InstanceType<typeof ElPopover> | null>(null)
const hasAggregationSlot = computed(() => !!slots['measure-aggregation'])

const closeAggregationPopover = () => {
  aggregationPopoverRef.value?.hide()
}

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
</script>
<style lang="scss" scoped>
.measure-selector {
  cursor: context-menu;
}

.measure-aggregation-trigger {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
}
</style>
