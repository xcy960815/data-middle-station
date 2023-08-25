/**
 * @desc 定义用户模块的 store
 */
declare namespace UserStore {
  interface UserState {
    name: string;
    avatar: string;
  }
  interface UserGetters {
    userInfo(state: UserState): {
      name: string;
      avatar: string;
    };
    [key: string]: any;
  }
  interface UserActions {
    updateName(name: string): void;
  }
}
