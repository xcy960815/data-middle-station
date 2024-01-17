

type HandlerParams = {
  fontColors: string[]
  charSet: string
  fontSizeMultiplier: number
  setIntervalId: Ref<ReturnType<typeof setInterval> | null>
}

export const handler = ({
  fontColors,
  charSet,
  fontSizeMultiplier,
  setIntervalId
}: HandlerParams) => {
  /**
   * @desc 获取随机颜色
   * @returns {string}
   */
  const getRandomColor = () =>
    fontColors[
    Math.floor(Math.random() * fontColors.length)
    ]
  /**
   * @desc 获取随机字符
   * @returns {string}
   */
  const getRandomChar = () => charSet[Math.floor(Math.random() * charSet.length)]

  /**
   * @desc 改变颜色透明度
   * @param color {string}
   * @param opacity {number}
   * @returns {string}
   */
  const changeAlpha = (color: string, opacity: number) => {
    let [r, g, b] = color
      .slice(1)
      .match(/.{2}/g)!
      .map((v) => parseInt(v, 16))
    return `rgba(${r}, ${g}, ${b}, ${opacity})`
  }

  /**
   * @description: 初始化代码雨
   */
  const initCodeRain = debounce(() => {
    if (setIntervalId.value) {
      clearInterval(setIntervalId.value)
    }
    const cvs = document.getElementById(
      'cvs'
    ) as HTMLCanvasElement

    const width = window.innerWidth * devicePixelRatio
    const height = window.innerHeight * devicePixelRatio

    cvs.width = width
    cvs.height = height

    const ctx = cvs.getContext(
      '2d'
    ) as CanvasRenderingContext2D
    const fontSize = fontSizeMultiplier * devicePixelRatio
    const columnWidth = fontSize
    const columnCount = Math.floor(width / columnWidth)

    const nextCharIndexInColumn = new Array(
      columnCount
    ).fill(0)

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      for (let i = 0; i < columnCount; i++) {
        const randomChar = getRandomChar()
        const xPosition = i * columnWidth
        const yPosition =
          (nextCharIndexInColumn[i] + 1) * fontSize

        const opacityFactor =
          yPosition / height < 0.2
            ? yPosition / (height * 0.2)
            : 1

        ctx.fillStyle = changeAlpha(
          getRandomColor(),
          opacityFactor
        )

        ctx.font = `${fontSize}px 'Monaco', monospace`

        ctx.fillText(randomChar, xPosition, yPosition)

        if (yPosition > height && Math.random() > 0.99) {
          nextCharIndexInColumn[i] = 0
        } else {
          nextCharIndexInColumn[i]++
        }
      }
    }

    setIntervalId.value = setInterval(draw, 100)
  }, 100)


  onMounted(() => {
    initCodeRain()
    // 页面尺寸变化时，重新初始化代码雨
    window.addEventListener('resize', initCodeRain)
  })
  onUnmounted(() => {
    window.removeEventListener('resize', initCodeRain)
  })
}
