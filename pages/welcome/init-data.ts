export const initData = () => {
  /**
   * @desc 获取随机颜色
   * @returns {string}
   */
  const fontSizeMultiplier = 20

  
  const setIntervalId = ref<ReturnType<typeof setInterval> | null>(null)

  /**
   * @desc 颜色列表
   */
  const fontColors = [
    '#33BSE5',
    '#0099CC',
    '#AA66CC',
    '#9933Cc',
    '#99CC00',
    '#669900',
    '#FFBB33',
    '#FF8800',
    '#FF4444',
    '#CCO000'
  ]
  /**
   * @description: 初始化代码雨
   */
  const charSet = 'console.log("Blog Home Nuxt3!")'

  return {
    setIntervalId,
    fontSizeMultiplier,
    fontColors,
    charSet
  }
}
