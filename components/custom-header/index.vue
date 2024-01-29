<template>
  <div class="header h-[50px] min-h-[50px] w-full flex items-center box-border shadow-md pl-5 pr-5">
    <div class="header-left flex items-center cursor-pointer" @click="handleClickTitle">
      <h4 class="title">blog-home-nuxt</h4>
    </div>
    <div class="flex-1"></div>
    <header-right class="header-right w-[190px] flex items-center justify-between"></header-right>
  </div>
</template>

<script lang="ts" setup>
import HeaderRight from './header-right/index.vue';
const router = useRouter();
const handleClickTitle = () => {
  router.push('/homepage');
};

</script>
<style lang="scss" scoped>
.header {
  @include useTheme {
    background-color: getVar('bgColor');
  }

  .title {
    @include useTheme {
      color: getVar('textColor');
    }
  }
}
</style>
