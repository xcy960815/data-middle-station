import * as ElementPlusIcons from '@element-plus/icons-vue';

/**
 * @desc 这个文件把所有的图标都注册到全局了
 * @return {void}
 */
export default defineNuxtPlugin((nuxtApp) => {
  for (const [key, component] of Object.entries(ElementPlusIcons)) {
    nuxtApp.vueApp.component(key, component);
  }
});
