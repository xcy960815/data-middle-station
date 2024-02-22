<template>
  <div
    class="dimension relative h-full flex flex-col"
    @dragover="dragoverHandler"
    @drop="dropHandler"
  >
    <div class="dimension__title my-1">值</div>
    <div
      class="dimension__content flex-1"
      v-contextmenu:contextmenu
    >
      <div
        data-action="drag"
        class="dimension__item my-1"
        v-for="(item, index) in dimensionList"
        :key="index"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selecter-dimension
          class="dimension__item__name"
          cast="dimension"
          :name="item.columnName"
          v-model:displayName="item.displayName"
          :index="index"
          :invalid="item.__invalid"
        ></selecter-dimension>
      </div>
    </div>
    <!-- 字段的操作选项 -->
    <context-menu ref="contextmenu">
      <context-menu-item @click="handleCreateComputedField">
        创建计算字段
      </context-menu-item>
    </context-menu>
    <!-- <client-only>
      <el-dialog
        v-model="createComputedFieldVisible"
        title="创建计算字段"
        width="30%"
      >
        <monaco-editor></monaco-editor>
        <template #footer>
          <span class="dialog-footer">
            <el-button
              @click="createComputedFieldVisible = false"
            >
              取消
            </el-button>
          </span>
        </template>
      </el-dialog>
    </client-only> -->
  </div>
</template>

<script setup lang="ts">
import { initData } from './init-data'
import { handler } from './handler'
const { dimensionList } = initData()
const createComputedFieldVisible = ref<boolean>(false)
const {
  dragstartHandler,
  dragHandler,
  dragoverHandler,
  dropHandler
} = handler({ dimensionList })
/**
 * @desc 创建计算字段
 * @return void
 */
const handleCreateComputedField = () => {
  console.log('创建计算字段')
  createComputedFieldVisible.value = true
}
</script>

<style lang="scss" scoped>
.dimension {
  .dimension__content {
    list-style: none;
    overflow: auto;
    .dimension__item {
      cursor: move;
      position: relative;
    }
  }
}
</style>
