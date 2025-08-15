<template>
  <NuxtLayout>
    <div class="web-worker-container">
      <div class="animated-node"></div>
      <div style="margin-top: 200px">0到1000000000 的总和 {{ useWebworkerCount }}</div>
      <el-button type="primary" @click="notUseWebworkerComputeCount">
        不使用webworker计算 0到1000000000 的总和
      </el-button>
      <el-button type="primary" @click="useWebworkerComputeCount"> 使用webworker计算 0到1000000000 的总和 </el-button>
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
const useWebworkerCount = ref(0)
const { $createWorker } = useNuxtApp()

/**
 * 使用webworker计算 0到1000000000 的总和
 * @returns {void}
 */
const useWebworkerComputeCount = async () => {
  useWebworkerCount.value = 0
  const actions = [
    {
      message: 'computeCount',
      callback: () => {
        let sum = 0
        for (let i = 1; i <= 1000000000; i++) {
          sum += i
        }
        return sum
      }
    }
  ]

  const webworker = $createWorker(actions)
  const result = await webworker.postMessageAll<number>({
    messages: ['computeCount']
  })

  useWebworkerCount.value = result[0]?.data || 0
}
/**
 * 不使用webworker计算 0到1000000000 的总和
 * @returns {void}
 */
const notUseWebworkerComputeCount = () => {
  useWebworkerCount.value = 0
  let sum = 0
  for (let i = 1; i <= 1000000000; i++) {
    sum += i
  }
  useWebworkerCount.value = sum
}
</script>

<style scoped lang="scss">
@keyframes animatedNodeKeyframe {
  0% {
    background-color: red;
    left: 0px;
    top: 0px;
    transform: rotate(0deg);
  }

  25% {
    background-color: yellow;
    left: 200px;
    top: 0px;
    transform: rotate(90deg);
  }

  50% {
    background-color: blue;
    left: 200px;
    top: 200px;
    transform: rotate(180deg);
  }

  75% {
    background-color: green;
    left: 0px;
    top: 200px;
    transform: rotate(270deg);
  }

  100% {
    background-color: red;
    left: 0px;
    top: 0px;
    transform: rotate(360deg);
  }
}

.web-worker-container {
  position: relative;

  .animated-node {
    width: 100px;
    height: 100px;
    position: relative;
    background-color: red;
    animation-name: animatedNodeKeyframe;
    animation-duration: 4s;
    animation-iteration-count: infinite;
  }
}
</style>
