<template>
  <div
    class="header h-[50px] min-h-[50px] w-full flex items-center box-border pl-5 pr-5"
  >
    <div
      class="header-left flex items-center cursor-pointer"
      @click="handleClickTitle"
    >
      <h4 class="app-name">{{ appName }}</h4>
    </div>
    <div class="flex-1 flex items-center justify-center">
      <h4
        class="chart-name cursor-pointer"
        v-if="props.chartName"
        @click="handleClickTitle"
      >
        {{ props.chartName }}
      </h4>
    </div>
    <header-right
      class="header-right w-[190px] flex items-center justify-between"
    ></header-right>
  </div>
</template>

<script lang="ts" setup>
import HeaderRight from './header-right/index.vue'
const appName = process.env.APP_NAME
const props = defineProps({
  chartName: {
    type: String,
    default: ''
  }
})
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .header-left {
    .app-name {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 1px;

      @include theme.useTheme {
        color: theme.getVar('textColor');
      }

      &:hover {
        @include theme.useTheme {
          color: theme.getVar('primaryColor');
        }
        transition: color 0.3s ease;
      }
    }
  }

  .chart-name {
    font-size: 16px;
    font-weight: 500;
    letter-spacing: 0.5px;
    position: relative;
    padding: 0 4px;

    @include theme.useTheme {
      color: theme.getVar('textColor');
    }

    &::after {
      content: '';
      position: absolute;
      bottom: -2px;
      left: 0;
      width: 100%;
      height: 2px;
      background: linear-gradient(
        90deg,
        transparent,
        theme.getVar('primaryColor'),
        transparent
      );
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover::after {
      opacity: 1;
    }

    &:hover {
      @include theme.useTheme {
        color: theme.getVar('primaryColor');
      }
      transition: color 0.3s ease;
    }
  }

  .header-right {
    height: 100%;
  }
}
</style>
