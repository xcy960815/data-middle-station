declare namespace ChartStore {
  import type { _GettersTree } from 'pinia'
  const ChartTypesEnums = {
    table: 'table',
    line: 'line',
    pie: 'pie',
    interval: 'interval'
  } as const

  type ChartKey = 'chart'

  type ChartType =
    (typeof ChartTypesEnums)[keyof typeof ChartTypesEnums]
  /**
   * @desc getters keys
   */
  type ChartGetterKeys = `get${Capitalize<
    keyof ChartState & string
  >}`
  type ChartGetters = Record<
    ChartGetterKeys,
    (
      state: ChartState
    ) => <K>() => K extends string & keyof ChartState
      ? ChartState[K]
      : void
  >
  // type ChartGetters = Partial<
  //   Record<
  //     ChartGetterKeys,
  //     (
  //       state: ChartState
  //     ) => <K>() => K extends string & keyof ChartState
  //       ? ChartState[K]
  //       : void
  //   >
  // >
  interface ChartState {
    chartErrorMessage: string
    // 图表类型
    chartType: ChartType
    // 图表id
    chartId: number | null
    // 表格数据
    chartData: Array<Record<string, string | number>>
    // 图表加载状态
    chartLoading: boolean
  }
  type ChartActionsKeys = `set${Capitalize<
    keyof ChartState & string
  >}`

  interface ChartActions
    extends Record<
      ChartActionsKeys,
      <K extends string & keyof ChartState>(
        payload: ChartState[K]
      ) => void
    > {}
}
