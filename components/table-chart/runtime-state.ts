import Konva from 'konva'
import { ref, type Ref } from 'vue'
import CellEditor from './components/cell-editor.vue'
import FilterDropdown from './components/filter-dropdown.vue'
import SummaryDropdown from './components/summary-dropdown.vue'
import type { KonvaNodePools } from './utils'

export interface StageState {
  stage: Konva.Stage | null
}

export interface BodyState {
  leftBodyPools: KonvaNodePools
  centerBodyPools: KonvaNodePools
  rightBodyPools: KonvaNodePools
  bodyLayer: Konva.Layer | null
  fixedBodyLayer: Konva.Layer | null
  leftBodyGroup: Konva.Group | null
  centerBodyGroup: Konva.Group | null
  rightBodyGroup: Konva.Group | null
  highlightRect: Konva.Rect | null
  visibleRowStart: number
  visibleRowEnd: number
  visibleRowCount: number
}

export interface ColumnsInfo {
  leftColumns: CanvasTable.ColumnOption[]
  centerColumns: CanvasTable.ColumnOption[]
  rightColumns: CanvasTable.ColumnOption[]
  leftPartWidth: number
  centerPartWidth: number
  rightPartWidth: number
  totalWidth: number
}

export interface HeaderState {
  headerLayer: Konva.Layer | null
  leftHeaderGroup: Konva.Group | null
  centerHeaderGroup: Konva.Group | null
  rightHeaderGroup: Konva.Group | null
  isResizingColumn: boolean
  resizingColumnName: string | null
  resizeStartX: number
  resizeStartWidth: number
  resizeTempWidth: number
  resizeIndicatorLine: Konva.Line | null
  isDraggingColumn: boolean
  draggingColumnName: string | null
  dragStartX: number
  dragStartWidth: number
  dragTempWidth: number
  dragDropIndicator: Konva.Rect | null
}

export interface ScrollState {
  stageScrollY: number
  stageScrollX: number
}

export interface SummaryState {
  summaryLayer: Konva.Layer | null
  leftSummaryGroup: Konva.Group | null
  centerSummaryGroup: Konva.Group | null
  rightSummaryGroup: Konva.Group | null
}

export interface SortColumn {
  columnName: string
  order: 'asc' | 'desc'
}

export interface FilterItem {
  columnName: string
  values: Set<string>
}

export interface DataState {
  uniqueColumnValuesCache: Map<string, string[]>
  lastRawDataRef: Array<AnalyzeDataVo.AnalyzeData> | null
  lastRawDataLength: number
  originalData: Array<AnalyzeDataVo.AnalyzeData>
  filterColumns: FilterItem[]
  sortColumns: SortColumn[]
}

export interface CanvasTableRuntimeState {
  stage: StageState
  body: BodyState
  columns: ColumnsInfo
  header: HeaderState
  scroll: ScrollState
  summary: SummaryState
  data: DataState
  summaryRules: Record<string, string>
  cellEditorRef: Ref<InstanceType<typeof CellEditor> | null>
  filterDropdownRef: Ref<InstanceType<typeof FilterDropdown> | null>
  summaryDropdownRef: Ref<InstanceType<typeof SummaryDropdown> | null>
  listeners: {
    resizeObserver: ResizeObserver | null
    mouseMove: ((event: MouseEvent) => void) | null
    mouseUp: ((event: MouseEvent) => void) | null
  }
  scrollProxyResetHandler: (() => void) | null
}

const createNodePools = (): KonvaNodePools => ({
  cellRects: [],
  cellTexts: []
})

const createBodyState = (): BodyState => ({
  leftBodyPools: createNodePools(),
  centerBodyPools: createNodePools(),
  rightBodyPools: createNodePools(),
  bodyLayer: null,
  fixedBodyLayer: null,
  leftBodyGroup: null,
  centerBodyGroup: null,
  rightBodyGroup: null,
  highlightRect: null,
  visibleRowStart: 0,
  visibleRowEnd: 0,
  visibleRowCount: 0
})

const createColumnsInfo = (): ColumnsInfo => ({
  leftColumns: [],
  centerColumns: [],
  rightColumns: [],
  leftPartWidth: 0,
  centerPartWidth: 0,
  rightPartWidth: 0,
  totalWidth: 0
})

const createHeaderState = (): HeaderState => ({
  headerLayer: null,
  leftHeaderGroup: null,
  centerHeaderGroup: null,
  rightHeaderGroup: null,
  isResizingColumn: false,
  resizingColumnName: null,
  resizeStartX: 0,
  resizeStartWidth: 0,
  resizeTempWidth: 0,
  resizeIndicatorLine: null,
  isDraggingColumn: false,
  draggingColumnName: null,
  dragStartX: 0,
  dragStartWidth: 0,
  dragTempWidth: 0,
  dragDropIndicator: null
})

const createScrollState = (): ScrollState => ({
  stageScrollY: 0,
  stageScrollX: 0
})

const createSummaryState = (): SummaryState => ({
  summaryLayer: null,
  leftSummaryGroup: null,
  centerSummaryGroup: null,
  rightSummaryGroup: null
})

const createDataState = (): DataState => ({
  uniqueColumnValuesCache: new Map<string, string[]>(),
  lastRawDataRef: null,
  lastRawDataLength: 0,
  originalData: [],
  filterColumns: [],
  sortColumns: []
})

export const createCanvasTableRuntimeState = (): CanvasTableRuntimeState => ({
  stage: {
    stage: null
  },
  body: createBodyState(),
  columns: createColumnsInfo(),
  header: createHeaderState(),
  scroll: createScrollState(),
  summary: createSummaryState(),
  data: createDataState(),
  summaryRules: {},
  cellEditorRef: ref(null),
  filterDropdownRef: ref(null),
  summaryDropdownRef: ref(null),
  listeners: {
    resizeObserver: null,
    mouseMove: null,
    mouseUp: null
  },
  scrollProxyResetHandler: null
})
