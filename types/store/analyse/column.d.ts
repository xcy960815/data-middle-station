/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace ColumnStore {
  type ColumnKey = 'column'
  /**
   * @desc 列字段
   */
  interface Column extends FieldOption { }

  interface dataSourceOption {
    label: string
    value: string
  }

  type ColumnState = {
    dataSource: string
    dataSourceOptions: Array<dataSourceOption>
    columns: Column[]
  }

  /**
   * @desc getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type ColumnGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
   * @desc action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}` | `add${Capitalize<T>}` | `remove${Capitalize<T>}`;
  /**
   * @desc action
   */
  type ColumnAction = {
    [K in keyof ColumnState as ActionName<K & string>]?: (value: ColumnState[K]) => void;
  };
}
