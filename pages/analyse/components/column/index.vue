<template>
  <div
    class="column"
    @dragover="dragoverHandler"
    @drop="dropHandler"
  >
    <!-- 数据源 -->
    <TableSelecter />
    <div class="column__title">维度</div>
    <div class="column__content">
      <div
        @contextmenu="contextmenuHandler(column)"
        class="flex items-center"
        :class="columnClasses(column)"
        v-for="(column, index) in columnList"
        :key="index"
        draggable="true"
        @dragstart="dragstartHandler(column, index, $event)"
        @dragend="dragendHandler"
        @mousedown.stop
      >
        <Icon
          class="mt-[1px] mr-[1px]"
          width="14"
          height="14"
          :rotate="2"
          :horizontalFlip="true"
          :verticalFlip="true"
          :icon="columnIconName(column)"
        />
        <span class="column__item__name">{{
          column.columnName
        }}</span>
      </div>
    </div>
    <!-- v-contextmenu:contextmenu -->
    <!-- 字段的操作选项 -->
    <context-menu ref="contextmenu">
      <context-menu-item @click="setDataModel">
        商家ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        买家ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        商品ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        作者ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        动态ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        视频ID
      </context-menu-item>
      <context-menu-item @click="setDataModel">
        图片Url
      </context-menu-item>
      <context-menu-divider> </context-menu-divider>
      <context-menu-submenu title="时间">
        <context-menu-item @click="setDataModel"
          >时间</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >日期</context-menu-item
        >
      </context-menu-submenu>
      <context-menu-divider> </context-menu-divider>
      <context-menu-submenu title="地理角色">
        <context-menu-item @click="setDataModel"
          >经度</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >纬度</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >位置</context-menu-item
        >
        <context-menu-item @click="setDataModel"
          >关联值</context-menu-item
        >
      </context-menu-submenu>
    </context-menu>
  </div>
</template>

<script setup lang="ts">
import TableSelecter from '@/components/selecter/table/index.vue'
import Icon from '@/components/context-menu/Icon.vue'
import ContextMenu from '@/components/context-menu/index.vue'
import { initData } from './init-data'
import { handler } from './handler'
const {
  columnClasses,
  columnIconName,
  columnList,
  currentColumn
} = initData()

const {
  dragstartHandler,
  dragendHandler,
  contextmenuHandler,
  setDataModel,
  dragoverHandler,
  dropHandler
} = handler({
  currentColumn
})
const handleClickTitle = () => {
  console.log('handleClickTitle')
}
</script>

<style scoped lang="scss">
.column {
  height: 100%;
  pointer-events: initial;

  .column__content {
    list-style: none;
    overflow: auto;

    .column__item {
      padding: 0 10px;
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;

      &.column__item_dimension_choosed::after {
        position: absolute;
        left: 0px;
        top: 14px;
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #54c32a;
      }

      &.column__item_group_choosed::after {
        position: absolute;
        left: 0px;
        top: 14px;
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #1292f7;
      }
    }
  }
}
</style>
