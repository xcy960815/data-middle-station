import Konva from 'konva'
import { chartProps } from './props'
import type { Prettify } from './variable'
import { tableVars } from './variable'

interface HighlightHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}
export const highlightHandler = ({ props }: HighlightHandlerProps) => {
  /**
   * 清除所有高亮效果
   * @param type 类型：row 行，column 列
   * @returns {void}
   */
  const resetHighlightRects = (type: 'row' | 'column') => {
    if (!tableVars.stage) return
    if (type === 'row') {
      tableVars.rowHighlightRects?.forEach((rect) => {
        rect.fill(null)
      })
      tableVars.rowHighlightRects = null
    } else {
      tableVars.colHighlightRects?.forEach((rect) => {
        rect.fill(null)
      })
      tableVars.colHighlightRects = null
    }
  }
  /**
   * 获取指定行需要高亮的所有矩形
   * @param rowIndex 行索引
   * @returns 矩形数组
   */
  const getColOrRowHighlightRects = (type: 'row' | 'column', index: number) => {
    // 初始化高亮矩形数组
    if (type === 'row') {
      if (!tableVars.rowHighlightRects) tableVars.rowHighlightRects = []
    } else {
      if (!tableVars.colHighlightRects) tableVars.colHighlightRects = []
    }

    const allGroups = [
      tableVars.leftHeaderGroup,
      tableVars.centerHeaderGroup,
      tableVars.rightHeaderGroup,
      tableVars.leftBodyGroup,
      tableVars.centerBodyGroup,
      tableVars.rightBodyGroup,
      tableVars.leftSummaryGroup,
      tableVars.centerSummaryGroup,
      tableVars.rightSummaryGroup
    ]
    allGroups.forEach((group) => {
      if (!group) return
      group.children.forEach((child) => {
        if (!(child instanceof Konva.Rect)) return
        // 排除非单元格矩形：行背景与操作按钮
        const nodeName = child.name?.() || ''
        if (nodeName === 'background-rect' || nodeName === 'action-button' || nodeName.startsWith?.('action-button-'))
          return
        if (type === 'row') {
          // 检查行索引
          const attr = child.getAttr('row-index')
          if (typeof attr === 'number' && attr === index) {
            // 避免重复添加
            if (!tableVars.rowHighlightRects!.includes(child)) {
              tableVars.rowHighlightRects!.push(child)
            }
          }
        } else {
          // 检查列索引
          const attr = child.getAttr('col-index')
          if (typeof attr === 'number' && attr === index) {
            // 避免重复添加
            if (!tableVars.colHighlightRects!.includes(child)) {
              tableVars.colHighlightRects!.push(child)
            }
          }
        }
      })
    })

    // 应用高亮效果
    applyHighlightToAllRects()
  }
  /**
   * 应用高亮效果到所有相关矩形
   */
  const applyHighlightToAllRects = () => {
    // 首先处理行高亮
    if (tableVars.rowHighlightRects) {
      tableVars.rowHighlightRects.forEach((rect) => {
        rect.fill(props.highlightRowBackground)
      })
    }

    // 然后处理列高亮
    if (tableVars.colHighlightRects) {
      tableVars.colHighlightRects.forEach((rect) => {
        rect.fill(props.highlightColBackground)
      })
    }

    // 最后处理交叉矩形：找到既在行高亮数组又在列高亮数组的矩形
    if (
      tableVars.rowHighlightRects &&
      tableVars.colHighlightRects &&
      tableVars.hoveredRowIndex !== null &&
      tableVars.hoveredColIndex !== null
    ) {
      // 寻找交叉矩形：同时具有当前行和列索引的矩形
      const allGroups = [
        tableVars.leftHeaderGroup,
        tableVars.centerHeaderGroup,
        tableVars.rightHeaderGroup,
        tableVars.leftBodyGroup,
        tableVars.centerBodyGroup,
        tableVars.rightBodyGroup,
        tableVars.leftSummaryGroup,
        tableVars.centerSummaryGroup,
        tableVars.rightSummaryGroup
      ]

      allGroups.forEach((group) => {
        if (!group) return
        group.children.forEach((child) => {
          if (!(child instanceof Konva.Rect)) return
          const rowAttr = child.getAttr('row-index')
          const colAttr = child.getAttr('col-index')

          // 如果这个矩形是交叉矩形（同时具有当前行和列索引）
          if (
            typeof rowAttr === 'number' &&
            typeof colAttr === 'number' &&
            rowAttr === tableVars.hoveredRowIndex &&
            colAttr === tableVars.hoveredColIndex
          ) {
            // 使用交叉高亮颜色（这里可以设计一个混合色或者使用列高亮色）
            child.fill(props.highlightColBackground)
          }
        })
      })
    }
  }
  return {
    resetHighlightRects,
    getColOrRowHighlightRects
  }
}
