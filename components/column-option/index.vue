<template>
  <div
    class="column-option flex items-center"
    :class="classes"
    :draggable="draggable"
    @contextmenu="contextmenuHandler"
    @dragstart="emit('dragstart', $event)"
    @dragend="emit('dragend', $event)"
    @mousedown.stop
  >
    <icon-park
      :title="column.columnType"
      class="mx-1"
      v-if="iconName"
      :type="iconName"
      size="14"
      fill="#333"
    ></icon-park>
    <span class="column-option__name text-ellipsis text-nowrap overflow-hidden">{{ displayName }}</span>
  </div>
  <context-menu ref="contextmenu">
    <context-menu-item @click="setDataModel('测试')"> 测试菜单项 </context-menu-item>
    <context-menu-divider></context-menu-divider>
    <context-menu-submenu title="时间">
      <context-menu-item @click="setDataModel('时间')">时间</context-menu-item>
      <context-menu-item @click="setDataModel('日期')">日期</context-menu-item>
    </context-menu-submenu>
  </context-menu>
</template>

<script setup lang="ts">
import ContextMenu from '@/components/context-menu/index.vue'
import { IconPark } from '@icon-park/vue-next/es/all'

const props = defineProps({
  column: {
    type: Object as PropType<ColumnsStore.ColumnOptions>,
    required: true
  },
  displayName: {
    type: String,
    default: ''
  },
  iconName: {
    type: String,
    default: ''
  },
  classes: {
    type: [String, Array, Object] as PropType<string | string[] | Record<string, boolean>>,
    default: ''
  },
  draggable: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits<{
  dragstart: [event: DragEvent]
  dragend: [event: DragEvent]
}>()

const contextmenu = ref<InstanceType<typeof ContextMenu> | null>(null)

const contextmenuHandler = (event: MouseEvent) => {
  event.preventDefault()
  event.stopPropagation()
  contextmenu.value?.show(event)
}

const setDataModel = (dataType: string) => {
  switch (dataType) {
    case '商家ID':
    case '买家ID':
    case '商品ID':
    case '作者ID':
    case '动态ID':
    case '视频ID':
      console.log(`设置 ${props.column.columnName} 为ID类型: ${dataType}`)
      break
    case '图片Url':
      console.log(`设置 ${props.column.columnName} 为URL类型: ${dataType}`)
      break
    case '时间':
    case '日期':
      console.log(`设置 ${props.column.columnName} 为时间类型: ${dataType}`)
      break
    case '经度':
    case '纬度':
    case '位置':
    case '关联值':
      console.log(`设置 ${props.column.columnName} 为地理类型: ${dataType}`)
      break
    default:
      console.log(`设置 ${props.column.columnName} 为未知类型: ${dataType}`)
  }
}
</script>

<style scoped lang="scss">
.column-option {
  padding: 0 10px;
  font-size: 12px;
  cursor: move;
  height: 24px;
  line-height: 24px;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 5px;

  &.column__item_measure_selected::before {
    position: absolute;
    left: 5px;
    top: 9px;
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: #54c32a;
  }

  &.column__item_dimension_selected::after {
    position: absolute;
    left: 5px;
    top: 9px;
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background-color: #1292f7;
  }
}
</style>
