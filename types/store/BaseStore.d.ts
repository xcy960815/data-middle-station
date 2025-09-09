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
  type Getters<S, G extends { [key: string]: (state: S) => S[K] }> = {
    [K in keyof S as GetterName<K>]: (state: S) => S[K]
  } & G

  /**
   * action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}`
  /**
   * 提供了基础的 set action
   */
  type Actions<S, A extends { [key: string]: (value: S[K]) => void }> = {
    [K in keyof S as ActionName<K>]: (value: S[K]) => void
  } & A
}
