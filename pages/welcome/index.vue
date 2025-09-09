<template>
  <NuxtLayout :name="layoutName">
    <canvas ref="canvasRef" id="cvs"></canvas>
    <div class="welcome-content">
      <h1 class="title">数据分析平台</h1>
      <div class="start-button">
        <button @click="navigateToHome">开始使用</button>
      </div>
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RequestCodeEnum } from '~/utils/request-enmu'

/**
 * 字符配置接口，定义了字符动画所需的所有配置参数
 */
interface CharConfig {
  readonly CHAR_SET: string
  readonly FONT_COLORS: readonly string[]
  readonly FONT_SIZE_MULTIPLIER: number
  readonly CHAR_DENSITY: number
  readonly FADE_SPEED: number
}

/**
 * 表示动画中的单个字符
 */
class Char {
  /**
   * 创建字符实例
   * @param x 字符的X坐标
   * @param y 字符的Y坐标，默认为-20
   * @param char 显示的字符，默认随机生成
   * @param color 字符颜色，默认随机生成
   * @param fontSize 字体大小，默认为14 * 缩放因子
   * @param speed 下落速度，默认为1-3之间的随机值
   */
  constructor(
    private x: number,
    private y: number = -20,
    private char: string = getRandomChar(),
    private color: string = getRandomColor(),
    private fontSize: number = 14 * CONFIG.FONT_SIZE_MULTIPLIER,
    private speed: number = 1 + Math.random() * 2
  ) {}

  /**
   * 在画布上绘制字符
   * @param ctx Canvas 2D渲染上下文
   */
  draw(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color
    ctx.font = `${this.fontSize}px monospace`
    ctx.fillText(this.char, this.x, this.y)
  }

  /**
   * 更新字符位置
   * @param canvasWidth 画布宽度
   * @param canvasHeight 画布高度
   */
  update(canvasWidth: number, canvasHeight: number): void {
    this.y += this.speed
    if (this.y > canvasHeight) {
      this.reset(canvasWidth)
    }
  }

  /**
   * 设置字符位置
   * @param x 新的X坐标
   * @param y 新的Y坐标
   */
  setPosition(x: number, y: number): void {
    this.x = x
    this.y = y
  }

  /**
   * 获取字符当前位置
   * @returns 字符的当前坐标
   */
  getPosition(): { x: number; y: number } {
    return { x: this.x, y: this.y }
  }

  /**
   * 重置字符状态
   * @param canvasWidth 画布宽度
   * @private
   */
  private reset(canvasWidth: number): void {
    this.y = -20
    this.x = Math.random() * canvasWidth
    this.char = getRandomChar()
    this.color = getRandomColor()
  }
}

const CONFIG: CharConfig = {
  CHAR_SET: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
  FONT_COLORS: [
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
  ],
  FONT_SIZE_MULTIPLIER: 1,
  CHAR_DENSITY: 20,
  FADE_SPEED: 0.05
} as const

/**
 * 从字符集中随机获取一个字符
 * @returns 随机字符
 */
function getRandomChar(): string {
  return CONFIG.CHAR_SET[Math.floor(Math.random() * CONFIG.CHAR_SET.length)]
}

/**
 * 从颜色集中随机获取一个颜色
 * @returns 随机颜色代码
 */
function getRandomColor(): string {
  return CONFIG.FONT_COLORS[Math.floor(Math.random() * CONFIG.FONT_COLORS.length)]
}

/**
 * @desc 路由
 */
const router = useRouter()

/**
 * @desc 布局名称
 */
const layoutName = 'welcome'

/**
 * @desc 定义组件名称
 */
defineOptions({ name: 'WelcomePage' })

/**
 * @desc 画布引用
 */
const canvasRef = ref<HTMLCanvasElement | null>(null)
const animationFrameId = ref<number | null>(null)

/**
 * @desc 字符数组
 */
const chars = ref<Char[]>([])

/**
 * 创建指定数量的字符实例
 * @param width 画布宽度
 * @param count 需要创建的字符数量
 * @returns 字符实例数组
 */
function createChars(width: number, count: number): Char[] {
  return Array.from({ length: count }, () => new Char(Math.random() * width))
}

/**
 * 调整画布大小并重新计算字符位置
 * 在窗口大小改变时调用，保持动画连续性
 */
const setCanvasSize = () => {
  const canvas = canvasRef.value
  if (!canvas) return

  const oldWidth = canvas.width
  const oldHeight = canvas.height
  const widthRatio = window.innerWidth / oldWidth
  const heightRatio = window.innerHeight / oldHeight

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight

  chars.value.forEach((char) => {
    const pos = char.getPosition()
    char.setPosition(pos.x * widthRatio, pos.y * heightRatio)
  })

  const targetCharCount = Math.floor(canvas.width / CONFIG.CHAR_DENSITY)
  if (targetCharCount > chars.value.length) {
    chars.value.push(...createChars(canvas.width, targetCharCount - chars.value.length))
  } else if (targetCharCount < chars.value.length) {
    chars.value.splice(targetCharCount)
  }
}

/**
 * 动画循环函数
 * 负责清除画布、更新和绘制所有字符
 */
const animate = () => {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!canvas || !ctx) return

  ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.FADE_SPEED})`
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  chars.value.forEach((char) => {
    char.draw(ctx)
    char.update(canvas.width, canvas.height)
  })

  animationFrameId.value = requestAnimationFrame(animate)
}

/**
 * 组件挂载时的初始化函数
 * 设置画布尺寸、创建初始字符并启动动画
 */
onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return

  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  chars.value = createChars(canvas.width, Math.floor(canvas.width / CONFIG.CHAR_DENSITY))

  window.addEventListener('resize', setCanvasSize)
  animate()
})

/**
 * 组件卸载时的清理函数
 * 取消动画帧和移除事件监听器
 */
onUnmounted(() => {
  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
  }
  window.removeEventListener('resize', setCanvasSize)
})

const userStore = useUserStore()

/**
 * 导航到主页的处理函数
 */
const navigateToHome = async () => {
  try {
    const loginResult = await $fetch('/api/login', {
      method: 'POST',
      body: {
        userName: 'admin',
        password: '123456'
      }
    })

    // 根据你的 API 返回结构处理
    if (loginResult?.code === RequestCodeEnum.Success) {
      router.push('/homepage')
    } else {
      console.error('登录失败:', loginResult?.message)
    }
  } catch (error) {
    console.error('登录请求失败:', error)
  }
}
</script>

<style scoped lang="scss">
#cvs {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #000;
}

.welcome-content {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  text-align: center;
  user-select: none;

  .title {
    font-size: clamp(32px, 5vw, 48px);
    color: #fff;
    margin-bottom: 40px;
    text-shadow: 0 0 10px rgba(51, 181, 229, 0.5);
    background: linear-gradient(45deg, #33b5e5, #aa66cc);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
  }
}

.start-button {
  button {
    padding: clamp(10px, 2vw, 15px) clamp(30px, 4vw, 40px);
    font-size: clamp(16px, 2vw, 20px);
    color: #fff;
    background: linear-gradient(45deg, #33b5e5, #aa66cc);
    border: none;
    border-radius: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      background: linear-gradient(45deg, #0099cc, #9933cc);
    }

    &:active {
      transform: translateY(1px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
    }

    &:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(51, 181, 229, 0.3);
    }
  }
}
</style>
