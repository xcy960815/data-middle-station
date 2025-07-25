import * as ElementPlusIconsVue from '@element-plus/icons-vue'

/**
 * @desc 注册 element-plus icons
 * @param {NuxtApp} nuxtApp
 */
export default defineNuxtPlugin((nuxtApp) => {
  for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    nuxtApp.vueApp.component(key, component)
  }
})
