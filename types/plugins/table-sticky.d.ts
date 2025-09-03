/**
 * @desc table-sticky directive and component definition
 */
declare namespace TableSticky {
  import type { ComponentInternalInstance, DirectiveBinding, Ref, VNode } from 'vue'

  type VNodeRef = string | Ref | ((ref: object | null, refs: Record<string, any>) => void)

  interface DirectiveBindingValue {
    top: number
    parent: string
    willBeChangeElementClasses?: Array<string>
  }

  type TableStickyBinding = DirectiveBinding<DirectiveBindingValue>

  interface Option {
    tableElement: HTMLElement
    binding: TableStickyBinding
    vnode: VNode
  }

  interface StickyConfig {
    fixedTopValue: number
    tableHeaderElement: HTMLElement
    tableHeaderElementOriginalTop: number
    tableHeaderElementOriginalStyle: Pick<CSSStyleDeclaration, 'position' | 'zIndex' | 'top' | 'transition'>
    tableInnerWapperElement: HTMLElement
    tableInnerWapperElementOriginalStyle: Pick<CSSStyleDeclaration, 'marginTop'>
    tableBodyElement: HTMLElement
    scrollElement: HTMLElement
    tableElementOriginalWidth: string
    handleScrollElementOnScroll: EventListener
    tableElementResizeObserver: ResizeObserver
    willChangeElementsOriginalHeight: string[]
    willChangeElementsResizeObserver: ResizeObserver[]
  }

  interface StickyConfigs extends Map<string, StickyConfig> {}

  interface VNodeNormalizedRefAtom {
    i: ComponentInternalInstance
    r: VNodeRef
    f?: boolean
  }
}
