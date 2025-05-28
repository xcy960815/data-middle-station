/**
 * @desc 定义用户模块的 store
 */
export const useUserStore = defineStore('user', {
  state: () => ({
    name: 'xcy960815',
    avatar:
      'https://avatars.githubusercontent.com/u/18083515?v=4'
  }),
  getters: {
    userInfo(state) {
      return {
        name: state.name,
        avatar: state.avatar
      }
    }
  },
  actions: {
    updateName(name: string) {
      this.name = name
    }
  }
})
