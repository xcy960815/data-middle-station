<template>
  <el-menu
    :default-active="defaultActive"
    text-color="rgba(255,255,255,.65)"
    background-color="#001529"
    class="layout-menu"
    :collapse-transition="false"
    active-text-color="#fff"
    :collapse="isCollapse"
    router
  >
    <menu-item
      v-for="menuOption in menuOptions"
      :menu-option="menuOption"
      :key="menuOption.path"
    ></menu-item>
  </el-menu>
</template>

<script lang="ts" setup>
import MenuItem from './menu-item.vue';
import { RouteRecordRaw } from 'vue-router';
// import { RouteItem } from '~/app/router.options';
const { proxy } = getCurrentInstance()!;
const { currentRoute, getRoutes } = useRouter();
const isCollapseProps = defineProps({
  isCollapse: {
    default: () => false,
    type: Boolean,
  },
});
const isCollapse = computed({
  get: () => {
    return isCollapseProps.isCollapse;
  },
  set: (val) => {
    proxy?.$emit('update:collapse', val);
  },
});

// 当前高亮的路由
const defaultActive = computed<string>(() => {
  const currentRouteValue = currentRoute.value;
  if (currentRouteValue?.meta?.highLightActive) {
    return currentRoute.value.meta.highLightActive as string;
  }
  return currentRoute.value.path;
});

const filterRoute = (route: RouteRecordRaw) => {
  return route.meta?.showInLeftMenu === undefined || route.meta?.showInLeftMenu;
};

// 过滤出菜单项
const menuOptions = computed(() => {
  const routes = getRoutes();

  // 过滤出有子路由的路由
  const hasChildRotes = routes.splice(3);
  // 过滤左侧菜单栏
  const filterRoutes = (list: Array<RouteRecordRaw>) => {
    return list.filter((route) => {
      // 查看当前路由是否有权限
      const hasPermission = filterRoute(route);
      if (hasPermission && route.children && route.children.length > 0) {
        route.children = filterRoutes(route.children);
      }
      return hasPermission;
    });
  };

  return filterRoutes(hasChildRotes);
});
onMounted(() => {
  // console.log('getRoutes', menuOptions.value);
  // const routes = getRoutes();
  // console.log("routes", routes);
});
</script>
<style lang="less" scoped>
.layout-menu {
  position: relative;
  height: 100%;
  border: none;
  transition: all 0.4s ease 0s;

  :deep(.el-menu-item.is-active) {
    background: #1890ff !important;
  }
}
</style>
