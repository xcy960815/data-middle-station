<template>
  <el-select v-model="dataSource" class="dataSource-select mb-1 w-full z-40" placeholder="请选择数据源" >
    <el-option
      v-for="item in dataSourceOptions"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </el-select>

  <div class="column" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="column__title">维度</div>
    <div class="column__content">
      <div @contextmenu="contextmenuHandler(column)" v-contextmenu:contextmenu :class="columnClasses(column)"
        v-for="(column, index) in columnList" :key="index" draggable="true"
        @dragstart="dragstartHandler(column, index, $event)" @dragend="dragendHandler" @mousedown.stop>
        <span class="column__item__name">{{ column.name }}</span>
      </div>
    </div>
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
        <context-menu-item @click="setDataModel">时间</context-menu-item>
        <context-menu-item @click="setDataModel">日期</context-menu-item>
      </context-menu-submenu>
      <context-menu-divider> </context-menu-divider>
      <context-menu-submenu title="地理角色">
        <context-menu-item @click="setDataModel">经度</context-menu-item>
        <context-menu-item @click="setDataModel">纬度</context-menu-item>
        <context-menu-item @click="setDataModel">位置</context-menu-item>
        <context-menu-item @click="setDataModel">关联值</context-menu-item>
      </context-menu-submenu>
    </context-menu>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data'
import { handler } from './handler'
const {
  columnClasses,
  dataSource,
  dataSourceOptions,
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
</script>

<style scoped lang="less">
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

      &.column__item-choosed::after {
        position: absolute;
        left: 0px;
        top: 13px;
        content: '';
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background-color: #54c32a;
      }
    }
  }
}
</style>
