/**
 * @desc 左侧列字段、过滤、排序、分组、聚合 公共字段类型
 */

interface FieldOption {
  name: string
  comment: string
  type: string
  choosed: boolean
  alias?: string
  displyName?: string
}

type ChartDataItem = Record<string, string | number>

interface DragData {
  from:
    | 'dimension'
    | 'order'
    | 'filter'
    | 'group'
    | 'cloumn'
  index: number
  value: Field
}
