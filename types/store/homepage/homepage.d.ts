

declare namespace HomePageStore {

  type HomePageKey = 'homepage'

  type ChartOption = {
    id: number,
    name: string,
    updateTime: string,
    createTime: string,
    visits: number,
  }
  type HomePageState = {
    charts: ChartOption[]
  }

  /**
   * @desc getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type HomePageGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };
  /**
   * @desc action 名称
   */
  type ActionName<T extends string> = `set${Capitalize<T>}`;
  /**
   * @desc action
   */
  type HomePageActions = {
    [K in keyof HomePageState as ActionName<K & string>]: (value: HomePageState[K]) => void;
  } & {

  }
}

