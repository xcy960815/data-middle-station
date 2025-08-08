<template>
  <ClientOnly>
    <div class="user-info">
      <slot name="header-right"></slot>
      <!-- 全屏退出全屏 -->
      <el-tooltip effect="dark" :content="fullscreen ? `退出全屏` : `全屏`" placement="bottom">
        <span @click="handleFullscreen" class="tooltip-sapn fullscreen-tooltip">
          <icon-park size="30" v-if="!fullscreen" type="FullScreen" fill="#333"></icon-park>
          <icon-park size="30" v-if="fullscreen" type="OffScreen" fill="#333"></icon-park>
        </span>
      </el-tooltip>
      <!-- 主题 -->
      <el-tooltip effect="dark" content="设置主题" placement="bottom">
        <el-select v-model="theme" style="width: 75px" class="mr-2">
          <el-option label="高亮" value="light"></el-option>
          <el-option label="暗黑" value="dark"></el-option>
          <el-option label="自动" value="auto"></el-option>
        </el-select>
      </el-tooltip>
      <!-- 用户信息 -->
      <el-dropdown size="large" @command="dropDownClick">
        <el-avatar :size="30" :src="userInfo.avatar" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>{{ userInfo.name }}</el-dropdown-item>
            <el-dropdown-item v-if="!userInfo.name" command="login" class="logout"> 登 录 </el-dropdown-item>
            <el-dropdown-item v-if="userInfo.name" command="logout" class="logout"> 登 出 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </ClientOnly>
</template>
<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElDropdown, ElDropdownMenu, ElDropdownItem, ElAvatar, ElTooltip, ElSelect, ElOption } from 'element-plus'

type Theme = 'light' | 'dark' | 'auto'
/**
 * @desc 主题选项
 */
const themeOptions = ['light', 'dark', 'auto']

/**
 * @Desc 监听系统主题变化
 */
const mediaQuery = ref<MediaQueryList | undefined>()

const userStore = useUserStore()

const THEME_KEY = '__theme__'

const theme = ref<Theme>('light')

/**
 * @desc 用户信息
 */
const userInfo = computed(() => userStore.userInfo)
/**
 * @desc 获取用户信息
 */
const getUserInfo = async () => {
  const userInfoResult = await $fetch('/api/userInfo')
  if (userInfoResult.code === RequestCodeEnum.Success) {
    const { userId, userName, avatar } = userInfoResult.data as UserInfoVo.UserInfo
    userStore.setUserId(userId)
    userStore.setName(userName)
    userStore.setAvatar(avatar)
  }
}

/**
 * @desc 全屏状态
 */
const fullscreen = ref<boolean>(false)

onMounted(() => {
  // 在非Mounted 中找不到 localStorage 所以在这里初始化
  theme.value = (localStorage.getItem(THEME_KEY) as Theme) || 'light'

  // 在非Mounted 中找不到 matchMedia 所以在这里初始化
  mediaQuery.value = matchMedia('(prefers-color-scheme: dark)')

  getUserInfo()
})
/**
 * @desc 展开全屏和关闭全屏
 */
const handleFullscreen = async function () {
  const element: HTMLElement = document.documentElement
  if (fullscreen.value) {
    if (document.exitFullscreen) {
      /* 通用方法 */
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen()
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen()
    } else if (document.msExitFullscreen) {
      /* IE11 */
      await document.msExitFullscreen()
    }
  } else {
    if (element.requestFullscreen) {
      element.requestFullscreen()
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen()
    } else if (element.mozRequestFullscreen) {
      element.mozRequestFullscreen()
    } else if (element.msRequestFullscreen) {
      // IE11
      element.msRequestFullscreen()
    }
  }
  fullscreen.value = !fullscreen.value
}

/**
 * @desc 监听全屏状态变化
 * @returns void
 */
const handleWathFullscreen = function () {
  // 全局（document）上监听全屏状态变化
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) {
      fullscreen.value = true
    } else {
      fullscreen.value = false
    }
  })
  // 对于一些特定的浏览器你需要添加带有前缀的事件监听器
  //Firefox
  document.addEventListener('mozfullscreenchange', function () {
    if (document.mozFullScreenElement) {
      fullscreen.value = true
    } else {
      fullscreen.value = false
    }
  })

  // Chrome, Safari and Opera
  document.addEventListener('webkitfullscreenchange', function () {
    if (document.webkitFullscreenElement) {
      fullscreen.value = true
    } else {
      fullscreen.value = false
    }
  })

  //Microsoft Internet Explorer
  document.addEventListener('MSFullscreenChange', function () {
    if (document.webkitFullscreenElement) {
      fullscreen.value = true
    } else {
      fullscreen.value = false
    }
  })
}

// 登录登出
const dropDownClick = (cmd: 'logout' | 'login'): void => {
  if (cmd === 'logout') {
    console.log('logout')
  } else if (cmd === 'login') {
    console.log('login')
  }
}

/**
 * @desc 设置主题
 * @param {Theme} theme
 */
const setTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem(THEME_KEY, theme)
}

/**
 * @desc 根据系统主题切换
 */
const fllowSystemTheme = () => {
  const theme = mediaQuery.value?.matches ? 'dark' : 'light'
  // document.documentElement.className = theme;
  setTheme(theme)
}

/**
 * @desc 监听主题变化
 */
watch(
  () => theme.value,
  () => {
    if (process.client) {
      // localStorage.setItem(THEME_KEY, theme.value);
      if (theme.value === 'auto') {
        fllowSystemTheme()
        // 根据系统主题切换
        mediaQuery.value?.addEventListener('change', fllowSystemTheme)
      } else {
        // 给html标签添加class
        // document.documentElement.className = theme.value;
        setTheme(theme.value)
        // 移除监听
        mediaQuery.value?.removeEventListener('change', fllowSystemTheme)
      }
    }
  }
)

onMounted(() => {
  handleWathFullscreen()
  fllowSystemTheme()
})
</script>
<style lang="scss" scoped>
@use '~/assets/styles/theme-util.scss' as *;

.user-info {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;

  .icon-enlarge,
  .icon-narrow {
    font-size: 24px;
    color: #fff;
  }

  .icon-pinch-zoom-out-sharp,
  .icon-pinch-zoom-in-sharp {
    @include useTheme {
      color: getVar('textColor');
    }
  }

  .tooltip-sapn {
    cursor: pointer;
    margin-right: 20px;
  }
}
</style>
