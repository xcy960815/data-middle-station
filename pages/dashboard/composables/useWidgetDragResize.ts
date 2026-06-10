import type { Ref } from 'vue'
import type { DashboardWidgetState, ResizeHandle } from './useDashboard'

/**
 * Composable for widget drag/resize interactions and grid layout calculations.
 * Manages the canvas resize observer, grid coordinate math, and pointer-based
 * drag and resize event handlers for dashboard widgets.
 *
 * @param options.widgets - Reactive array of widget states
 * @param options.editorMode - Whether the dashboard is in edit mode
 * @param options.canvasRef - Template ref to the scrollable canvas element
 * @param options.gridColumns - Total number of grid columns
 * @param options.rowHeight - Height of a single grid row in pixels
 * @param options.gridGap - Gap between grid cells in pixels
 * @param options.minWidgetWidth - Minimum widget width in grid columns
 * @param options.minWidgetHeight - Minimum widget height in grid rows
 * @param options.canvasHorizontalPadding - Per-side horizontal inset inside the canvas in pixels
 * @param options.canvasBottomSpace - Extra scrollable space below the last widget row in pixels
 */
export function useWidgetDragResize(options: {
  widgets: Ref<DashboardWidgetState[]>
  editorMode: Ref<boolean>
  canvasRef: Ref<HTMLElement | null>
  gridColumns: number
  rowHeight: number
  gridGap: number
  minWidgetWidth: number
  minWidgetHeight: number
  canvasHorizontalPadding: number
  canvasBottomSpace: number
}) {
  // --- State ---
  const canvasWidth = ref(0)
  const resizeObserver = ref<ResizeObserver>()
  const resizeHandles: ResizeHandle[] = ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw']

  // --- Computed ---
  const columnWidth = computed(() => {
    const horizontalInset = options.canvasHorizontalPadding
    const usableWidth = Math.max(1, (canvasWidth.value || 1) - horizontalInset * 2)
    return (usableWidth - options.gridGap * (options.gridColumns - 1)) / options.gridColumns
  })

  const canvasContentBottom = computed(() => {
    const maxBottom = options.widgets.value.length
      ? Math.max(...options.widgets.value.map((widget) => widget.y + widget.h))
      : 0
    return maxBottom * (options.rowHeight + options.gridGap)
  })

  // --- Functions ---

  const getWidgetStyle = (widget: DashboardWidgetState) => {
    const left = options.canvasHorizontalPadding + widget.x * (columnWidth.value + options.gridGap)
    const top = widget.y * (options.rowHeight + options.gridGap)
    const width = widget.w * columnWidth.value + (widget.w - 1) * options.gridGap
    const height = widget.h * options.rowHeight + (widget.h - 1) * options.gridGap
    return {
      transform: `translate(${left}px, ${top}px)`,
      width: `${width}px`,
      height: `${height}px`
    }
  }

  const getCanvasSpacerStyle = () => {
    return {
      top: `${canvasContentBottom.value}px`,
      height: `${options.canvasBottomSpace}px`
    }
  }

  const handleWidgetMoveStart = (event: PointerEvent, widget: DashboardWidgetState) => {
    if (!options.editorMode.value) return
    event.preventDefault()
    const startX = event.clientX
    const startY = event.clientY
    const startGridX = widget.x
    const startGridY = widget.y

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      const nextX = startGridX + Math.round(deltaX / (columnWidth.value + options.gridGap))
      const nextY = startGridY + Math.round(deltaY / (options.rowHeight + options.gridGap))
      widget.x = Math.min(options.gridColumns - widget.w, Math.max(0, nextX))
      widget.y = Math.max(0, nextY)
    }

    const handleEnd = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
  }

  const handleWidgetResizeStart = (event: PointerEvent, widget: DashboardWidgetState, handle: ResizeHandle) => {
    if (!options.editorMode.value) return
    event.preventDefault()
    event.stopPropagation()
    const startX = event.clientX
    const startY = event.clientY
    const startGridX = widget.x
    const startGridY = widget.y
    const startW = widget.w
    const startH = widget.h
    const startRight = startGridX + startW
    const startBottom = startGridY + startH

    const handleMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX
      const deltaY = moveEvent.clientY - startY
      const deltaGridX = Math.round(deltaX / (columnWidth.value + options.gridGap))
      const deltaGridY = Math.round(deltaY / (options.rowHeight + options.gridGap))
      let nextX = startGridX
      let nextY = startGridY
      let nextRight = startRight
      let nextBottom = startBottom

      if (handle.includes('e')) {
        nextRight = Math.min(
          options.gridColumns,
          Math.max(startGridX + options.minWidgetWidth, startRight + deltaGridX)
        )
      }

      if (handle.includes('w')) {
        nextX = Math.min(startRight - options.minWidgetWidth, Math.max(0, startGridX + deltaGridX))
      }

      if (handle.includes('s')) {
        nextBottom = Math.max(startGridY + options.minWidgetHeight, startBottom + deltaGridY)
      }

      if (handle.includes('n')) {
        nextY = Math.min(startBottom - options.minWidgetHeight, Math.max(0, startGridY + deltaGridY))
      }

      widget.x = nextX
      widget.y = nextY
      widget.w = nextRight - nextX
      widget.h = nextBottom - nextY
    }

    const handleEnd = () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleEnd)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleEnd)
  }

  const getDropGridPosition = (event: DragEvent) => {
    if (!options.canvasRef.value) return getNextWidgetPosition()
    const canvasRect = options.canvasRef.value.getBoundingClientRect()
    const pointerX =
      event.clientX - canvasRect.left + options.canvasRef.value.scrollLeft - options.canvasHorizontalPadding
    const pointerY = event.clientY - canvasRect.top + options.canvasRef.value.scrollTop
    const gridX = Math.round(pointerX / (columnWidth.value + options.gridGap))
    const gridY = Math.round(pointerY / (options.rowHeight + options.gridGap))
    return {
      x: Math.min(options.gridColumns - 8, Math.max(0, gridX)),
      y: Math.max(0, gridY)
    }
  }

  const getNextWidgetPosition = () => {
    if (options.widgets.value.length === 0) return { x: 0, y: 0 }
    const maxBottom = Math.max(...options.widgets.value.map((widget) => widget.y + widget.h))
    return { x: 0, y: maxBottom }
  }

  const updateCanvasWidth = () => {
    canvasWidth.value = options.canvasRef.value?.clientWidth || 0
  }

  // --- Lifecycle ---
  onMounted(() => {
    resizeObserver.value = new ResizeObserver(updateCanvasWidth)
    if (options.canvasRef.value) {
      resizeObserver.value.observe(options.canvasRef.value)
    }
  })

  watch(
    () => options.canvasRef.value,
    (element) => {
      resizeObserver.value?.disconnect()
      resizeObserver.value = new ResizeObserver(updateCanvasWidth)
      if (element) {
        resizeObserver.value.observe(element)
        updateCanvasWidth()
      }
    }
  )

  onUnmounted(() => {
    resizeObserver.value?.disconnect()
  })

  return {
    canvasWidth,
    resizeObserver,
    resizeHandles,
    columnWidth,
    canvasContentBottom,
    getWidgetStyle,
    getCanvasSpacerStyle,
    handleWidgetMoveStart,
    handleWidgetResizeStart,
    getDropGridPosition,
    getNextWidgetPosition,
    updateCanvasWidth
  }
}
