/**
 * @desc 图表配置 store 类型
 */
declare namespace ChartConfigStore {
    /**
     * @desc 图表配置 store
     */
    type ChartConfigKey = 'chartConfig'

    type ChartConfigState = {
        /**
         * @desc 图表配置抽屉
         */
        chartsConfigDrawer:boolean
        /**
         * @desc 图表公共配置
         */
        chartCommonConfigData: {
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
        // setChartsConfigDrawer: (drawer: boolean) => void
        // 折线图配置
        chartConfigData: {
            /**
             * @desc 折线图配置
             */
            line: {
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
            /**
             * @desc 柱状图配置
             */
            interval: {
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
            /**
             * @desc 饼图配置
             */
            pie: {
                // 是否显示文字
                showLabel: boolean
                // 图表类型
                chartType: string // "pie" | "rose"
            }
            /**
             * @desc 表格配置
             */
            table: {
                displayMode: string // "originalDisplay"|"aggregationDisplay"
                showCompare: boolean
                conditions: Array<{}>
            }
        }
    }

    /**
     * @desc getter 名称
     */
    type GetterName<T extends string> = `get${Capitalize<T>}`;

    /**
     * @desc getter
     */
    type ChartConfigGetters<S> = {
        [K in keyof S as GetterName<K & string>]?: (state: S) => S[K];
    };

    /**
     * @desc action 名称
     */
    type ActionName<T extends string> = `set${Capitalize<T>}` | `add${Capitalize<T>}` | `remove${Capitalize<T>}`;
    /**
     * @desc action
     */
    type ChartConfigActions = {
        [K in keyof ChartState as ActionName<K & string>]?: (value: ChartState[K]) => void;
    }
}
