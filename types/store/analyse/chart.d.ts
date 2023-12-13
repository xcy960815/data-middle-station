declare namespace ChartStore {

  const ChartTypesEnums = {
    table: 'table',
    line: 'line',
    pie: 'pie',
    interval: 'interval'
  } as const

  type ChartKey = 'chart'

  type ChartType = (typeof ChartTypesEnums)[keyof typeof ChartTypesEnums]

  type ChartState = {
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

  /**
   * @desc getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type ChartGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
   * @desc action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}`;
  /**
   * @desc action
   */
  type ChartActions = {
    [K in keyof ChartState as ActionName<K & string>]: (value: ChartState[K]) => void;
  }&{
   
  }
}
