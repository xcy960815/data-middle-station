import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  Record<string, never>,
  {
    'update-positions-in-table': []
  }
> & {
  openFilterDropdown: (
    event: KonvaEventObject<MouseEvent, Konva.Shape>,
    colName: string,
    options: string[],
    selected: string[]
  ) => void
  closeFilterDropdown: () => void
  updatePositions: () => void
}

export default Component
