<template>
  <div class="header pl-5 pr-5">
    <div class="header-left">
      <h4 style="color: #fff">blog-home-nuxt</h4>
    </div>
    <div style="flex: 1"></div>
    <user-info class="header-right"></user-info>
  </div>
</template>

<script lang="ts" setup>
import UserInfo from './user-info/index.vue';
const collapseProps = defineProps({
  collapse: {
    default: () => false,
    type: Boolean,
  },
});
const isCollapse: Ref<Boolean> = computed({
  get: () => {
    return collapseProps.collapse;
  },
  set: (val) => {
    // emit('update:collapse', val)
  },
});
</script>
<style lang="less" scoped>
.header {
  background-color: #001529;
  height: 60px;
  min-height: 60px;
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
