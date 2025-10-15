import Konva from 'konva'

import { getColumnSortStatus } from './data-handler'
/**
 * 布局相关常量
 */
export const LAYOUT_CONSTANTS = {
  /**
   * 右侧图标区域预留宽度
   */
  ICON_AREA_WIDTH: 40,
  /**
   * 排序箭头距离右边缘的距离
   */
  SORT_ARROW_OFFSET: 34,
  /**
   * 过滤图标距离右边缘的距离
   */
  FILTER_ICON_OFFSET: 12,
  /**
   * 排序箭头大小
   */
  ARROW_SIZE: 8,
  /**
   * 排序箭头高度缩放（0-1，值越小越"矮"）
   */
  ARROW_HEIGHT_SCALE: 0.72,
  /**
   * 上下箭头间距
   */
  ARROW_GAP: 2,
  /**
   * 过滤图标大小
   */
  FILTER_ICON_SIZE: 16,
  /**
   * 拖拽图标距离左边缘的距离
   */
  DRAG_ICON_OFFSET: 8,
  /**
   * 拖拽图标大小
   */
  DRAG_ICON_SIZE: 14
} as const

/**
 * 文本间距相关常量
 */
export const TEXT_SPACING_CONSTANTS = {
  /**
   * 基础文本水平边距（左右各8px）
   */
  TEXT_PADDING_HORIZONTAL: 8
} as const

/**
 * 文本宽度计算工具函数
 */
export const calculateTextWidth = {
  /**
   * 计算 Header 单元格的可用文本宽度
   * @param columnOption 列配置
   */
  forHeaderCell: (columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption): number => {
    const sortOrder = getColumnSortStatus(columnOption.columnName)
    const hasSort = sortOrder !== null
    const cellWidth = columnOption.width || 0
    const leftSpace = TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL
    const rightSpace = TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL

    return cellWidth - leftSpace - rightSpace
  },

  /**
   * 计算 Body 单元格的可用文本宽度
   */
  forBodyCell: (cellWidth: number): number => {
    return cellWidth - TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL
  },

  /**
   * 计算 Summary 单元格的可用文本宽度
   */
  forSummaryCell: (cellWidth: number): number => {
    return cellWidth - TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL
  }
}

/**
 * 通用类型工具：美化类型显示
 */
export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}
/**
 * 对象池 属性
 */
export interface KonvaNodePools {
  /**
   * 单元格矩形
   */
  cellRects: Konva.Rect[]
  /**
   * 单元格文本
   */
  cellTexts: Konva.Text[]
}

/**
 * 清理对象池
 * @param {Konva.Node[]} pool 对象池
 * @returns {void}
 */
export const clearPool = (pool: Konva.Node[]) => {
  pool.forEach((node) => node.destroy())
  pool.length = 0
}

/**
 * 对象池：获取或创建对象
 * @param {T[]} pools 对象池
 * @param {() => T} createPoolHandler 创建函数
 * @returns {T}
 */
export const getFromPool = <T extends Konva.Node>(pools: T[], createPoolHandler: () => T): T => {
  let pooledNode = pools.pop()
  if (!pooledNode) {
    pooledNode = createPoolHandler()
  }
  return pooledNode
}

/**
 * 回收 Konva 节点
 * @param pool 对象池
 * @param node 对象
 * @returns {void}
 */
export const returnToPool = <T extends Konva.Node>(pool: T[], node: T) => {
  node.remove()
  pool.push(node)
}

/**
 * 优化的节点回收 - 批量处理减少遍历次数
 * @param {Konva.Group} bodyGroup - 分组
 * @param {KonvaNodePools} pools - 对象池
 * @returns {void}
 */
export const recoverKonvaNode = (bodyGroup: Konva.Group, pools: KonvaNodePools) => {
  // 清空当前组，将对象返回池中
  const children = bodyGroup.children.slice()
  const textsToRecover: Konva.Text[] = []
  const rectsToRecover: Konva.Rect[] = []

  // 分类收集需要回收的节点
  children.forEach((child: Konva.Node) => {
    if (child instanceof Konva.Text) {
      const name = child.name()
      // 处理合并单元格和普通单元格文本节点回收
      if (name === 'merged-cell-text' || name === 'cell-text') {
        textsToRecover.push(child)
      }
    } else if (child instanceof Konva.Rect) {
      const name = child.name()
      // 处理合并单元格和普通单元格矩形节点回收
      if (name === 'merged-cell-rect' || name === 'cell-rect') {
        rectsToRecover.push(child)
      }
    }
  })

  // 批量回收
  textsToRecover.forEach((text) => returnToPool(pools.cellTexts, text))
  rectsToRecover.forEach((rect) => returnToPool(pools.cellRects, rect))
}
/**
 * 获取容器元素
 * @returns {HTMLDivElement | null} 容器元素
 */
export const getTableContainer = (): HTMLDivElement | null => {
  return document.getElementById('table-container') as HTMLDivElement | null
}

/**
 * 将数值约束到指定区间 [min, max]
 * @param n 数值
 * @param min 最小值
 * @param max 最大值
 * @returns 限制后的数值
 */
export const constrainToRange = (n: number, min: number, max: number) => {
  return Math.max(min, Math.min(max, n))
}

/**
 * 超出最大宽度时裁剪文本，并追加省略号
 * @param text 文本
 * @param maxWidth 最大宽度
 * @param fontSize 字体大小
 * @param fontFamily 字体
 * @returns 裁剪后的文本
 */
export const truncateText = (text: string, maxWidth: number, fontSize: number, fontFamily: string): string => {
  // 创建一个临时文本节点来测量文本宽度
  const tempTextNode = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily
  })

  // 如果文本宽度小于等于 maxWidth，直接返回
  if (tempTextNode.width() <= maxWidth) {
    tempTextNode.destroy()
    return text
  }

  // 二分查找，找到最大可容纳的字符数
  let left = 0
  let right = text.length
  let result = ''

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const testText = text.substring(0, mid) + '...'

    tempTextNode.text(testText)

    if (tempTextNode.width() <= maxWidth) {
      result = testText
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  tempTextNode.destroy()
  return result || '...'
}

/**
 * 绘制文本配置接口
 */
export interface DrawTextConfig {
  pools?: KonvaNodePools
  name: string
  text: string
  x: number
  y: number
  height: number
  width: number
  fontSize: number
  fontFamily: string
  fill: string
  align: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
  group: Konva.Group
}

/**
 * 绘制矩形配置接口
 */
export interface DrawRectConfig {
  name: string
  x: number
  y: number
  width: number
  height: number
  fill: string
  stroke: string
  strokeWidth: number
  group: Konva.Group
  cornerRadius?: number
  listening?: boolean
  pools?: KonvaNodePools
}

/**
 * 绘制文本
 * @param {DrawTextConfig} config - 绘制文本配置
 * @returns {Konva.Text} 文本节点
 */
export const drawUnifiedText = (config: DrawTextConfig) => {
  const { pools, name, text, x, y, fontSize, fontFamily, fill, align, verticalAlign, height, width, group } = config

  // 创建或复用文本节点
  const textNode = pools
    ? getFromPool(pools.cellTexts, () => new Konva.Text({ listening: false, name }))
    : new Konva.Text({
        name,
        text,
        x,
        y,
        fontSize,
        fontFamily,
        fill,
        align,
        verticalAlign,
        width,
        height,
        listening: false
      })

  // 统一设置属性（仅在使用对象池时需要更新所有属性）
  if (pools) {
    textNode.text(text)
    textNode.fontSize(fontSize)
    textNode.fontFamily(fontFamily)
    textNode.fill(fill)
    textNode.align(align)
    textNode.verticalAlign(verticalAlign)
  }

  // 处理水平对齐
  if (align === 'center') {
    textNode.x(x + width / 2)
    textNode.offsetX(textNode.width() / 2)
  } else if (align === 'right') {
    textNode.x(x + width - TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL)
  } else {
    textNode.x(x + TEXT_SPACING_CONSTANTS.TEXT_PADDING_HORIZONTAL)
  }

  // 处理垂直对齐
  if (verticalAlign === 'middle') {
    textNode.y(y + height / 2)
    textNode.offsetY(textNode.height() / 2)
  } else {
    textNode.y(y)
  }

  group.add(textNode)
  return textNode
}

/**
 * 绘制矩形
 * @param {DrawRectConfig} config - 绘制矩形配置
 * @returns {Konva.Rect} 矩形节点
 */
export const drawUnifiedRect = (config: DrawRectConfig): Konva.Rect => {
  const { pools, name, x, y, width, height, fill, stroke, strokeWidth, cornerRadius, listening, group } = config
  // 创建或复用矩形节点
  const rectNode = pools
    ? getFromPool(pools.cellRects, () => new Konva.Rect({ listening, name }))
    : new Konva.Rect({ listening, name })

  // 移除旧的事件监听器（避免对象池复用时累积事件）
  rectNode.off('click')
  rectNode.off('mouseenter')
  rectNode.off('mouseleave')

  // 统一设置属性
  rectNode.setAttrs({
    x,
    y,
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    cornerRadius
  })

  group.add(rectNode)

  return rectNode
}

/**
 * 获取单元格显示值
 * @param {GroupStore.GroupOption | DimensionStore.DimensionOption} columnOption - 列配置
 * @param {ChartDataVo.ChartData} row - 行数据
 * @param {number} rowIndex - 行索引
 * @returns {string} 显示值
 */
export const getCellDisplayValue = (
  columnOption: GroupStore.GroupOption | DimensionStore.DimensionOption,
  row: ChartDataVo.ChartData,
  rowIndex: number
) => {
  const rawValue =
    columnOption.columnName === '__index__'
      ? String(rowIndex + 1)
      : row && typeof row === 'object'
        ? row[columnOption.columnName]
        : undefined
  return String(rawValue ?? '')
}

/**
 * 设置指针样式的辅助函数
 * @param {Konva.Stage | null} stage - 舞台
 * @param {boolean} on - 是否显示指针
 * @param {string} cursor - 指针样式
 */
export const setPointerStyle = (stage: Konva.Stage | null, on: boolean, cursor: string) => {
  if (stage) stage.container().style.cursor = on ? cursor : 'default'
}

interface ClipOptions {
  x: number
  y: number
  width: number
  height: number
}

/**
 * 统一的分组创建工厂方法
 * @param {'header' | 'body' | 'summary' | 'scrollbar'} groupType - 分组类型
 * @param {'left' | 'center' | 'right' | 'vertical' | 'horizontal'} position - 左中右位置或滚动条方向
 * @param {number} x - x坐标
 * @param {number} y - y坐标
 * @param {Object} [options] - 可选配置（如裁剪参数）
 * @param {number} options.x - 裁剪x坐标
 * @param {number} options.y - 裁剪y坐标
 * @param {number} options.width - 裁剪宽度
 * @param {number} options.height - 裁剪高度
 * @returns {Konva.Group}
 */
export const createGroup = (
  groupType: 'header' | 'body' | 'summary' | 'scrollbar',
  position: 'left' | 'center' | 'right' | 'vertical' | 'horizontal',
  x: number = 0,
  y: number = 0,
  clip?: ClipOptions
): Konva.Group => {
  const groupName =
    groupType === 'scrollbar'
      ? `${position}-${groupType}-group`
      : `${position}-${groupType}${clip ? '-clip' : ''}-group`

  const groupConfig: Konva.GroupConfig = {
    x: position === 'left' ? 0 : x, // 左侧固定列的x永远为0
    y: position === 'center' && groupType !== 'header' ? y : groupType === 'header' ? 0 : y,
    name: groupName
  }

  // 如果是裁剪组，添加裁剪配置
  if (clip) {
    groupConfig.clip = clip
  }

  return new Konva.Group(groupConfig)
}

/**
 * 获取下拉框的弹出位置
 * @param {number} clientX
 * @param {number} clientY
 * @param {number} wapperWidth
 * @param {number} wapperHeight
 * @returns {dropdownX:number,dropdownY:number}
 */
export const getDropdownPosition = (clientX: number, clientY: number, wapperWidth: number, wapperHeight: number) => {
  // 获取视口高度
  const viewportHeight = window.innerHeight
  // 获取视口宽度
  const viewportWidth = window.innerWidth

  // 计算各方向剩余空间
  const spaceBelow = viewportHeight - clientY
  const spaceAbove = clientY
  const spaceRight = viewportWidth - clientX
  const spaceLeft = clientX

  // 垂直位置计算
  let dropdownY = clientY
  if (spaceBelow >= wapperHeight) {
    // 下方空间充足，显示在点击位置下方
    dropdownY = clientY + 5
  } else if (spaceAbove >= wapperHeight) {
    // 下方空间不足但上方空间充足，显示在点击位置上方
    dropdownY = clientY - wapperHeight - 5
  } else {
    // 上下空间都不足，优先选择空间较大的一方
    if (spaceBelow >= spaceAbove) {
      dropdownY = clientY + 5
    } else {
      dropdownY = clientY - wapperHeight - 5
    }
    // 确保不超出边界
    dropdownY = Math.max(5, Math.min(dropdownY, viewportHeight - wapperHeight - 5))
  }

  // 水平位置计算
  let dropdownX = clientX
  if (spaceRight >= wapperWidth) {
    // 右侧空间充足，显示在点击位置右侧
    dropdownX = clientX + 5
  } else if (spaceLeft >= wapperWidth) {
    // 右侧空间不足但左侧空间充足，显示在点击位置左侧
    dropdownX = clientX - wapperWidth - 5
  } else {
    // 左右空间都不足，优先选择空间较大的一方
    if (spaceRight >= spaceLeft) {
      dropdownX = clientX + 5
    } else {
      dropdownX = clientX - wapperWidth - 5
    }
    // 确保不超出边界
    dropdownX = Math.max(5, Math.min(dropdownX, viewportWidth - wapperWidth - 5))
  }
  return {
    dropdownX,
    dropdownY
  }
}
