import type Konva from 'konva'
import type { KonvaEventObject } from 'konva/lib/Node'
import type { DefineComponent } from 'vue'

interface SummaryDropdownOption {
  label: string
  value: string
}

declare const Component: DefineComponent<
  {},
  {
    openSummaryDropdown: (
      evt: KonvaEventObject<MouseEvent, Konva.Rect>,
      colName: string,
      options: SummaryDropdownOption[],
      selected?: string
    ) => void
    closeSummaryDropdown: () => void
    updatePositions: () => void
  },
  {}
>

export default Component
