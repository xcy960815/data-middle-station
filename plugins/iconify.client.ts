import { Icon } from '@iconify/vue'

/**
 * @description 注册 iconify 组件
 * @see https://iconify.design/getting-started/
 * @link https://icon-sets.iconify.design/
 * @param {NuxtApp} nuxtApp
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('iconify-icon', Icon)
})
