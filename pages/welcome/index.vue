<template>
  <NuxtLayout name="welcome">
    <canvas id="cvs"></canvas>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { initData } from './init-data'
import { handler } from './handler'

defineOptions({
  name: 'WelcomePage'
})

const {
  charSet,
  fontColors,
  fontSizeMultiplier,
  setIntervalId
} = initData()
handler({
  charSet,
  fontColors,
  fontSizeMultiplier,
  setIntervalId
})
</script>

<style scoped lang="scss">
#cvs {
  width: 100%;
  height: 100%;
  background-color: #000;
}
</style>
