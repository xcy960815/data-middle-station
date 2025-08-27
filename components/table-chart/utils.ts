import Konva from 'konva'
import type { KonvaNodePools } from './variable'
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
 * 回收 Konva 节点
 * @param {Konva.Group} bodyGroup 分组
 * @param {ObjectPools} pools 对象池
 * @returns {void}
 */
const recoverKonvaNode = (bodyGroup: Konva.Group, pools: KonvaNodePools) => {
  // 清空当前组，将对象返回池中
  const children = bodyGroup.children.slice()
  children.forEach((child) => {
    const isText = child instanceof Konva.Text
    const isRect = child instanceof Konva.Rect
    if (isText) {
      const isMergedCellText = child.name() === 'merged-cell-text'
      if (isMergedCellText) {
        returnToPool(pools.mergedCellTexts, child)
      }
      const isCellText = child.name() === 'cell-text'
      if (isCellText) {
        returnToPool(pools.cellTexts, child)
      }
    }
    if (isRect) {
      const isBackgroundRect = child.name() === 'background-rect'
      if (isBackgroundRect) {
        returnToPool(pools.backgroundRects, child)
      }
      const isMergedCellRect = child.name() === 'merged-cell-rect'
      if (isMergedCellRect) {
        returnToPool(pools.mergedCellRects, child)
      }

      const isCellRect = child.name() === 'cell-rect'
      if (isCellRect) {
        returnToPool(pools.cellRects, child)
      }
    }
  })
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
