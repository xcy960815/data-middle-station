import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { DefineComponent } from 'vue'
import type { ChartDataVo } from '~/types/domain/vo/ChartDataVo'

interface EditOptions {
  label: string
  value: string | number
}

declare const Component: DefineComponent<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>
> & {
  openEditor: (
    evt: KonvaEventObject<MouseEvent, Konva.Rect>,
    editType: 'input' | 'select' | 'date' | 'datetime',
    initialValue: ChartDataVo.ChartData[keyof ChartDataVo.ChartData],
    editOptions?: EditOptions[]
  ) => void
  closeEditor: () => void
  updatePositions: () => void
}

export default Component
