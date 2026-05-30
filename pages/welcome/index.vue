<template>
  <NuxtLayout :name="layoutName">
    <canvas ref="canvasRef" id="cvs"></canvas>
    <div class="welcome-content">
      <h1 class="title">数据分析平台</h1>
      <form class="login-panel" @submit.prevent="handleLogin">
        <div class="login-panel__scanline"></div>
        <label class="login-field">
          <span>USER</span>
          <input v-model.trim="loginForm.userName" autocomplete="username" placeholder="admin" />
        </label>
        <label class="login-field">
          <span>PASS</span>
          <input v-model="loginForm.password" autocomplete="current-password" placeholder="123456" type="password" />
        </label>
        <p class="login-error" :class="{ 'login-error--visible': loginError }">{{ loginError || 'placeholder' }}</p>
        <button class="login-button" type="submit" :disabled="loginLoading">
          {{ loginLoading ? '验证中...' : '进入中台' }}
        </button>
      </form>
    </div>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { onMounted, onUnmounted, ref } from 'vue'
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
 * 字符配置常量 - 必须在类定义之前初始化
 */
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
const loginLoading = ref(false)
const loginError = ref('')
const loginForm = reactive<LoginDto.LoginRequest>({
  userName: '',
  password: ''
})

/**
 * 登录并导航到主页
 */
const handleLogin = async () => {
  if (loginLoading.value) return

  if (!loginForm.userName || !loginForm.password) {
    loginError.value = '请输入账号和密码'
    return
  }

  loginLoading.value = true
  loginError.value = ''
  try {
    const loginResult = await $fetch<ApiResponseI<LoginVo.LoginResponse>>('/api/login', {
      method: 'POST',
      body: {
        userName: loginForm.userName,
        password: loginForm.password
      }
    })

    if (loginResult?.code === RequestCodeEnum.Success && loginResult.data) {
      userStore.setUserId(loginResult.data.userId)
      userStore.setUserName(loginResult.data.userName)
      await navigateTo('/homepage')
      return
    }

    loginError.value = loginResult?.message || '登录失败，请检查账号密码'
  } catch (error) {
    loginError.value = error instanceof Error ? error.message : '登录失败，请稍后重试'
    ElMessage.error(loginError.value)
  } finally {
    loginLoading.value = false
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
  width: min(420px, calc(100vw - 40px));

  .title {
    font-size: clamp(32px, 5vw, 48px);
    color: #fff;
    margin-bottom: 28px;
    text-shadow: 0 0 10px rgba(51, 181, 229, 0.5);
    background: linear-gradient(45deg, #33b5e5, #aa66cc);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: bold;
  }
}

.login-panel {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  overflow: hidden;
  background: linear-gradient(135deg, rgba(51, 181, 229, 0.16), rgba(170, 102, 204, 0.12)), rgba(4, 9, 18, 0.72);
  border: 1px solid rgba(93, 213, 255, 0.42);
  border-radius: 18px;
  box-shadow:
    0 0 30px rgba(51, 181, 229, 0.22),
    inset 0 0 24px rgba(170, 102, 204, 0.12);
  backdrop-filter: blur(14px);
}

.login-panel::before {
  position: absolute;
  inset: 0;
  pointer-events: none;
  content: '';
  background-image:
    linear-gradient(rgba(51, 181, 229, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(51, 181, 229, 0.08) 1px, transparent 1px);
  background-size: 18px 18px;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.9), transparent 88%);
}

.login-panel__scanline {
  position: absolute;
  top: -40%;
  left: 0;
  width: 100%;
  height: 40%;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgba(51, 181, 229, 0.2), transparent);
  animation: panel-scan 4s linear infinite;
}

.login-field {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 58px 1fr;
  align-items: center;
  min-height: 48px;
  overflow: hidden;
  color: rgba(204, 243, 255, 0.88);
  background: rgba(0, 0, 0, 0.34);
  border: 1px solid rgba(51, 181, 229, 0.28);
  border-radius: 12px;

  span {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #33b5e5;
    letter-spacing: 2px;
    text-shadow: 0 0 8px rgba(51, 181, 229, 0.72);
  }

  input {
    width: 100%;
    min-width: 0;
    height: 48px;
    padding: 0 14px 0 0;
    color: #fff;
    caret-color: #33b5e5;
    background: transparent;
    border: none;
    outline: none;

    &::placeholder {
      color: rgba(255, 255, 255, 0.34);
    }
  }
}

.login-error {
  position: relative;
  z-index: 1;
  min-height: 18px;
  margin: -2px 0 0;
  font-size: 13px;
  color: #ff6b8a;
  text-align: left;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.login-error--visible {
  opacity: 1;
}

.login-button {
  position: relative;
  z-index: 1;
  height: 48px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
  background: linear-gradient(45deg, #33b5e5, #aa66cc);
  border: none;
  border-radius: 999px;
  box-shadow: 0 10px 28px rgba(51, 181, 229, 0.28);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    filter 0.2s ease;

  &:not(:disabled):hover {
    transform: translateY(-2px);
    filter: saturate(1.12);
    box-shadow: 0 14px 34px rgba(170, 102, 204, 0.32);
  }

  &:disabled {
    cursor: wait;
    filter: grayscale(0.2);
    opacity: 0.7;
  }
}

@keyframes panel-scan {
  from {
    transform: translateY(0);
  }

  to {
    transform: translateY(360%);
  }
}
</style>
