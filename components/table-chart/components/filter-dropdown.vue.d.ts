import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { DefineComponent } from 'vue'

declare const Component: DefineComponent<
  {},
  {
    openFilterDropdown: (
      event: KonvaEventObject<MouseEvent, Konva.Shape>,
      colName: string,
      options: string[],
      selected: string[]
    ) => void
    closeFilterDropdown: () => void
    updatePositions: () => void
  },
  any,
  {},
  {},
  {},
  {},
  {
    'update-positions-in-table': []
  }
>

export default Component
