/// <reference path="./commom.d.ts" />

declare namespace FilterStore {
  type FilterKey = 'filter'

  interface FilterOption extends  ColumnStore.Column { 
   
  }

  type FilterState = {
    filters: Array<FilterOption>
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
  type ActionName<T extends string> = `set${Capitalize<T>}` | `add${Capitalize<T>}`
  /**
   * @desc action
   */
  type FilterActions = {
    [K in keyof FilterState as ActionName<K & string>]: (value: FilterState[K]) => void;
  }& {
    removeFilter: (value: number) => void;
  }
}
