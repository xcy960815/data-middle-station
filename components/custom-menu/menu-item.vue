<template>
  <el-sub-menu
    v-if="menuOption && menuOption.children && menuOption.children.length > 0"
    :index="menuOption.path"
  >
    <template #title>
      <el-icon :size="18" v-if="menuOption.meta?.menuIcon" class="menu-item-icon">
        <component :is="menuOption.meta?.menuIcon"></component>
      </el-icon>
      <span>{{ menuOption.meta?.menuName }}</span>
    </template>

    <template v-for="childRoute in menuOption.children" :key="childRoute.path">
      <menu-item :menu-option="childRoute"> </menu-item>
    </template>
  </el-sub-menu>

  <!-- <el-menu-item
    v-else-if="menuOption && menuOption.meta && menuOption.meta.link"
  >
    <el-icon :size="18" v-if="menuOption.meta.menuIcon" class="menu-item-icon">
      <component :is="menuOption.meta.menuIcon"></component>
    </el-icon>
    <template #title>
      <a
        :target="menuOption?.meta?.target"
        class="link-dom"
        :href="menuOption?.meta?.link"
        >{{ menuOption.meta.menuName }}</a
      >
    </template>
  </el-menu-item> -->
  <!-- -if="menuOption && menuOption.path" -->
  <el-menu-item v-else :index="menuOption.path">
    <el-icon :size="18" v-if="menuOption?.meta?.menuIcon" class="menu-item-icon">
      <component :is="menuOption.meta.menuIcon"></component>
    </el-icon>
    <template #title>
      <span>{{ menuOption.meta?.menuName }}</span>
    </template>
  </el-menu-item>
</template>

<script lang="ts" setup>
// import { RouteItem } from '~/app/router.options';
import { RouteRecordRaw } from 'vue-router';
const menuOptionProps = defineProps({
  menuOption: {
    default: () => ({}),
    type: Object as PropType<RouteRecordRaw>,
  },
});
const menuOption = computed(() => menuOptionProps.menuOption);
</script>
<style lang="less" scoped></style>
