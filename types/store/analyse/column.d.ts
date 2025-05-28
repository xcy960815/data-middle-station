/**
 * @desc 左侧列字段
 */
declare namespace ColumnStore {
  type ColumnKey = 'column'
  /**
   * @desc 列字段
   * @interface ColumnOption
   * @property {string} columnName 列名
   * @property {string} columnType 列类型
   * @property {string} columnComment 列注释
   * @property {string} alias 别名
   * @property {string} displayName 显示名称
   */
  interface ColumnOptionDto
    extends TableInfoModule.TableColumnOption {
    // 重写 columnName 类型 在dao层已经转换为驼峰
    columnName: string
    columnType: string
    columnComment?: string
    alias: string
    displayName: string
  }

  type dataSourceOption = {
    label: string
    value: string
    createTime?: string
    comment?: string
  }

  type ColumnState = {
    dataSource: string
    dataSourceOptions: Array<dataSourceOption>
    columns: ColumnOption[]
  }

  /**
   * @desc getter 名称 根据state 生成 相对应的 getter 名称 比如 state 为 dataSource 那么 getter 名称为 getDataSource
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`

  /**
   * @desc getter
   */
  type ColumnGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (
      state: S
    ) => S[K]
  }

  /**
   * @desc action 名称 根据state 生成 相对应的 action 名称 比如 state 为 dataSource 那么 action 名称为 setDataSource
   */
  type ActionName<T extends string> =
    | `set${Capitalize<T>}`
    | `remove${Capitalize<T>}`
  /**
   * @desc action
   */
  type ColumnActions = {
    [K in keyof ColumnState as ActionName<K & string>]: (
      value: ColumnState[K]
    ) => void
  } & {
    updateColumn: (value: Column, index: number) => void
  }
}
