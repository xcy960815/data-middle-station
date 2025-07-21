/**
 * @desc 定义用户模块的 store
 */
declare namespace UserStore {
  /**
   * @desc 用户key
   */
  type UserKey = 'user'
  /**
   * @desc 用户状态
   */
  type UserState = {
    userId: string
    name: string
    avatar: string
  }
  /**
   * @desc 用户getter
   */
  type UserGetters = {
    userInfo(state: UserState): {
      userId: string
      name: string
      avatar: string
    }
  }
  /**
   * @desc 用户action
   */
  type UserActions = {
    setUserId(userId: string): void
    updateName(name: string): void
  }
}
