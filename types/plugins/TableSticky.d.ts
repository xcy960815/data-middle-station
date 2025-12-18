/**
 * @desc table-sticky directive and component definition
 */
declare namespace TableSticky {
  import type { ComponentInternalInstance, DirectiveBinding, Ref, VNode } from 'vue'

  type VNodeRef = string | Ref | ((ref: object | null, refs: Record<string, any>) => void)

  /**
   * @desc 指令绑定值
   */
  interface DirectiveBindingValue {
    top: number
    parent: string
    willBeChangeElementClasses?: Array<string>
  }

  /**
   * @desc 表格粘性绑定
   */
  type TableStickyBinding = DirectiveBinding<DirectiveBindingValue>

  /**
   * @desc 选项
   */
  interface Option {
    tableElement: HTMLElement
    binding: TableStickyBinding
    vnode: VNode
  }

  /**
   * @desc 粘性配置
   */
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

  /**
   * @desc 粘性配置集合
   */
  interface StickyConfigs extends Map<string, StickyConfig> {}

  /**
   * @desc 虚拟节点引用原子
   */
  interface VNodeNormalizedRefAtom {
    i: ComponentInternalInstance
    r: VNodeRef
    f?: boolean
  }
}
