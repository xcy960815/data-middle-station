<template>
  <!-- 分析页面的layout布局 -->
  <el-container
    class="layout-analyse-main h-full w-full !flex !flex-col flex-1 border-box"
  >
    <slot name="header"></slot>
    <el-container
      class="layout-analyse-body !flex overflow-hidden"
    >
      <!-- cloumn -->
      <el-aside
        class="layout-analyse-cloumn relative text-[14px] p-[18px,30px]"
        @mousedown.prevent="handleCloumnMouseDown"
      >
        <slot name="cloumn"></slot>
      </el-aside>

      <el-aside
        class="layout-analyse-handler !flex flex-col !w-[180px] text-[12px] m-[18px]"
      >
        <!-- filter -->
        <el-aside
          class="layout-filter relative h-[130px] !w-full bg-[#f5f5f5] rounded-[4px] p-[7px]"
          @mousedown.prevent="handleFilterMouseDown"
        >
          <slot name="filter"></slot>
        </el-aside>
        <!-- order -->
        <el-aside
          class="layout-order relative h-[130px] !w-full bg-[#f5f5f5] mt-[18px] rounded-[4px] p-[7px]"
          @mousedown.prevent="handleOrderMouseDown"
        >
          <slot name="order"></slot>
        </el-aside>
        <!-- dimension -->
        <el-aside
          class="layout-dimension flex-1 !w-full bg-[#f5f5f5] mt-[18px] rounded-[4px] p-[7px]"
        >
          <slot name="dimension"></slot>
        </el-aside>
      </el-aside>

      <el-main
        class="layout-analyse-content !flex flex-1 flex-col overflow-hidden"
      >
        <div class="layout-analyse-bar">
          <slot name="bar"></slot>
        </div>

        <div class="layout-analyse-charts flex-1">
          <slot name="charts"></slot>
        </div>

        <div
          class="layout-analyse-group bg-[#f5f5f5] text-[12px] h-[40px] rounded-[4px] p-[7px]"
        >
          <slot name="group"></slot>
        </div>
      </el-main>
      <el-aside
        class="layout-analyse-charts-type !w-[140px] pt-[18px] bg-[#f5f5f5]"
      >
        <slot name="charts-type"></slot>
      </el-aside>
      <slot name="charts-config"></slot>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
/**
 * @link https://blog.csdn.net/lizhongyu0922/article/details/90517324 给伪类添加事件
 * @desc cloumn 组件拖拽事件
 * @param {MouseEvent} mouseEvent
 * @returns {void}
 */
const handleCloumnMouseDown = (mouseEvent: MouseEvent) => {
  const layoutCloumn = document.querySelector(
    '.layout-analyse-cloumn'
  ) as HTMLElement
  const startWidth = mouseEvent.clientX
  const selfWidth = layoutCloumn.clientWidth
  const handleMouseMove = (e: MouseEvent) => {
    layoutCloumn.style.width = `${
      selfWidth + e.clientX - startWidth
    }px`
  }
  const handleMouseUp = () => {
    document.removeEventListener(
      'mousemove',
      handleMouseMove
    )
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
/**
 * @desc filter 组件拖拽事件
 * @param {MouseEvent} mouseEvent
 * @returns {void}
 */
const handleFilterMouseDown = (mouseEvent: MouseEvent) => {
  const layoutFilter = document.querySelector(
    '.layout-filter'
  ) as HTMLElement
  const startHeight = mouseEvent.clientY
  const selfHeight = layoutFilter.clientHeight
  const handleMouseMove = (e: MouseEvent) => {
    layoutFilter.style.height = `${
      selfHeight + e.clientY - startHeight
    }px`
  }
  const handleMouseUp = () => {
    document.removeEventListener(
      'mousemove',
      handleMouseMove
    )
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
/**
 * @desc order 组件拖拽事件
 * @param {MouseEvent} mouseEvent
 * @returns {void}
 */
const handleOrderMouseDown = (mouseEvent: MouseEvent) => {
  const layoutOrder = document.querySelector(
    '.layout-order'
  ) as HTMLElement
  const startHeight = mouseEvent.clientY
  const selfHeight = layoutOrder.clientHeight
  const handleMouseMove = (e: MouseEvent) => {
    layoutOrder.style.height = `${
      selfHeight + e.clientY - startHeight
    }px`
  }
  const handleMouseUp = () => {
    document.removeEventListener(
      'mousemove',
      handleMouseMove
    )
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>
<style lang="less" scoped>
.layout-analyse-main {
  .layout-analyse-body {
    .layout-analyse-cloumn {
      padding: 18px 30px;
      width: 200px;
      pointer-events: none;

      &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        right: 0px;
        background-color: #eeeeee;
        cursor: col-resize;
        pointer-events: auto;
      }
    }

    .layout-analyse-handler {
      .layout-filter {
        &::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          bottom: 0px;
          background-color: #eeeeee;
          cursor: row-resize;
          pointer-events: auto;
        }
      }

      .layout-order {
        &::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          bottom: 0px;
          background-color: #eeeeee;
          cursor: row-resize;
          pointer-events: auto;
        }
      }
    }

    .layout-analyse-content {
      padding: 18px 0;
    }
  }
}
</style>
