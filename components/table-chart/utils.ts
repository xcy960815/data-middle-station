import Konva from 'konva'

/**
 * 获取容器元素
 * @returns {HTMLDivElement | null} 容器元素
 */
export const getTableContainerElement = (): HTMLDivElement | null => {
  return document.getElementById('table-container') as HTMLDivElement | null
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

/**
 * 估算单个按钮宽度基于文本长度
 * @param {string} text 文本
 * @param {number | string} fontSize 字体大小
 * @param {string} fontFamily 字体
 * @returns 估算的按钮宽度
 */
export const estimateButtonWidth = (text: string, fontSize: number | string, fontFamily: string) => {
  const tempCellText = new Konva.Text({
    text,
    fontSize: typeof fontSize === 'string' ? Number(fontSize) : fontSize,
    fontFamily: fontFamily
  })
  const w = tempCellText.width() + 16
  tempCellText.destroy()
  return constrainToRange(w, 48, 120)
}
