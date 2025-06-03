import { IconPark } from '@icon-park/vue-next/es/all'

/**
 * @description 注册 IconPark 组件
 * @see https://iconpark.oceanengine.com/home
 * @link https://iconpark.oceanengine.com/home
 * @param {NuxtApp} nuxtApp
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('icon-park', IconPark)
})
