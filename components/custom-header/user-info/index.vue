<template>
  <ClientOnly>
    <div class="user-info">
      <!-- 全屏退出全屏 -->
      <el-tooltip effect="dark" :content="fullscreen ? `退出全屏` : `全屏`" placement="bottom">
        <span @click="handleFullscreen" class="tooltip-sapn fullscreen-tooltip">
          <Icon
            v-if="!fullscreen"
            icon="material-symbols:pinch-zoom-out-sharp"
            color="white"
            width="30"
            height="30"
            :rotate="2"
            :horizontalFlip="true"
            :verticalFlip="true"
          />
          <Icon
            v-if="fullscreen"
            icon="material-symbols:pinch-zoom-in-sharp"
            color="white"
            width="30"
            height="30"
            :rotate="2"
            :horizontalFlip="true"
            :verticalFlip="true"
          />
        </span>
      </el-tooltip>
      <!-- 用户信息 -->
      <el-dropdown size="large" @command="dropDownClick">
        <el-avatar :size="30" :src="userInfo.avatar" />
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item>{{ userInfo.name }}</el-dropdown-item>
            <el-dropdown-item v-if="!userInfo.name" command="login" class="logout">
              登 录
            </el-dropdown-item>
            <el-dropdown-item v-if="userInfo.name" command="logout" class="logout">
              登 出
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </ClientOnly>
</template>
<script lang="ts" setup>
const userStore = useUserStore();
// 用户昵称
const userInfo = computed(() => {
  return userStore.userInfo;
});

// 全屏状态 默认为false
const fullscreen = ref<Boolean>(false);

/**
 * @desc 展开全屏和关闭全屏
 */
const handleFullscreen = async function () {
  const element: HTMLElement = document.documentElement;
  if (fullscreen.value) {
    if (document.exitFullscreen) {
      /* 通用方法 */
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      await document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      await document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      await document.msExitFullscreen();
    }
  } else {
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullscreen) {
      element.mozRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      // IE11
      element.msRequestFullscreen();
    }
  }
  fullscreen.value = !fullscreen.value;
};
/**
 * @desc 监听全屏状态变化
 * @returns void
 */
const handleWathFullscreen = function () {
  // 全局（document）上监听全屏状态变化
  document.addEventListener('fullscreenchange', function () {
    if (document.fullscreenElement) {
      fullscreen.value = true;
    } else {
      fullscreen.value = false;
    }
  });
  // 对于一些特定的浏览器你需要添加带有前缀的事件监听器
  //Firefox
  document.addEventListener('mozfullscreenchange', function () {
    if (document.mozFullScreenElement) {
      fullscreen.value = true;
    } else {
      fullscreen.value = false;
    }
  });

  //Chrome, Safari and Opera
  document.addEventListener('webkitfullscreenchange', function () {
    if (document.webkitFullscreenElement) {
      fullscreen.value = true;
    } else {
      fullscreen.value = false;
    }
  });

  //Microsoft Internet Explorer
  document.addEventListener('MSFullscreenChange', function () {
    if (document.webkitFullscreenElement) {
      fullscreen.value = true;
    } else {
      fullscreen.value = false;
    }
  });
};

// 登录登出
const dropDownClick = (cmd: 'logout' | 'login'): void => {
  if (cmd === 'logout') {
    console.log('logout');
  } else if (cmd === 'login') {
    console.log('login');
  }
};

onMounted(() => {
  handleWathFullscreen();
});
</script>
<style lang="less" scoped>
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
  .tooltip-sapn {
    cursor: pointer;
    margin-right: 20px;
  }
}
</style>
