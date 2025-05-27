<template>
  <NuxtLayout :name="layoutName">
    <canvas id="cvs"></canvas>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
const layoutName = 'welcome'
defineOptions({
  name: 'WelcomePage'
})

const charSet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const fontColors = [
  '#33B5E5',
  '#0099CC',
  '#AA66CC',
  '#9933CC',
  '#99CC00',
  '#669900',
  '#FFBB33',
  '#FF8800',
  '#FF4444',
  '#CC0000'
]
const fontSizeMultiplier = 1
const setIntervalId = ref<number | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
const ctx = ref<CanvasRenderingContext2D | null>(null)
const chars = ref<Char[]>([])

// 创建字符对象
class Char {
  x: number
  y: number
  char: string
  color: string
  fontSize: number
  speed: number

  constructor(canvasWidth: number) {
    this.x = Math.random() * canvasWidth
    this.y = -20
    this.char =
      charSet[Math.floor(Math.random() * charSet.length)]
    this.color =
      fontColors[
        Math.floor(Math.random() * fontColors.length)
      ]
    this.fontSize = 14 * fontSizeMultiplier
    this.speed = 1 + Math.random() * 2
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color
    ctx.font = `${this.fontSize}px monospace`
    ctx.fillText(this.char, this.x, this.y)
  }

  update(canvasWidth: number, canvasHeight: number) {
    this.y += this.speed
    if (this.y > canvasHeight) {
      this.y = -20
      this.x = Math.random() * canvasWidth
      this.char =
        charSet[Math.floor(Math.random() * charSet.length)]
      this.color =
        fontColors[
          Math.floor(Math.random() * fontColors.length)
        ]
    }
  }
}

// 设置canvas尺寸
const setCanvasSize = () => {
  if (!canvas.value) return
  canvas.value.width = window.innerWidth
  canvas.value.height = window.innerHeight
  initChars()
}

// 初始化字符
const initChars = () => {
  if (!canvas.value) return
  chars.value = []
  const charCount = Math.floor(canvas.value.width / 20)
  for (let i = 0; i < charCount; i++) {
    chars.value.push(new Char(canvas.value.width))
  }
}

// 动画循环
const animate = () => {
  if (!canvas.value || !ctx.value) return

  ctx.value.fillStyle = 'rgba(0, 0, 0, 0.05)'
  ctx.value.fillRect(
    0,
    0,
    canvas.value.width,
    canvas.value.height
  )

  chars.value.forEach((char) => {
    char.draw(ctx.value!)
    char.update(canvas.value!.width, canvas.value!.height)
  })

  setIntervalId.value = requestAnimationFrame(animate)
}

// 清理函数
onUnmounted(() => {
  if (setIntervalId.value) {
    cancelAnimationFrame(setIntervalId.value)
  }
  if (process.client) {
    window.removeEventListener('resize', setCanvasSize)
  }
})

onMounted(() => {
  if (process.client) {
    canvas.value = document.getElementById(
      'cvs'
    ) as HTMLCanvasElement
    ctx.value = canvas.value.getContext('2d')

    if (canvas.value && ctx.value) {
      setCanvasSize()
      window.addEventListener('resize', setCanvasSize)
      animate()
    }
  }
})
</script>

<style scoped lang="scss">
#cvs {
  width: 100%;
  height: 100%;
  background-color: #000;
}
</style>
