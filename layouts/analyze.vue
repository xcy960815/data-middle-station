<template>
  <!-- 分析页面的layout布局 -->
  <div class="layout-analyze-main h-full w-full !flex !flex-col flex-1 border-box">
    <slot name="header"></slot>
    <div class="layout-analyze-body !flex flex-1 overflow-hidden">
      <div class="layout-analyze-cloumn relative text-[14px]" @mousedown.prevent="handleCloumnMouseDown">
        <slot name="cloumn"></slot>
      </div>

      <div class="layout-analyze-handler !flex flex-col !w-[180px] text-[12px] m-[14px]">
        <div
          class="layout-filter relative h-[130px] !w-full bg-[#f5f5f5] rounded-[4px] p-[7px]"
          @mousedown.prevent="handleFilterMouseDown"
        >
          <slot name="filter"></slot>
        </div>
        <div
          class="layout-order relative h-[130px] !w-full bg-[#f5f5f5] mt-[18px] rounded-[4px] p-[7px]"
          @mousedown.prevent="handleOrderMouseDown"
        >
          <slot name="order"></slot>
        </div>
        <div class="layout-analyze-dimension flex-1 !w-full bg-[#f5f5f5] mt-[18px] rounded-[4px] p-[7px]">
          <slot name="dimension"></slot>
        </div>
      </div>

      <div class="layout-analyze-content m-[14px] ml-0 !flex flex-1 flex-col overflow-hidden">
        <div class="layout-analyze-bar">
          <slot name="bar"></slot>
        </div>

        <div class="layout-analyze-chart flex-1 overflow-hidden">
          <slot name="chart"></slot>
        </div>

        <div class="layout-analyze-group bg-[#f5f5f5] text-[12px] h-[40px] rounded-[4px] p-[7px]">
          <slot name="group"></slot>
        </div>
      </div>
      <div class="layout-analyze-chart-type !w-[140px] bg-[#f5f5f5]">
        <slot name="chart-type"></slot>
      </div>
      <slot name="chart-config"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
/**
 * @link https://blog.csdn.net/lizhongyu0922/article/details/90517324 给伪类添加事件
 * @desc cloumn 组件拖拽事件
 * @param {MouseEvent} mouseEvent
 * @returns {void}
 */
const handleCloumnMouseDown = (mouseEvent: MouseEvent) => {
  const layoutCloumn = document.querySelector('.layout-analyze-cloumn') as HTMLElement
  const startWidth = mouseEvent.clientX
  const selfWidth = layoutCloumn.clientWidth
  const handleMouseMove = (e: MouseEvent) => {
    layoutCloumn.style.width = `${selfWidth + e.clientX - startWidth}px`
  }
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
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
  const layoutFilter = document.querySelector('.layout-filter') as HTMLElement
  const startHeight = mouseEvent.clientY
  const selfHeight = layoutFilter.clientHeight
  const handleMouseMove = (e: MouseEvent) => {
    layoutFilter.style.height = `${selfHeight + e.clientY - startHeight}px`
  }
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
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
  const layoutOrder = document.querySelector('.layout-order') as HTMLElement
  const startHeight = mouseEvent.clientY
  const selfHeight = layoutOrder.clientHeight
  const handleMouseMove = (e: MouseEvent) => {
    layoutOrder.style.height = `${selfHeight + e.clientY - startHeight}px`
  }
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove)
  }
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)
}
</script>
<style lang="scss" scoped>
.layout-analyze-main {
  .layout-analyze-body {
    .layout-analyze-cloumn {
      padding: 18px 10px;
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

    .layout-analyze-handler {
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
  }
}
</style>
