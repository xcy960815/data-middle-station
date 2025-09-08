// import Konva from 'konva'
// import { chartProps } from '../props'
// import type { Prettify } from '../variable-handlder'
// import { variableHandlder } from '../variable-handlder'

// interface HighlightHandlerProps {
//   props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
// }
// export const highlightHandler = ({ props }: HighlightHandlerProps) => {
//   const { tableVars } = variableHandlder({ props })
//   /**
//    * 收集所有需要参与高亮判断的分组
//    */
//   const getAllGroups = () =>
//     [
//       tableVars.leftHeaderGroup,
//       tableVars.centerHeaderGroup,
//       tableVars.rightHeaderGroup,
//       tableVars.leftBodyGroup,
//       tableVars.centerBodyGroup,
//       tableVars.rightBodyGroup,
//       tableVars.leftSummaryGroup,
//       tableVars.centerSummaryGroup,
//       tableVars.rightSummaryGroup
//     ].filter(Boolean) as Konva.Group[]

//   /**
//    * 清除所有高亮效果
//    * @param type 类型：row 行，column 列
//    * @returns {void}
//    */
//   const resetHighlightRects = (type: 'row' | 'column') => {
//     if (!tableVars.stage) return
//     if (type === 'row') {
//       tableVars.rowHighlightRects?.forEach((rect) => {
//         const originFill = rect.getAttr('origin-fill')
//         rect.fill(originFill)
//       })
//       tableVars.rowHighlightRects = null
//     } else {
//       tableVars.colHighlightRects?.forEach((rect) => {
//         const originFill = rect.getAttr('origin-fill')
//         rect.fill(originFill)
//       })
//       tableVars.colHighlightRects = null
//     }
//   }
//   /**
//    * 获取指定行需要高亮的所有矩形
//    * @param rowIndex 行索引
//    * @returns 矩形数组
//    */
//   const getColOrRowHighlightRects = (type: 'row' | 'column', index: number) => {
//     // 初始化高亮矩形数组与去重集合
//     if (type === 'row') {
//       if (!tableVars.rowHighlightRects) tableVars.rowHighlightRects = []
//       const seen = new Set<Konva.Rect>(tableVars.rowHighlightRects)
//       getAllGroups().forEach((group) => {
//         group.children.forEach((child) => {
//           if (!(child instanceof Konva.Rect)) return
//           const originFill = child.getAttr('origin-fill')
//           if (originFill === undefined) return
//           if (type === 'row') {
//             const attr = child.getAttr('row-index')
//             if (typeof attr === 'number' && attr === index && !seen.has(child)) {
//               tableVars.rowHighlightRects!.push(child)
//               seen.add(child)
//             }
//           }
//         })
//       })
//     } else {
//       if (!tableVars.colHighlightRects) tableVars.colHighlightRects = []
//       const seen = new Set<Konva.Rect>(tableVars.colHighlightRects)
//       getAllGroups().forEach((group) => {
//         group.children.forEach((child) => {
//           if (!(child instanceof Konva.Rect)) return
//           const originFill = child.getAttr('origin-fill')
//           if (originFill === undefined) return
//           const attr = child.getAttr('col-index')
//           if (typeof attr === 'number' && attr === index && !seen.has(child)) {
//             tableVars.colHighlightRects!.push(child)
//             seen.add(child)
//           }
//         })
//       })
//     }

//     // 应用高亮效果
//     applyHighlightToAllRects()
//   }
//   /**
//    * 应用高亮效果到所有相关矩形
//    */
//   const applyHighlightToAllRects = () => {
//     // 先行后列：列色覆盖交叉区域
//     if (tableVars.rowHighlightRects) {
//       tableVars.rowHighlightRects.forEach((rect) => {
//         rect.fill(props.highlightRowBackground)
//       })
//     }
//     if (tableVars.colHighlightRects) {
//       tableVars.colHighlightRects.forEach((rect) => {
//         rect.fill(props.highlightColBackground)
//       })
//     }
//   }

//   /**
//    * 更新行和列的 hover 高亮矩形
//    */
//   const updateHoverRects = () => {
//     resetHighlightRects('row')
//     // 清除之前的高亮
//     resetHighlightRects('column')
//     // 根据配置和当前悬停状态创建高亮效果
//     if (props.enableRowHoverHighlight && tableVars.hoveredRowIndex !== null) {
//       // 清除之前的高亮
//       getColOrRowHighlightRects('row', tableVars.hoveredRowIndex)
//     }
//     if (props.enableColHoverHighlight && tableVars.hoveredColIndex !== null) {
//       getColOrRowHighlightRects('column', tableVars.hoveredColIndex)
//     }
//   }

//   return {
//     resetHighlightRects,
//     getColOrRowHighlightRects,
//     updateHoverRects
//   }
// }
