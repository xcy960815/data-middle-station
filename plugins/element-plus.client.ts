import ElementPlus, { ID_INJECTION_KEY, ZINDEX_INJECTION_KEY } from 'element-plus'
import 'element-plus/dist/index.css'

/**
 * @desc 注册 element-plus
 * @param {NuxtApp} nuxtApp
 */
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.provide(ID_INJECTION_KEY, {
    prefix: Math.floor(Math.random() * 10000),
    current: 0
  })
  nuxtApp.vueApp.provide(ZINDEX_INJECTION_KEY, {
    current: 0
  })
  nuxtApp.vueApp.use(ElementPlus)
})
