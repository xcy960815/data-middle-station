import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { DefineComponent } from 'vue'
import type { AnalyzeDataVo } from '~/types/domain/vo/AnalyzeDataVo'

interface EditOptions {
  label: string
  value: string | number
}

interface EditContext {
  row: AnalyzeDataVo.AnalyzeData
  columnName: string
  columnType?: string | null
}

declare const Component: DefineComponent<
  {},
  {
    openEditor: (
      evt: KonvaEventObject<MouseEvent, Konva.Rect>,
      editType: 'input' | 'select' | 'date' | 'datetime',
      initialValue: AnalyzeDataVo.AnalyzeData[keyof AnalyzeDataVo.AnalyzeData],
      editOptions?: EditOptions[],
      styleOptions?: {
        align: 'left' | 'center' | 'right'
        fontSize: number
        fontFamily: string
        padding: number
      },
      editContext?: EditContext
    ) => void
    closeEditor: () => void
    updatePositions: () => void
  },
  {}
>

export default Component
