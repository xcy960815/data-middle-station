
/**
 * @desc 左侧列字段
 */
declare namespace OrderStore {

  type OrderKey = 'order'

  const OrderTypeEnums = {
    "升序": 'asc',
    "降序": 'desc'
  } as const

  type OrderType = (typeof OrderTypeEnums)[keyof typeof OrderTypeEnums]

  const OrderAggregationsEnum = {
    原始值: 'raw',
    计数: 'count',
    总计: 'sum',
    平均: 'avg',
    最大值: 'max',
    最小值: 'min',
  } as const

  type OrderAggregationsType = typeof OrderAggregationsEnum[keyof typeof OrderAggregationsEnum]
  /**
   * @desc 左侧列字段
   * @interface OrderOption
   * @property {string} name 列名
   * @property {string} comment 列注释
   * @property {string} type 列类型
   */
  interface OrderOption extends ColumnStore.ColumnOption {
    orderType: OrderType
    aggregationType: OrderAggregationsType
  }

  type OrderState = {
    orders: OrderOption[]
  }

  /**
   * @desc getter 名称
   */
  type GetterName<T extends string> = `get${Capitalize<T>}`;

  /**
   * @desc getter
   */
  type OrderGetters<S> = {
    [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
  };

  /**
    * @desc action 名称
    */
  type ActionName<T extends string> = `set${Capitalize<T>}`;
  /**
   * @desc action
   */
  type OrderActions = {
    [K in keyof OrderState as ActionName<K & string>]: (value: OrderState[K]) => void;
  } & {
    updateOrder: (value: OrderOption, index: number) => void;
    addOrders: (value: OrderOption[]) => void;
    removeOrder: (value: number) => void;
  }
}
