<template>
  <div
    class="header h-[50px] min-h-[50px] w-full flex items-center box-border pl-5 pr-5"
  >
    <div
      class="header-left flex items-center cursor-pointer"
      @click="handleClickTitle"
    >
      <h4 class="title">blog-home-nuxt</h4>
    </div>
    <div class="flex-1"></div>
    <header-right
      class="header-right w-[190px] flex items-center justify-between"
    ></header-right>
  </div>
</template>

<script lang="ts" setup>
import HeaderRight from './header-right/index.vue'
const router = useRouter()
const handleClickTitle = () => {
  router.push('/homepage')
}
</script>
<style lang="scss" scoped>
@use '~/assets/styles/theme-util.scss' as theme;

.header {
  z-index: 1;
  @include theme.useTheme {
    background-color: theme.getVar('bgColor');
    // 阴影颜色
    box-shadow: 0 0 10px 0 theme.getVar('shadowColor');
  }
  .title {
    @include theme.useTheme {
      color: theme.getVar('textColor');
    }
  }
}
</style>
