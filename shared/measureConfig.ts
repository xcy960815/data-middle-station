import type { MeasureAggregationType } from '@/shared/domainTypes'

export type MeasureRule = {
  aggregation?: MeasureAggregationType
}

export const createMeasureRule = (aggregation?: MeasureAggregationType): MeasureRule => ({
  aggregation
})
