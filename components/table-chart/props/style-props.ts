const defaultFontFamily = 'Arial, sans-serif'

export const styleProps = {
  /**
   * 图表宽度
   */
  chartWidth: { type: [Number, String], default: '100%' },
  /**
   * 图表高度
   */
  chartHeight: { type: [Number, String], default: '100%' },
  /**
   * 高亮单元格背景色
   */
  highlightCellBackground: { type: String, default: 'rgba(24, 144, 255, 1)' },
  /**
   * 高亮行背景色
   */
  highlightRowBackground: { type: String, default: 'rgba(24, 144, 255, 0.1)' },
  /**
   * 高亮列背景色
   */
  highlightColBackground: { type: String, default: 'rgba(24, 144, 255, 0.1)' },

  /**
   * 表头高度
   */
  headerHeight: { type: Number, default: 32 },
  /**
   * 表头背景色
   */
  headerBackground: { type: String, default: '#f7f7f9' },
  /**
   * 表头文本颜色
   */
  headerTextColor: { type: String, default: '#303133' },
  /**
   * 表头字体
   */
  headerFontFamily: { type: String, default: defaultFontFamily },
  /**
   * 表头字体大小
   */
  headerFontSize: { type: [Number, String], default: 14 },

  /**
   * 表格行高度
   */
  bodyRowHeight: { type: Number, default: 32 },
  /**
   * 表格行背景色（奇数行）
   */
  bodyBackgroundOdd: { type: String, default: '#ffffff' },
  /**
   * 表格行背景色（偶数行）
   */
  bodyBackgroundEven: { type: String, default: '#fafafa' },
  /**
   * 表格行文本颜色
   */
  bodyTextColor: { type: String, default: '#303133' },
  /**
   * 表格行字体
   */
  bodyFontFamily: { type: String, default: defaultFontFamily },
  /**
   * 表格行字体大小
   */
  bodyFontSize: { type: [Number, String], default: 13 },

  /**
   * 表格边框颜色
   */
  borderColor: { type: String, default: '#dcdfe6' },

  /**
   * 汇总高度
   */
  summaryHeight: { type: Number, default: 32 },
  /**
   * 汇总背景色
   */
  summaryBackground: { type: String, default: '#f7f7f9' },
  /**
   * 汇总文本颜色
   */
  summaryTextColor: { type: String, default: '#303133' },
  /**
   * 汇总字体
   */
  summaryFontFamily: { type: String, default: defaultFontFamily },
  /**
   * 汇总字体大小
   */
  summaryFontSize: { type: [Number, String], default: 14 },

  /**
   * 滚动条大小
   */
  scrollbarSize: { type: Number, default: 16 },
  /**
   * 滚动条背景色
   */
  scrollbarBackground: { type: String, default: '#f1f1f1' },
  /**
   * 滚动条滑块颜色
   */
  scrollbarThumb: { type: String, default: '#c1c1c1' },
  /**
   * 滚动条滑块悬停颜色
   */
  scrollbarThumbHover: { type: String, default: '#a8a8a8' },

  /**
   * 排序激活背景色
   */
  headerSortActiveBackground: { type: String, default: '#ecf5ff' },
  /**
   * 可排序颜色
   */
  sortableColor: { type: String, default: '#409EFF' }
}
