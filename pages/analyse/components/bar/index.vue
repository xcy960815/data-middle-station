<template>
  <div class="bar relative flex pr-[10px]">
    <el-button link @click="handleClickRefresh">
      刷新
    </el-button>
    <el-checkbox label="查询条件变化时自动刷新" />
    <el-button class="ml-auto" link>分析</el-button>
    <el-button link @click="handleClickAlarm">报警</el-button>
    <el-button link @click="handleClickSetting">设置</el-button>
    <el-button link @click="handleClickFullScreen">全屏</el-button>
    <el-button link @click="handleClickDownload">下载</el-button>
    <el-button link @click="handleClickSave">保存</el-button>
    <!-- <el-tag v-show="chartUpdateTakesTime" size="small" class="pr-[10px]" type="info">更新耗时 ：{{ chartUpdateTakesTime }}</el-tag> -->
    <el-tag v-show="chartUpdateTime" size="small" class="pr-[10px]" type="info">更新时间 ：{{ chartUpdateTime }}</el-tag>
  </div>
</template>

<script setup lang="ts">
import { initData } from "./init-data"
import { handler } from './handler'
const {
  chartUpdateTakesTime,
  chartUpdateTime,
} = initData()
const {
  handleClickRefresh,
  handleClickAlarm,
  handleClickSetting,
  handleClickFullScreen,
  handleClickDownload,
  handleClickSave
} = handler()
</script>

<style lang="less" scoped>
.bar {
  display: flex;
  align-items: center;
}
</style>
