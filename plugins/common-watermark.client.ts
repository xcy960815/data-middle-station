import { watermark } from 'common-watermark'
import dayjs from 'dayjs'

/**
 * @description: 背景水印
 * @returns {void}
 */
export default defineNuxtPlugin({
  setup() {
    // 背景水印
    const body = document.querySelector<HTMLElement>('body')!
    watermark.setWatermark(`${dayjs().format('YYYY-MM-DD HH:mm')}`, body)
  }
})
