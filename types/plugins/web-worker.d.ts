/**
 * @desc webworker 模块类型声明
 */

declare global {
  /**
   * @desc 给window添加webworker模块
   */
  interface Worker {
    post: <T = any>() => Promise<T>;
  }
  namespace WebworkerModule {
    interface Action {
      message: string;
      callback?: () => T;
    }
    type ArrayOfStrings = string[];

    type ArrayOfObjects = Action[];

    type PostAllParams = ArrayOfObjects | ArrayOfStrings;
  }
}

export {};
