<template>
  <div class="header pl-5 pr-5">
    <div class="header-left">
      <h4>blog-home-nuxt</h4>
    </div>
    <div class="flex-1"></div>
    <header-right class="header-right"></header-right>
  </div>
</template>

<script lang="ts" setup>
import HeaderRight from './header-right/index.vue';

</script>
<style lang="less" scoped>
.header {
  height: 50px;
  min-height: 50px;
  width: 100%;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 0 2px 8px #f0f1f2;

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
  }

  .header-left {
    width: 190px;
    justify-content: space-between;
  }
}
</style>
