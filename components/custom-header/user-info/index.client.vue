<template>
  <ClientOnly>
    <div class="user-info">
      <!-- 全屏退出全屏 -->
      <el-tooltip effect="dark" :content="fullscreen ? `退出全屏` : `全屏`" placement="bottom">
        <span @click="handleFullscreen" class="tooltip-sapn fullscreen-tooltip">
          <Icon v-if="!fullscreen" icon="material-symbols:pinch-zoom-out-sharp" color="white" width="30" height="30"
            :rotate="2" :horizontalFlip="true" :verticalFlip="true" />
          <Icon v-if="fullscreen" icon="material-symbols:pinch-zoom-in-sharp" color="white" width="30" height="30"
            :rotate="2" :horizontalFlip="true" :verticalFlip="true" />
        </span>
      </el-tooltip>
      <!-- 主题 -->
      <el-tooltip effect="dark" content="主题" placement="bottom">
        <span class="tooltip-sapn">
          <Icon icon="carbon:theme" color="white" width="30" height="30" />
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
import { initData } from "./init-data"
import { handler } from "./handler"

const { THEME_KEY, fullscreen, userInfo, theme } = initData()

const { handleFullscreen, dropDownClick } = handler({ fullscreen, theme, THEME_KEY })

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
