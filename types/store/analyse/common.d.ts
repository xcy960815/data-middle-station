/**
 * @description: 分析模块公共类型
 */
interface DragData {
  from:
    | 'dimension'
    | 'order'
    | 'filter'
    | 'group'
    | 'cloumn'
  index: number
  value: TableInfoModule.TableColumnOption
}
