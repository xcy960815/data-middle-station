import chalk from 'chalk';
/**
 * @description: nuxt3 路由守卫
 * @param {import('nuxt3').NuxtRoute} to
 * @param {import('nuxt3').NuxtRoute} from
 * @return {void | Promise<void>}
 */
export default defineNuxtRouteMiddleware((to, from) => {
  // navigateTo(to.fullPath);
  // console.log(chalk.bgBlue("'我要去的页面'"), to.fullPath);
  // console.log(chalk.bgBlue("'我来自的页面'"), from.fullPath);
  // 统一给页面添加标题
  useHead({
    title: to.meta.menuName,
  });
});
