declare namespace BaseStore {
  /**
   * 基础 store 的 key
   */
  type BaseStoreKey = string

  /**
   * 基础 store 的 state
   */
  type State<S = Record<string, any>> = S

  /**
   * getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`

  /**
   * 基础 getter & 自定义 getter
   */
  type Getters<S, G extends { [key: string]: (state: S) => any }> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K]
  } & G

  /**
   * action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}`

  /**
   * reset action 名称
   */
  type ResetActionName<T extends string> = `reset${Capitalize<T>}`

  /**
   * 提供指定 state 字段的 reset action。
   */
  type ResetActions<S> = {
    [K in keyof S as ResetActionName<K & string>]: () => void
  }

  /**
   * 提供了基础的 set action
   */
  type Actions<S, A extends { [key: string]: (...args: any[]) => void }> = {
    [K in keyof S as ActionName<K & string>]: (value: S[K]) => void
  } & A
}
