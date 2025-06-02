> 本文件夹是修改node_modules 的ts声明

## 已修改的模块

### 1. vue-router.d.ts

为 Vue Router 的 `RouteMeta` 接口添加了自定义字段：

- menuName: 菜单名称
- showInLeftMenu: 是否在左侧菜单显示
- highLightActive: 左侧菜单栏高亮的菜单
- link: 外部链接
- target: 跳转外部链接的方式
- menuIcon: Element Plus 图标
- permission: 权限数组

### 2. basic-languages.d.ts

为 Monaco Editor 的 SQL 语言定义添加了类型声明：

- 定义了 SQL 语言模块的导出接口
- 支持 Monaco Editor 的 SQL 语言特性

### 3. monaco-editor.d.ts

扩展了 Monaco Editor 的类型定义，添加了以下接口：

- FieldOption: 字段选项接口
  - fieldName: 字段名称
  - fieldType: 字段类型
  - fieldComment: 字段注释
  - databaseName: 数据库名称
  - tableName: 表名
- TableOption: 表选项接口
  - tableName: 表名
  - tableComment: 表备注
  - fieldOptions: 字段选项数组
- DatabaseOption: 数据库选项接口
  - databaseName: 数据库名称
  - tableOptions: 表选项数组
- SortText: 排序文本接口
- SuggestOption: 建议选项接口
- ThemeType: 编辑器主题类型 ('vs' | 'vs-dark' | 'hc-black')
