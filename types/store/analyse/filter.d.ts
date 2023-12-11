/// <reference path="./commom.d.ts" />

declare namespace FilterStore {
  type FilterKey = 'filter'

  interface Filter extends FieldOption { }

  type FilterState = {
    filters: Array<Filter>
  }


  /**
   * @desc getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type FilterGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
   * @desc action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}` | `add${Capitalize<T>}` | `remove${Capitalize<T>}`;
  /**
   * @desc action
   */
  type FilterActions = {
    [K in keyof FilterState as ActionName<K & string>]?: (value: FilterState[K]) => void;
  };
}
