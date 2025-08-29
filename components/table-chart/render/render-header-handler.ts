import Konva from 'konva'
import { filterDropdownHandler } from '../dropdown/filter-dropdown-handler'
import { konvaStageHandler } from '../konva-stage-handler'
import type { chartProps } from '../props'
import { getTextX, setPointerStyle, truncateText } from '../utils'
import type { PositionMap, Prettify } from '../variable-handlder'
import { tableVars, variableHandlder } from '../variable-handlder'
interface RenderHeaderHandlerProps {
  props: Prettify<Readonly<ExtractPropTypes<typeof chartProps>>>
}

export const renderHeaderHandler = ({ props }: RenderHeaderHandlerProps) => {
  const { openFilterDropdown } = filterDropdownHandler({ props })
  // const { rebuildGroups } = konvaStageHandler({ props })
  const { sortColumns, tableData, handleTableData, filterState } = variableHandlder({ props })
  const { clearGroups } = konvaStageHandler({ props })

  const drawHeaderPart = (
    headerGroup: Konva.Group | null,
    headerCols: Array<GroupStore.GroupOption | DimensionStore.DimensionOption>,
    startColIndex: number,
    positionMapList: PositionMap[],
    stageStartX: number
  ) => {
    if (!headerGroup) return
    let x = 0
    headerCols.forEach((col, colIndex) => {
      const headerCellRect = new Konva.Rect({
        x,
        y: 0,
        name: 'header-cell-rect',
        width: col.width || 0,
        height: props.headerHeight,
        stroke: props.borderColor,
        strokeWidth: 1,
        listening: false
      })
      headerCellRect.setAttr('col-index', colIndex + startColIndex)
      headerCellRect.setAttr('row-index', 0)
      headerCellRect.setAttr('origin-fill', props.headerBackground)
      headerGroup.add(headerCellRect)
      // 记录表头单元格位置信息（使用舞台坐标）
      positionMapList.push({
        x: stageStartX + x,
        y: 0,
        width: col.width || 0,
        height: props.headerHeight,
        rowIndex: 0,
        colIndex: colIndex + startColIndex
      })

      // 如果该列当前参与排序，则给表头单元格一个高亮背景（多列排序）
      const isSortColumn = sortColumns.value.find((s) => s.columnName === col.columnName)
      headerCellRect.fill(isSortColumn ? props.headerSortActiveBackground : props.headerBackground)

      // 预留右侧区域（排序箭头 + 过滤图标），避免与文本重叠
      // 预留约 40px 给右侧图标
      const maxTextWidth = (col.width || 0) - 40
      const fontFamily = props.headerFontFamily
      const fontSize =
        typeof props.headerFontSize === 'string' ? parseFloat(props.headerFontSize) : props.headerFontSize
      const displayName = col.displayName || col.columnName
      const truncatedTitle = truncateText(displayName, maxTextWidth, fontSize, fontFamily)
      const headerCellText = new Konva.Text({
        x: getTextX(x),
        y: props.headerHeight / 2,
        text: truncatedTitle,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: props.headerTextColor,
        align: col.align || 'left',
        verticalAlign: 'middle',
        listening: false
      })
      headerCellText.offsetY(headerCellText.height() / 2)
      headerGroup.add(headerCellText)

      const centerY = props.headerHeight / 2

      // 如果用户当前列开启排序
      if (col.sortable) {
        // 排序箭头（三角形 ▲/▼），更紧凑与清晰（多列排序）
        const foundSort = sortColumns.value.find((s) => s.columnName === col.columnName)
        const inactiveColor = '#C0C4CC'
        const upColor = foundSort?.order === 'asc' ? props.sortableColor : inactiveColor
        const downColor = foundSort?.order === 'desc' ? props.sortableColor : inactiveColor

        // 右侧预留区域：排序箭头 + 过滤图标（加大横向间距）
        const arrowX = x + (col.width || 0) - 34

        const arrowSize = 5
        const gap = 2
        // 上三角（升序 asc）
        const upTriangle = new Konva.RegularPolygon({
          x: arrowX,
          y: centerY - (arrowSize + gap) / 2,
          sides: 3,
          radius: arrowSize,
          rotation: 0,
          fill: upColor,
          listening: true
        })
        // 下三角（降序 desc）
        const downTriangle = new Konva.RegularPolygon({
          x: arrowX,
          y: centerY + (arrowSize + gap) / 2,
          sides: 3,
          radius: arrowSize,
          rotation: 180,
          fill: downColor,
          listening: true
        })
        headerGroup.add(upTriangle)
        headerGroup.add(downTriangle)

        // 排序箭头也显示小手
        upTriangle.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
        upTriangle.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))
        downTriangle.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
        downTriangle.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))

        // 排序箭头点击事件：只在点击箭头时触发排序
        const handleSortClick = (event: Konva.KonvaEventObject<MouseEvent>, order: 'asc' | 'desc') => {
          if (tableVars.isResizingColumn) return
          const e = event.evt
          const hasModifier = !!(e && (e.shiftKey || e.ctrlKey || e.metaKey))
          const idx = sortColumns.value.findIndex((s) => s.columnName === col.columnName)
          if (hasModifier) {
            // 多列模式：在原序列中追加/切换/移除该列
            if (idx === -1) {
              sortColumns.value = [...sortColumns.value, { columnName: col.columnName, order }]
            } else {
              const next = [...sortColumns.value]
              if (next[idx].order === order) {
                // 如果点击的是相同顺序，则移除该列
                next.splice(idx, 1)
              } else {
                // 否则切换到新顺序
                next[idx] = { columnName: col.columnName, order }
              }
              sortColumns.value = next
            }
            handleTableData(props.data)
          } else {
            // 单列模式：仅对当前列循环 asc -> desc -> remove
            if (idx === -1) {
              sortColumns.value = [{ columnName: col.columnName, order }]
            } else if (sortColumns.value[idx].order === order) {
              // 如果点击的是相同顺序，则移除该列
              sortColumns.value = []
            } else {
              // 否则切换到新顺序
              sortColumns.value = [{ columnName: col.columnName, order }]
            }
            handleTableData(props.data)
          }
          clearGroups()
          // rebuildGroups()
        }

        // 升序事件（点击箭头）
        upTriangle.on('click', (evt) => handleSortClick(evt, 'asc'))
        // 降序事件（点击箭头）
        downTriangle.on('click', (evt) => handleSortClick(evt, 'desc'))
      }

      // 如果用户当前列开启过滤
      if (col.filterable) {
        const hasFilter = !!(filterState[col.columnName] && filterState[col.columnName].size > 0)
        const filterColor = hasFilter ? props.sortableColor : '#C0C4CC'
        const filterX = x + (col.width || 0) - 12
        // 绘制过滤器图标（漏斗形状）
        const filterIcon = new Konva.Shape({
          x: filterX - 6,
          y: centerY - 6,
          width: 16,
          height: 16,
          listening: true,
          name: `filter-icon-${col.columnName}`,
          sceneFunc: (context, shape) => {
            context.beginPath()
            // 漏斗上边缘（宽）
            context.moveTo(2, 2)
            context.lineTo(14, 2)
            // 漏斗中间收缩部分
            context.lineTo(11, 7)
            context.lineTo(11, 12)
            // 漏斗下边缘（窄）
            context.lineTo(5, 12)
            context.lineTo(5, 7)
            context.closePath()

            context.fillStrokeShape(shape)
          },
          stroke: filterColor,
          strokeWidth: 1.5,
          fill: hasFilter ? filterColor : 'transparent'
        })
        // 鼠标进入图标时，显示手型
        filterIcon.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'pointer'))
        // 鼠标离开图标时，恢复默认指针
        filterIcon.on('mouseleave', () => setPointerStyle(tableVars.stage, false, 'default'))

        headerGroup.add(filterIcon)

        // 点击图标：以 DOM 下拉框方式展示可选值
        filterIcon.on('click', (evt) => {
          const values = new Set<string>()
          tableData.value.forEach((r) => values.add(String(r[col.columnName] ?? '')))
          const options = Array.from(values)
          const current = filterState[col.columnName] ? Array.from(filterState[col.columnName]!) : []
          const optionUnion = Array.from(new Set<string>([...options, ...current]))
          openFilterDropdown(evt, col.columnName, optionUnion, current)
        })
      }

      // 列宽拖拽手柄（位于单元格右边缘，优先响应）
      const RESIZER_WIDTH = 6
      const resizer = new Konva.Rect({
        x: x + (col.width || 0) - RESIZER_WIDTH / 2,
        y: 0,
        width: RESIZER_WIDTH,
        height: props.headerHeight,
        fill: 'transparent',
        listening: true,
        draggable: false,
        name: `col-resizer-${col.columnName}`
      })
      headerGroup.add(resizer)

      resizer.on('mouseenter', () => setPointerStyle(tableVars.stage, true, 'col-resize'))
      resizer.on('mouseleave', () => {
        if (!tableVars.isResizingColumn) setPointerStyle(tableVars.stage, false, 'default')
      })
      // 鼠标按下时，开始拖拽列宽
      resizer.on('mousedown', (evt) => {
        tableVars.isResizingColumn = true
        tableVars.resizingColumnName = col.columnName
        tableVars.resizeStartX = evt.evt.clientX
        tableVars.resizeStartWidth = col.width || 0
        // 找到同组内紧随其后的列，作为跟随调整的邻居列
        const neighbor = headerCols[colIndex + 1]
        if (neighbor) {
          tableVars.resizeNeighborColumnName = neighbor.columnName
          tableVars.resizeNeighborStartWidth = neighbor.width || 0
        } else {
          tableVars.resizeNeighborColumnName = null
          tableVars.resizeNeighborStartWidth = 0
        }
        setPointerStyle(tableVars.stage, true, 'col-resize')
      })

      x += col.width || 0
    })
  }

  return {
    drawHeaderPart
  }
}
