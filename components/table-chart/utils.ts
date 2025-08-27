import Konva from 'konva'
import { tableVars } from './variable'
/**
 * 设置指针样式的辅助函数
 * @param on 是否显示指针
 */
export const setPointerStyle = (stage: Konva.Stage | null, on: boolean, cursor: string) => {
  if (stage) stage.container().style.cursor = on ? cursor : 'default'
}

/**
 * 获取容器元素
 * @returns {HTMLDivElement | null} 容器元素
 */
export const getTableContainerElement = (): HTMLDivElement | null => {
  return document.getElementById('table-container') as HTMLDivElement | null
}

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

/**
 * 对象池：获取或创建对象
 * @param pool 对象池
 * @param createFn 创建函数
 * @returns {T}
 */
export const getFromPool = <T extends Konva.Node>(pools: T[], createPoolHandler: () => T): T => {
  let pooledNode = pools.pop()
  if (!pooledNode) {
    pooledNode = createPoolHandler()
  }
  return pooledNode
}
// 清理对象池
export const clearPool = (pool: Konva.Node[]) => {
  pool.forEach((node) => node.destroy())
  pool.length = 0
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
 * 文本起始 X 坐标（包含左侧 8px 内边距）
 * @param x 文本起始 X 坐标
 * @returns 文本起始 X 坐标（包含左侧 8px 内边距）
 */
export const getTextX = (x: number) => {
  return x + 8
}

/**
 * 判断当前指针位置的顶层元素是否属于表格容器
 * 若不属于，则认为表格被其它遮罩/弹层覆盖，此时不进行高亮
 * @param {number} clientX 鼠标点击位置的 X 坐标
 * @param {number} clientY 鼠标点击位置的 Y 坐标
 * @returns {boolean} 是否在表格容器内
 */
export const isTopMostInTable = (clientX: number, clientY: number): boolean => {
  const container = getTableContainerElement()
  if (!container) return false
  const topEl = document.elementFromPoint(clientX, clientY) as HTMLElement | null
  if (!topEl) return false
  if (!container.contains(topEl)) return false
  // 仅当命中的元素为 Konva 的 canvas（或其包裹层）时，认为没有被遮罩覆盖
  if (topEl.tagName === 'CANVAS') return true
  const konvaContent = topEl.closest('.konvajs-content') as HTMLElement | null
  if (konvaContent && container.contains(konvaContent)) return true
  // 命中的虽然在容器内，但不是 Konva 画布，视为被遮罩覆盖
  return false
}

/**
 * 清除分组 清理所有分组
 * @returns {void}
 */
export const clearGroups = () => {
  tableVars.headerLayer?.destroyChildren()
  tableVars.bodyLayer?.destroyChildren()
  tableVars.summaryLayer?.destroyChildren()
  tableVars.fixedHeaderLayer?.destroyChildren()
  tableVars.fixedBodyLayer?.destroyChildren()
  tableVars.fixedSummaryLayer?.destroyChildren()
  tableVars.scrollbarLayer?.destroyChildren()
  clearPool(tableVars.leftBodyPools.cellRects)
  clearPool(tableVars.leftBodyPools.cellTexts)
  clearPool(tableVars.leftBodyPools.mergedCellRects)
  clearPool(tableVars.leftBodyPools.backgroundRects)
  clearPool(tableVars.centerBodyPools.cellRects)
  clearPool(tableVars.centerBodyPools.cellTexts)
  clearPool(tableVars.centerBodyPools.mergedCellRects)
  clearPool(tableVars.centerBodyPools.backgroundRects)
  clearPool(tableVars.rightBodyPools.cellRects)
  clearPool(tableVars.rightBodyPools.cellTexts)
  clearPool(tableVars.rightBodyPools.mergedCellRects)
  clearPool(tableVars.rightBodyPools.backgroundRects)

  /**
   * 重置滚动条引用
   */
  tableVars.verticalScrollbarGroup = null
  tableVars.horizontalScrollbarGroup = null
  tableVars.verticalScrollbarThumb = null
  tableVars.horizontalScrollbarThumb = null

  /**
   * 重置中心区域剪辑组引用
   */
  tableVars.centerBodyClipGroup = null

  /**
   * 重置单元格选择
   */
  tableVars.selectedCell = null
  tableVars.highlightRect = null

  /**
   * 重置虚拟滚动状态
   */
  tableVars.visibleRowStart = 0
  tableVars.visibleRowEnd = 0
  tableVars.visibleRowCount = 0

  /**
   * 重置汇总组引用
   */
  tableVars.leftSummaryGroup = null
  tableVars.centerSummaryGroup = null
  tableVars.rightSummaryGroup = null

  /**
   * 重置悬浮高亮
   */
  tableVars.hoveredRowIndex = null
  tableVars.hoveredColIndex = null
}

/**
 * 调整十六进制颜色亮度
 * @param hex 颜色，如 #409EFF
 * @param percent 亮度百分比，正数变亮，负数变暗（-100~100）
 */
export const adjustHexColorBrightness = (hex: string, percent: number): string => {
  const normalizeHex = (h: string) => {
    if (!h) return '#000000'
    if (h.startsWith('#')) h = h.slice(1)
    if (h.length === 3)
      h = h
        .split('')
        .map((c) => c + c)
        .join('')
    if (h.length !== 6) return '#000000'
    return '#' + h
  }
  const base = normalizeHex(hex)
  const r = parseInt(base.slice(1, 3), 16)
  const g = parseInt(base.slice(3, 5), 16)
  const b = parseInt(base.slice(5, 7), 16)
  const adj = (v: number) => constrainToRange(Math.round(v + (percent / 100) * 255), 0, 255)
  const toHex = (v: number) => v.toString(16).padStart(2, '0')
  return `#${toHex(adj(r))}${toHex(adj(g))}${toHex(adj(b))}`
}

/**
 * 超出最大宽度时裁剪文本，并追加省略号
 * @param text 文本
 * @param maxWidth 最大宽度
 * @param fontSize 字体大小
 * @param fontFamily 字体
 * @returns 裁剪后的文本
 */
export const truncateText = (text: string, maxWidth: number, fontSize: number | string, fontFamily: string): string => {
  fontSize = typeof fontSize === 'string' ? Number(fontSize) : fontSize
  // 创建一个临时文本节点来测量文本宽度
  const tempText = new Konva.Text({
    text: text,
    fontSize: fontSize,
    fontFamily: fontFamily
  })

  // 如果文本宽度小于等于 maxWidth，直接返回
  if (tempText.width() <= maxWidth) {
    tempText.destroy()
    return text
  }

  // 二分查找，找到最大可容纳的字符数
  let left = 0
  let right = text.length
  let result = ''

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    const testText = text.substring(0, mid) + '...'

    tempText.text(testText)

    if (tempText.width() <= maxWidth) {
      result = testText
      left = mid + 1
    } else {
      right = mid - 1
    }
  }

  tempText.destroy()
  return result || '...'
}
