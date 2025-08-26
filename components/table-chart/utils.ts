import type Konva from 'konva'

/**
 * 设置指针样式的辅助函数
 * @param on 是否显示指针
 */
export const setPointerStyle = (stage: Konva.Stage | null, on: boolean, cursor: string) => {
  if (stage) stage.container().style.cursor = on ? cursor : 'default'
}

/**
 * 数字列 汇总方式
 */
export const numberOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '最大', value: 'max' },
  { label: '最小', value: 'min' },
  { label: '平均', value: 'avg' },
  { label: '求和', value: 'sum' }
]

/**
 * 文本列 汇总方式
 */
export const textOptions = [
  { label: '不展示', value: 'nodisplay' },
  { label: '已填写', value: 'filled' },
  { label: '未填写', value: 'nofilled' }
]

/**
 * 按钮颜色
 */
export const paletteOptions: Record<string, { fill: string; stroke: string; text: string }> = {
  primary: { fill: '#409EFF', stroke: '#2b74c7', text: '#fff' },
  success: { fill: '#67C23A', stroke: '#4ea427', text: '#fff' },
  warning: { fill: '#E6A23C', stroke: '#c9882f', text: '#fff' },
  danger: { fill: '#F56C6C', stroke: '#d15858', text: '#fff' },
  default: { fill: '#73767a', stroke: '#5b5e62', text: '#fff' }
}
