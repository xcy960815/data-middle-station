<template>
  <div class="dimension relative h-full" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="dimension__title">值</div>
    <div class="dimension__content">
      <div
        data-action="drag"
        class="dimension__item"
        v-for="(item, index) in dimensionList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <div class="dimension__item__name">{{ item.name }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data';
import { handler } from './handler';
const { dimensionList } = initData();
const { dragstartHandler, dragHandler, dragoverHandler, dropHandler } = handler({ dimensionList });
</script>

<style lang="less" scoped>
.dimension {
  .dimension__content {
    list-style: none;
    overflow: auto;
    .dimension__item {
      padding: 0 10px;
      cursor: move;
      height: 30px;
      line-height: 30px;
      position: relative;
    }
  }
}
</style>
