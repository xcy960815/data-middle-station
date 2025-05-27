export default defineNuxtRouteMiddleware((to) => {
  // console.log('to', to)
  if (to.path === '/') {
    return navigateTo('/welcome')
  }
})
