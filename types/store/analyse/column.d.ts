/// <reference path="./commom.d.ts" />
/**
 * @desc 左侧列字段
 */
declare namespace ColumnStore {
  type ColumnKey = 'column'
  /**
   * @desc 左侧列字段
   * @interface Column
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface Column extends FieldOption {}

  interface dataSourceOption {
    lable:string
    value:string
  }

  interface ColumnState {
    dataSource:string
    dataSourceOptions:Array<dataSourceOption>
    columns: Column[]

  }

  // interface ColumnGetter
  //   extends Record<
  //     `get${Capitalize<keyof ColumnState>}`,
  //     (
  //       state: ColumnState
  //     ) => <
  //       K extends string & keyof ColumnState
  //     >() => ColumnState[K]
  //   > {}


  // type ColumnGetter = Record<
  //     // key
  //     `get${Capitalize<keyof ColumnState>}`,
  //     // value
  //     (state: ColumnState) => <K extends string & keyof ColumnState>() => ColumnState[K]
  //     > 

  type ColumnGetter = {
    getDataSource: (state: ColumnState) => <K extends "dataSource" | "dataSourceOptions" | "columns">() => ColumnState[K];
    getDataSourceOptions: (state: ColumnState) => <K extends "dataSource" | "dataSourceOptions" | "columns">() => ColumnState[K];
    getColumns: (state: ColumnState) => <K extends "dataSource" | "dataSourceOptions" | "columns">() => ColumnState[K];
}

  interface ColumnAction {
    setColumns(columns: Column[]): void
    setDataSource(dataSource: string): void
    setDataSourceOptions(dataSourceOptions: Array<dataSourceOption>): void
  }
}
