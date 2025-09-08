import Konva from 'konva'
import { chartProps } from '../props'
import type { Prettify } from '../variable-handlder'
import { variableHandlder } from '../variable-handlder'

interface HighlightHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}
export const highlightHandler = ({ props }: HighlightHandlerProps) => {
  const { tableVars } = variableHandlder({ props })

  // 缓存高亮矩形的索引映射，避免重复遍历
  const rowHighlightCache = new Map<number, Konva.Rect[]>()
  const colHighlightCache = new Map<number, Konva.Rect[]>()
  let cacheVersion = 0 // 版本号，用于判断缓存是否过期
  /**
   * 收集所有需要参与高亮判断的分组
   */
  const getAllGroups = () =>
    [
      tableVars.leftHeaderGroup,
      tableVars.centerHeaderGroup,
      tableVars.rightHeaderGroup,
      tableVars.leftBodyGroup,
      tableVars.centerBodyGroup,
      tableVars.rightBodyGroup,
      tableVars.leftSummaryGroup,
      tableVars.centerSummaryGroup,
      tableVars.rightSummaryGroup
    ].filter(Boolean) as Konva.Group[]

  /**
   * 清除所有高亮效果
   * @param type 类型：row 行，column 列
   * @returns {void}
   */
  const resetHighlightRects = (type: 'row' | 'column') => {
    if (!tableVars.stage) return
    if (type === 'row') {
      tableVars.rowHighlightRects?.forEach((rect) => {
        const originFill = rect.getAttr('origin-fill')
        rect.fill(originFill)
      })
      tableVars.rowHighlightRects = null
    } else {
      tableVars.colHighlightRects?.forEach((rect) => {
        const originFill = rect.getAttr('origin-fill')
        rect.fill(originFill)
      })
      tableVars.colHighlightRects = null
    }
  }
  /**
   * 清空高亮缓存（在表格重渲染时调用）
   */
  const invalidateHighlightCache = () => {
    rowHighlightCache.clear()
    colHighlightCache.clear()
    cacheVersion++
  }

  /**
   * 优化的获取指定行/列高亮矩形（使用缓存）
   * @param type 类型：row 行，column 列
   * @param index 索引
   * @returns 矩形数组
   */
  const getColOrRowHighlightRects = (type: 'row' | 'column', index: number) => {
    const cache = type === 'row' ? rowHighlightCache : colHighlightCache

    // 检查缓存
    if (cache.has(index)) {
      const cachedRects = cache.get(index)!
      // 验证缓存的矩形是否仍然有效（检查是否在DOM中）
      const validRects = cachedRects.filter((rect) => {
        try {
          // 检查节点是否仍在父级中
          return rect.getParent() !== null
        } catch {
          return false
        }
      })
      if (validRects.length === cachedRects.length) {
        // 缓存有效，直接使用
        if (type === 'row') {
          tableVars.rowHighlightRects = validRects
        } else {
          tableVars.colHighlightRects = validRects
        }
        applyHighlightToAllRects()
        return
      } else {
        // 缓存部分失效，清除
        cache.delete(index)
      }
    }

    // 缓存未命中或失效，重新计算
    const rects: Konva.Rect[] = []
    const seen = new Set<Konva.Rect>()

    getAllGroups().forEach((group) => {
      group.children.forEach((child) => {
        if (!(child instanceof Konva.Rect)) return
        const originFill = child.getAttr('origin-fill')
        if (originFill === undefined) return

        const attrName = type === 'row' ? 'row-index' : 'col-index'
        const attr = child.getAttr(attrName)
        if (typeof attr === 'number' && attr === index && !seen.has(child)) {
          rects.push(child)
          seen.add(child)
        }
      })
    })

    // 更新缓存
    cache.set(index, rects)

    // 更新全局变量
    if (type === 'row') {
      tableVars.rowHighlightRects = rects
    } else {
      tableVars.colHighlightRects = rects
    }

    // 应用高亮效果
    applyHighlightToAllRects()
  }
  /**
   * 应用高亮效果到所有相关矩形
   */
  const applyHighlightToAllRects = () => {
    // 先行后列：列色覆盖交叉区域
    if (tableVars.rowHighlightRects) {
      tableVars.rowHighlightRects.forEach((rect) => {
        rect.fill(props.highlightRowBackground)
      })
    }
    if (tableVars.colHighlightRects) {
      tableVars.colHighlightRects.forEach((rect) => {
        rect.fill(props.highlightColBackground)
      })
    }
  }

  /**
   * 更新行和列的 hover 高亮矩形
   */
  const updateHoverRects = () => {
    resetHighlightRects('row')
    // 清除之前的高亮
    resetHighlightRects('column')
    // 注释高亮功能以提升性能
    // if (props.enableRowHoverHighlight && tableVars.hoveredRowIndex !== null) {
    //   // 清除之前的高亮
    //   getColOrRowHighlightRects('row', tableVars.hoveredRowIndex)
    // }
    // if (props.enableColHoverHighlight && tableVars.hoveredColIndex !== null) {
    //   getColOrRowHighlightRects('column', tableVars.hoveredColIndex)
    // }
  }

  return {
    resetHighlightRects,
    getColOrRowHighlightRects,
    updateHoverRects,
    invalidateHighlightCache
  }
}
