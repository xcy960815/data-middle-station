import type { PropType } from 'vue'

export const dataProps = {
  /**
   * 图表标题
   */
  title: String,

  /**
   * 数据
   */
  data: {
    type: Array as PropType<ChartDataVo.ChartData[]>,
    required: true,
    default: () => []
  },

  /**
   * 分组字段
   */
  xAxisFields: {
    type: Array as PropType<GroupStore.GroupOption[]>,
    required: true,
    default: () => []
  },

  /**
   * 维度字段
   */
  yAxisFields: {
    type: Array as PropType<DimensionStore.DimensionOption[]>,
    required: true,
    default: () => []
  }
}
