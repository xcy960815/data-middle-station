<template>
  <canvas id="cvs"></canvas>
</template>

<script lang="ts" setup>
import { initData } from './init-data'
import { handler } from './handler'
const { charSet, fontColors, fontSizeMultiplier } =
  initData()
handler({ charSet, fontColors, fontSizeMultiplier })
</script>

<style scoped lang="less">
#cvs {
  width: 100%;
  height: 100%;
  background-color: #000;
}
</style>
