/**
 * @description: nuxt3 路由守卫
 * @param {RouteLocationNormalized} to
 * @param {RouteLocationNormalized} from
 * @return {void | Promise<void>}
 */
export default defineNuxtRouteMiddleware(async (to, from) => {
  console.log('inject-data')

  // TODO 可以在中间键中提前获取chart数据 然后注入到页面的props中
  // const id = to.query.id;
  // if (!id) return
  // const result = await $fetch('/api/getAnalyse', {
  //   method: 'post',
  //   body: {
  //     id
  //   }
  // })
  inject('data', 'data')
  //  将数据注入到props中
  // navigateTo(to.fullPath);
  // 统一给页面添加标题
  // useHead({
  //   title: to.meta.menuName,
  // });
})
