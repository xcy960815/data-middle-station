import Konva from 'konva'
import { getFromPool, getTextX } from '../utils'
import type { KonvaNodePools } from '../variable-handlder'

export interface DrawBaseConfig {
  pools: KonvaNodePools
  name: string
}

export interface DrawTextConfig extends DrawBaseConfig {
  text: string
  x: number
  y: number
  fontSize: number
  fontFamily: string
  fill: string
  align?: 'left' | 'center' | 'right'
  verticalAlign?: 'top' | 'middle' | 'bottom'
  cellHeight?: number
  useGetTextX?: boolean
  opacity?: number
  offsetX?: number
  offsetY?: number
}

export interface DrawRectConfig extends DrawBaseConfig {
  x: number
  y: number
  width: number
  height: number
  fill?: string
  stroke?: string
  strokeWidth?: number
  cornerRadius?: number
  listening?: boolean
}

/**
 * 绘制文本
 * @param {DrawTextConfig} config 绘制文本配置
 * @returns {Konva.Text} 文本节点
 */
export const drawUnifiedText = (config: DrawTextConfig) => {
  const {
    pools,
    name,
    text,
    x,
    y,
    fontSize,
    fontFamily,
    fill,
    align = 'left',
    verticalAlign = 'middle',
    cellHeight,
    useGetTextX = false,
    opacity = 1,
    offsetX = 0,
    offsetY = 0
  } = config

  const textNode = getFromPool(pools.cellTexts, () => new Konva.Text({ listening: false, name }))

  textNode.name(name)
  textNode.setAttr('row-index', null)
  textNode.setAttr('col-index', null)

  if (useGetTextX) {
    textNode.x(getTextX(x))
    textNode.y(cellHeight ? y + cellHeight / 2 : y)
  } else {
    textNode.x(x)
    textNode.y(y)
  }

  textNode.text(text)
  textNode.fontSize(fontSize)
  textNode.fontFamily(fontFamily)
  textNode.fill(fill)
  textNode.opacity(opacity)
  textNode.align(align)
  textNode.verticalAlign(verticalAlign)

  if (align === 'center' && verticalAlign === 'middle') {
    const w = textNode.width()
    const h = textNode.height()
    textNode.offset({ x: w / 2, y: h / 2 })
  } else if (useGetTextX && verticalAlign === 'middle') {
    textNode.offsetY(textNode.height() / 2)
  }

  if (offsetX || offsetY) {
    const prev = textNode.offset()
    textNode.offset({ x: (prev.x || 0) + (offsetX || 0), y: (prev.y || 0) + (offsetY || 0) })
  }

  return textNode
}

/**
 * 绘制矩形
 * @param {DrawRectConfig} config 绘制矩形配置
 * @returns {Konva.Rect} 矩形节点
 */
export const drawUnifiedRect = (config: DrawRectConfig): Konva.Rect => {
  const { pools, name, x, y, width, height, fill, stroke, strokeWidth = 1, cornerRadius = 0, listening = true } = config

  const rect: Konva.Rect = getFromPool<Konva.Rect>(pools.cellRects, () => new Konva.Rect({ listening, name }))
  rect.name(name)
  rect.off('click')
  rect.off('mouseenter')
  rect.off('mouseleave')
  rect.x(x)
  rect.y(y)
  rect.width(width)
  rect.height(height)
  if (fill !== undefined) rect.fill(fill)
  if (stroke !== undefined) rect.stroke(stroke)
  rect.strokeWidth(strokeWidth)
  if (cornerRadius) rect.cornerRadius(cornerRadius)
  return rect
}
