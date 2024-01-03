/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace ColumnStore {
  type ColumnKey = 'column'
  /**
   * @desc 列字段
   */
  interface Column extends TableInfoModule.TableColumnOption {
    choosed: boolean
  }

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
   * @desc getter 名称 根据state 生成 相对应的 getter 名称 比如 state 为 dataSource 那么 getter 名称为 getDataSource
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type ColumnGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
   * @desc action 名称 根据state 生成 相对应的 action 名称 比如 state 为 dataSource 那么 action 名称为 setDataSource
   */
  type ActionName<T extends string> = `set${Capitalize<T>}` | `remove${Capitalize<T>}`;
  /**
   * @desc action
   */
  type ColumnActions = {
    [K in keyof ColumnState as ActionName<K & string>]: (value: ColumnState[K]) => void;
  } & {
    updateColumn: (value: Column, index: number) => void;
  };
}
