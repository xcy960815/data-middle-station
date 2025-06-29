<template>
  <NuxtLayout>
    <div
      class="eventsource-container"
      ref="eventsourceBox"
    ></div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
const eventsourceBox = ref<HTMLElement | null>(null)
onMounted(() => {
  const eventSource = new EventSource('/api/eventsource')

  //对于建立链接的监听
  eventSource.onopen = function (event) {
    console.log('长连接打开', eventSource.readyState)
  }

  //对服务端消息的监听
  eventSource.onmessage = function (
    event: MessageEvent<string>
  ) {
    const timeNode = document.createElement('div')
    timeNode.innerText = JSON.parse(event.data)
    eventsourceBox.value?.append(timeNode)
  }

  //对断开链接的监听
  eventSource.onerror = function (event) {
    console.log('长连接中断', eventSource.readyState)
  }
})
</script>
<style lang="scss" scoped>
.eventsource-container {
  width: 100%;
  height: 100%;
}
</style>
