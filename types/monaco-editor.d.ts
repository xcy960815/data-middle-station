import type { languages, IRange } from 'monaco-editor'

declare module 'monaco-editor' {
  // 列选项（应用自定义扩展类型）
  export interface FieldOption {
    fieldName: string
    fieldType: string
    fieldComment: string
    databaseName: string
    tableName: string
  }

  // 表选项（应用自定义扩展类型）
  export interface TableOption {
    tableName: string
    tableComment: string
    fieldOptions: Array<FieldOption>
  }

  // 数据库选项（应用自定义扩展类型）
  export interface DatabaseOption {
    databaseName: string
    tableOptions: Array<TableOption>
  }

  export interface SortText {
    Database: '0'
    Table: '1'
    Column: '2'
    Keyword: '3'
  }

  // 自定义的 Suggest 项，兼容 monaco 的 CompletionItem
  export interface SuggestOption extends Omit<languages.CompletionItem, 'range'> {
    range?:
      | IRange
      | {
          insert: IRange
          replace: IRange
        }
  }

  /**
   * 编译器主题枚举
   */
  export type ThemeType = 'vs' | 'vs-dark' | 'hc-black'
}
