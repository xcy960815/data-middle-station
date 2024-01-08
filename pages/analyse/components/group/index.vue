<template>
  <!-- 分析页面下方分组 -->
  <div
    class="group relative h-full flex items-center"
    @dragover="dragoverHandler"
    @drop="dropHandler"
  >
    <div class="group__title">分组</div>
    <div class="group__content flex items-center flex-1">
      <div
        data-action="drag"
        class="group__item flex items-center flex-1"
        v-for="(item, index) in groupList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
      >
        <selecter
          class="group__item__name"
          cast="dimension"
          :name="item.columnName"
        ></selecter>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data'
import { handler } from './handler'
const { groupList } = initData()
const {
  dragstartHandler,
  dragHandler,
  dragoverHandler,
  dropHandler
} = handler({ groupList })
</script>

<style lang="less" scoped>
.group {
  .group__content {
    list-style: none;
    overflow: auto;
    .group__item {
      padding: 0 10px;
      cursor: move;
      height: 30px;
      line-height: 30px;
    }
  }
}
</style>
