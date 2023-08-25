<template>
  <div class="bar relative flex pr-[10px]">
    <el-button link @click="handleClickRefresh"
      >刷新
    </el-button>
    <el-checkbox label="查询条件变化时自动刷新" />
    <el-button class="ml-auto" link>分析</el-button>
    <el-button link @click="handleClickAlarm"
      >报警</el-button
    >
    <el-button link @click="handleClickSetting"
      >设置</el-button
    >
    <el-button link @click="handleClickFullScreen"
      >全屏</el-button
    >
    <el-button link @click="handleClickDownload"
      >下载</el-button
    >
  </div>
</template>

<script setup lang="ts">
import { handler } from './handler'
const {
  handleClickRefresh,
  handleClickAlarm,
  handleClickSetting,
  handleClickFullScreen,
  handleClickDownload
} = handler()
</script>

<style lang="less" scoped></style>
