/**
 * @desc 给右上角的全屏按钮添加全屏功能 以及 esc 退出全屏功能
 * @example document.fullscreenElement
 * @example document.mozFullScreenElement
 * @example document.msFullscreenElement
 * @example document.webkitFullscreenElement
 * @example document.mozCancelFullScreen
 * @example document.msExitFullscreen
 * @example document.webkitExitFullscreen
 * @example document.msRequestFullscreen
 * @example document.mozRequestFullScreen
 * @example document.webkitRequestFullscreen
 * @example document.exitFullscreen
 */
declare global {
  interface Document {
    // 给 document 添加自定义属性
    mozFullScreenElement?: Element
    msFullscreenElement?: Element
    webkitFullscreenElement?: Element
    mozCancelFullScreen?: () => void
    msExitFullscreen?: () => void
    // chrome 全屏
    webkitExitFullscreen?: () => void
    // ie11 全屏
    msRequestFullscreen?: () => void
    // 火狐 全屏
    mozRequestFullScreen?: () => void
  }
  interface HTMLElement {
    // 给 HTMLElement 添加自定义属性
    // opera
    mozRequestFullscreen?: () => void
    // ie11
    msRequestFullscreen?: () => void
    // chrome
    webkitRequestFullscreen?: () => void
  }
}

export {}
