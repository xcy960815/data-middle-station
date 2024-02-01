/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace GroupStore {
  type GroupKey = 'group'
  /**
   * @desc 左侧列字段
   * @interface GroupOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  type GroupOption = ColumnStore.Column & {

  }

  type GroupState = {
    groups: GroupOption[]
  }

  /**
  * @desc getter 名称
  */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type GroupGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
   * @desc action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}` | `add${Capitalize<T>}`
  /**
   * @desc action
   */
  type GroupActions = {
    [K in keyof GroupState as ActionName<K & string>]: (value: GroupState[K]) => void;
  } & {
    removeGroup: (value: number) => void;
  }
}
