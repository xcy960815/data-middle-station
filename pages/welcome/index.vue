<template>
   <NuxtLayout :name="layoutName">
    <!-- 欢迎页面 -->
  <canvas id="cvs"></canvas>
  </NuxtLayout>
  
</template>

<script lang="ts" setup>
import { initData } from './init-data'
import { handler } from './handler'
const layoutName = 'welcome'
const { charSet, fontColors, fontSizeMultiplier, setIntervalId } = initData()
handler({ charSet, fontColors, fontSizeMultiplier, setIntervalId })
</script>

<style scoped lang="less">
#cvs {
  width: 100%;
  height: 100%;
  background-color: #000;
}
</style>
