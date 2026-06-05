import type { OrderAggregationType, OrderType } from '@/shared/domainTypes'

export type OrderSortRule = {
  direction: OrderType
  aggregation?: OrderAggregationType
}

export const createDefaultOrderSort = (): OrderSortRule => ({
  direction: 'desc',
  aggregation: 'raw'
})
