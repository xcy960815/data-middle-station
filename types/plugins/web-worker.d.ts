/**
 * @desc webworker 模块类型声明
 */

declare interface Worker {
  post: <T = any>() => Promise<T>
}

declare namespace Webworker {
  interface Action {
    message: string
    callback?: () => T
  }
  type Worker = {
    post: <T = any>() => Promise<T>
  }

  type ArrayOfStrings = string[]

  type ArrayOfObjects = Action[]

  type PostAllParams = ArrayOfObjects | ArrayOfStrings
}
