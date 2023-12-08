/// <reference path="./commom.d.ts" />

declare namespace FilterStore {
  type FilterKey = 'filter'

  interface Filter extends FieldOption { }

  type FilterState = {
    filters: Array<Filter>
  }

  // 自动解析出来的 getters 的 key
  type FilterGetterKeys = `get${Capitalize<
    keyof FilterState & string
  >}`

  type FilterGetters
    = Record<
      FilterGetterKeys,
      <K extends keyof FilterState & string = "">(state: FilterState) => FilterState[K]
    >

  type FilterActions = {
    updateFilter: (filters: Filter[]) => void
    addFilter: (filters: Filter[]) => void
    removeFilter: (index: number) => void
  }
}
