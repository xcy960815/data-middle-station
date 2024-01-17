<template>
  <!-- 主入口页面 -->
  <canvas id="cvs"></canvas>
</template>

<script lang="ts" setup>
import { initData } from './init-data'
import { handler } from './handler'
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
