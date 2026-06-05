import type { FilterAggregationType, FilterType } from '@/shared/domainTypes'

export type FilterConditionRule = {
  operator?: FilterType
  operand?: string
  aggregation?: FilterAggregationType
}

export const createDefaultFilterCondition = (): FilterConditionRule => ({
  aggregation: 'raw',
  operand: ''
})
