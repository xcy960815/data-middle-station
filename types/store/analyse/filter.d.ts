/// <reference path="./commom.d.ts" />

declare namespace FilterStore {
  type FilterKey = 'filter'

  interface Filter extends FieldOption {}

  interface FilterState {
    filters: Array<Filter>
  }

  type FilterGetterKeys = `get${Capitalize<
    keyof FilterState & string
  >}`
  interface FilterGetters
    extends Record<
      FilterGetterKeys,
      (
        state: FilterState
      ) => <
        K extends keyof FilterState & string
      >() => FilterState[K]
    > {}

  interface FilterActions {
    updateFilter: (filters: Filter[]) => void
    addFilter: (filters: Filter[]) => void
    removeFilter: (index: number) => void
  }
}
