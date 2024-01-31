<template>
  <div class="filter relative h-full flex flex-col" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="filter__title my-1">筛选</div>
    <div class="filter__content flex-auto">
      <div data-action="drag" class="filter__item" v-for="(item, index) in filterList" :key="index" draggable="true"
        @dragstart.native="dragstartHandler(index, $event)" @drag.native="dragHandler(index, $event)" @mousedown.stop>
        <selecter class="filter__item__name" cast="filter" :name="item.columnName" v-model:filterType="item.filterType"
          v-model:filterValue="item.filterValue"></selecter>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data';
import { handler } from './handler';
const { filterList } = initData();
const { dragstartHandler, dragHandler, dragoverHandler, dropHandler } = handler({ filterList });

</script>

<style lang="less" scoped>
.filter {
  pointer-events: initial;

  .filter__content {
    list-style: none;
    overflow: auto;

    .filter__item {
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
