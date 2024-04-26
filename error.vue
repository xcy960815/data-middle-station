<template>
  <!-- 炫酷的错误页面 带扫描效果 -->
  <div class="notfind">
    <div class="noise"></div>
    <div class="overlay"></div>
    <div class="terminal">
      <h1>Error Page</h1>
      <h2>{{ error.message }}</h2>
      <ul class="error-list">
        <li class="error-item">您要查找的页面可能已被删除、名称已更改或暂时不可用。</li>
        <li class="error-item">请返回上一页或首页</li>
        <li class="error-item">good luck.</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps({
  error: {
    type: Object as PropType<{
      url: string;
      statusCode: number;
      statusMessage: string;
      message: string;
      stack: string;
    }>,
    required: true,
    default: () => ({
      url: '',
      statusCode: 404,
      statusMessage: 'Not Found',
      message: 'Not Found',
      stack: '',
    }),
  },
});
const { error } = toRefs(props);

onMounted(()=>{
  // console.log(error.value)
})
</script>

<style scoped lang="scss">
.notfind {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  .noise {
    height: 100%;
    pointer-events: none;
    position: absolute;
    width: 100%;
    background-repeat: no-repeat;
    background-size: cover;
    opacity: 0.02;
    z-index: 1;
  }
  @keyframes scan {
    0% {
      transform: translateY(-100%);
    }
    100% {
      transform: translateY(100%);
    }
  }
  .overlay {
    height: 100%;
    pointer-events: none;
    position: absolute;
    width: 100%;
    background: repeating-linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.3) 50%, transparent);
    background-size: auto;
    background-size: auto 4px;
    z-index: 2;
  }

  .overlay::before {
    animation: scan 5s linear 0s infinite;
    background-image: linear-gradient(
      0deg,
      transparent,
      rgba(32, 128, 32, 0.2) 2%,
      rgba(32, 128, 32, 0.8) 3%,
      rgba(32, 128, 32, 0.2) 0,
      transparent
    );
    background-repeat: no-repeat;
    content: '';
    display: block;
    height: 100%;
    inset: 0;
    pointer-events: none;
    position: absolute;
    width: 100%;
  }
  .terminal {
    background-color: rgb(7, 7, 9);
    font-size: 1.5rem;
    height: 100%;
    max-width: 100%;
    padding: 4rem;
    position: absolute;
    text-transform: uppercase;
    width: 100%;
  }

  .terminal > * {
    color: #80ff80cc;
    text-shadow: 0 0 1px rgba(51, 255, 51, 0.4), 0 0 2px hsla(0, 0%, 100%, 0.8);
  }
  .error-list {
    margin-top: 2rem;
    .error-item {
      margin-bottom: 1rem;
    }
    .error-item::before {
      content: '>';
      margin-right: 0.5rem;
    }
  }
}
</style>
