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
            <el-dropdown-item>{{ userInfo.userName }}</el-dropdown-item>
            <el-dropdown-item v-if="!userInfo.userName" command="login" class="logout"> 登 录 </el-dropdown-item>
            <el-dropdown-item v-if="userInfo.userName" command="logout" class="logout"> 登 出 </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </ClientOnly>
</template>
<script lang="ts" setup>
import { httpRequest } from '@/composables/useHttpRequest'
import { RequestCodeEnum } from '@/utils/request-enmu'
import {
  ElAvatar,
  ElDropdown,
  ElDropdownItem,
  ElDropdownMenu,
  ElMessage,
  ElOption,
  ElSelect,
  ElTooltip
} from 'element-plus'

type Theme = 'light' | 'dark' | 'auto'

/**
 * @Desc 监听系统主题变化
 */
const mediaQuery = ref<MediaQueryList | undefined>()

const userStore = useUserStore()

const THEME_KEY = '__theme__'

const theme = ref<Theme>('light')
const themeValues: Theme[] = ['light', 'dark', 'auto']

/**
 * @desc 用户信息
 */
const userInfo = computed(() => userStore.userInfo)
/**
 * @desc 获取用户信息
 */
const getUserInfo = async () => {
  const userInfoResult = await httpRequest('/api/userInfo')
  if (userInfoResult.code === RequestCodeEnum.Success) {
    const { userId, userName, avatar } = userInfoResult.data!
    userStore.setUserId(userId)
    userStore.setUserName(userName)
    userStore.setAvatar(avatar)
  }
}

/**
 * @desc 全屏状态
 */
const fullscreen = ref<boolean>(false)

onMounted(() => {
  // 在非Mounted 中找不到 localStorage 所以在这里初始化
  const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
  theme.value = savedTheme && themeValues.includes(savedTheme) ? savedTheme : 'light'

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
const dropDownClick = async (cmd: 'logout' | 'login'): Promise<void> => {
  if (cmd === 'logout') {
    await handleLogout()
  } else if (cmd === 'login') {
    await navigateTo('/welcome')
  }
}

const handleLogout = async () => {
  try {
    const logoutResult = await httpRequest<ApiResponseI<{ success: boolean }>>('/api/logout', {
      method: 'POST'
    })
    if (logoutResult.code !== RequestCodeEnum.Success) {
      ElMessage.error(logoutResult.message || '退出登录失败')
      return
    }
  } finally {
    userStore.clearUserInfo()
    await navigateTo('/welcome', { replace: true })
  }
}

/**
 * @desc 应用最终主题
 * @param {Exclude<Theme, 'auto'>} theme
 */
const applyTheme = (theme: Exclude<Theme, 'auto'>) => {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

/**
 * @desc 保存用户选择并应用主题
 * @param {Theme} theme
 */
const setTheme = (theme: Theme) => {
  localStorage.setItem(THEME_KEY, theme)
  if (theme === 'auto') {
    fllowSystemTheme()
  } else {
    applyTheme(theme)
  }
}

/**
 * @desc 根据系统主题切换
 */
const fllowSystemTheme = () => {
  const theme = mediaQuery.value?.matches ? 'dark' : 'light'
  // document.documentElement.className = theme;
  applyTheme(theme)
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
  if (theme.value === 'auto') {
    fllowSystemTheme()
    mediaQuery.value?.addEventListener('change', fllowSystemTheme)
  } else {
    setTheme(theme.value)
  }
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
