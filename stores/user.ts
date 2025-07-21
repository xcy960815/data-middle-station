import { defineStore } from 'pinia'
import { StoreNames } from './store-names'

/**
 * @desc 定义用户模块的 store
 */
export const useUserStore = defineStore<
  UserStore.UserKey,
  BaseStore.State<UserStore.UserState>,
  BaseStore.Getters<UserStore.UserState, UserStore.UserGetters>,
  BaseStore.Actions<UserStore.UserState, UserStore.UserActions>
>(StoreNames.USER, {
  state: () => ({
    userId: '',
    name: '',
    avatar: ''
  }),
  getters: {
    userInfo(state) {
      return {
        userId: state.userId,
        name: state.name,
        avatar: state.avatar
      }
    },
    getName(state) {
      return state.name
    },
    getAvatar(state) {
      return state.avatar
    },
    getUserId(state) {
      return state.userId
    }
  },
  actions: {
    setUserId(userId: string) {
      this.userId = userId
    },
    updateName(name: string) {
      this.name = name
    },
    setName(value: string) {
      this.name = value
    },
    setAvatar(value: string) {
      this.avatar = value
    }
  }
})
