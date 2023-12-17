/**
 * @desc 图表配置 store 类型
 */
declare namespace ChartConfigStore {
    /**
     * @desc 图表配置 store
     */
    type ChartConfigKey = 'chartConfig'

    type CommonChartConfig = {
        // 描述
        description: string
        // 数据量
        limit: number
        // 智能作图建议
        suggest: boolean
        // 缓存策略
        mixStrategy: string
        // 分享
        shareStrategy: string
    }

    type LineChartConfig = {
        // 是否画圆点
        showPoint: boolean
        // 是否显示文字
        showLabel: boolean
        // 是否平滑展示
        smooth: boolean
        // 是否自动双轴
        autoDualAxis: boolean
        // 是否横向拖动条
        horizontalBar: boolean
    }

    type IntervalChartConfig = {
        // 展示方式
        displayMode: string // 'levelDisplay' | 'stackDisplay'
        // 是否百分比显示
        showPercentage: boolean
        // 是否显示文字
        showLabel: boolean
        // 水平展示
        horizontalDisplay: boolean
        // 横线滚动
        horizontalBar: boolean
    }

    type PieChartConfig = {
        // 是否显示文字
        showLabel: boolean
        // 图表类型
        chartType: string // "pie" | "rose"
    }

    type TableChartConfig = {
        displayMode: string // "originalDisplay"|"aggregationDisplay"
        showCompare: boolean
        conditions: Array<{}>
    }

    type ChartConfig = {
        /**
         * @desc 图表配置
         */
        line: LineChartConfig
        /**
         * @desc 柱状图配置
         */
        interval: IntervalChartConfig
        /**
         * @desc 饼图配置
         */
        pie: PieChartConfig
        /**
         * @desc 表格配置
         */
        table: TableChartConfig
    }

    type ChartConfigState = {
        /**
         * @desc 图表配置抽屉
         */
        chartConfigDrawer:boolean
        /**
         * @desc 图表公共配置
         */
        commonChartConfig: CommonChartConfig
        /**
         * @desc 图表配置
         */
        chartConfig: ChartConfig
        
    }

    /**
     * @desc getter 名称
     */
    type GetterName<T extends string> = `get${Capitalize<T>}`;

    /**
     * @desc getter
     */
    type ChartConfigGetters<S> = {
        [K in keyof S as GetterName<K & string>]: (state: S) => S[K];
    };

    /**
     * @desc action 名称
     */
    type ActionName<T extends string> = `set${Capitalize<T>}`
    /**
     * @desc action
     */
    type ChartConfigActions = {
        [K in keyof ChartConfigState as ActionName<K & string>]: (value: ChartConfigState[K]) => void;
    }
}
