<template>
  <div class="header h-[50px] min-h-[50px] w-full flex items-center box-border pl-5 pr-5">
    <div class="header-left flex items-center cursor-pointer" @click="handleClickAppName">
      <h4 class="app-name">{{ appName }}</h4>
    </div>
    <div v-if="$slots.title" class="header-title flex-1 flex items-center justify-center">
      <slot name="title"></slot>
    </div>
    <nav v-else-if="$slots.nav" class="header-nav">
      <slot name="nav">
        <NuxtLink
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="header-nav__item"
          :class="{ 'is-active': isActive(item.key) }"
        >
          <icon-park :type="item.icon" size="18" :fill="isActive(item.key) ? '#409eff' : 'currentColor'" />
          {{ item.label }}
        </NuxtLink>
      </slot>
    </nav>
    <div v-else class="flex-1"></div>
    <header-right class="header-right w-[190px] flex items-center justify-between">
      <template #header-right>
        <slot name="header-right"></slot>
      </template>
    </header-right>
  </div>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import HeaderRight from './header-right/index.vue'
const appName = useRuntimeConfig().public.appName
const route = useRoute()
const router = useRouter()

const appNameTargetPath = computed(() => {
  if (route.path.startsWith('/data-source') || route.path.startsWith('/dataset')) {
    return '/dataset'
  }

  if (route.path.startsWith('/dashboard')) {
    return '/dashboard'
  }

  return '/analyze'
})

const handleClickAppName = () => {
  router.push(appNameTargetPath.value)
}

const navItems = [
  { key: 'analyze', label: '分析', path: '/analyze', icon: 'Data' },
  { key: 'dashboard', label: '看板', path: '/dashboard', icon: 'Dashboard' }
]

const isActive = (key: string) => {
  return route.path.startsWith(`/${key}`)
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

  .header-nav {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .header-nav__item {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 18px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;

    @include theme.useTheme {
      color: theme.getVar('textColor');
    }

    &:hover {
      @include theme.useTheme {
        color: theme.getVar('primaryColor');
        background-color: rgba(64, 158, 255, 0.08);
      }
    }

    &.is-active {
      color: theme.getVar('primaryColor');
      background-color: rgba(64, 158, 255, 0.12);
      font-weight: 600;
    }
  }

  .header-right {
    height: 100%;
  }
}
</style>
