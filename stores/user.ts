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
    userName: '',
    avatar: ''
  }),
  getters: {
    userInfo(state) {
      return {
        userId: state.userId,
        userName: state.userName,
        avatar: state.avatar
      }
    },
    getUserName(state) {
      return state.userName
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
    setUserName(userName: string) {
      this.userName = userName
    },
    setAvatar(value: string) {
      this.avatar = value
    }
  }
})
