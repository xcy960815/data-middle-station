import ElementPlus, { ID_INJECTION_KEY } from "element-plus";
// import locale from 'element-plus/lib/locale/lang/zh-cn'
import "element-plus/dist/index.css";
/**
 * @desc 通过插件的形式加载 Element Plus 组件库 也可以通过在 nuxt.config.ts 中的 modules 中引入 '@element-plus/nuxt'
 * @param nuxtApp
 * @returns {void}
 */
export default defineNuxtPlugin((nuxtApp) => {
  // { locale }
  nuxtApp.vueApp.use(ElementPlus);
  nuxtApp.vueApp.provide(ID_INJECTION_KEY, {
    prefix: Math.floor(Math.random() * 10000),
    current: 0,
  });
});
