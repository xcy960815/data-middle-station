import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { DefineComponent } from 'vue'
import type { AnalyzeDataVo } from '~/types/domain/vo/AnalyzeDataVo'

interface EditOptions {
  label: string
  value: string | number
}

declare const Component: DefineComponent<
  {},
  {
    openEditor: (
      evt: KonvaEventObject<MouseEvent, Konva.Rect>,
      editType: 'input' | 'select' | 'date' | 'datetime',
      initialValue: AnalyzeDataVo.ChartData[keyof AnalyzeDataVo.ChartData],
      editOptions?: EditOptions[]
    ) => void
    closeEditor: () => void
    updatePositions: () => void
  },
  any
>

export default Component
