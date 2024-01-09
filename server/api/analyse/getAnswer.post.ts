
import { GetAnswerDao } from '../../database/analyse';

interface QueryChartDataParams {
    dataSource: string;
    filters: Array<FilterStore.FilterOption>;
    orders: Array<OrderStore.OrderOption>;
    groups: Array<GroupStore.GroupOption>;
    dimensions: Array<DimensionStore.DimensionOption>;
    limit: number;
}

type QueryChartData = Array<{ [key: string]: string | number }>

/**
 * @desc 查询图表数据
 * @param {QueryChartDataParams} params
 * @returns {Promise<ResponseModule.Response<QueryChartData>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<QueryChartData>>>(async (event) => {
    try {
        const { dimensions, dataSource, orders, limit }: QueryChartDataParams = await readBody(event);
        const getAnswerInstance = new GetAnswerDao();
        let sql = 'select';
        dimensions.forEach((item: DimensionStore.DimensionOption) => {
            sql += ` ${item.columnName} as ${item.alias ? item.alias : item.columnName},`;
        });
        // 删除最后一个逗号
        sql = sql.slice(0, sql.length - 1);
        sql += ` from ${dataSource} `;
        if (orders.length > 0) {
            sql += ` order by ${orders.map((item: OrderStore.OrderOption) => `${item.columnName} ${item.orderType}`).join(',')}`;
        }

        sql += ` limit ${limit}`;
        const data = await getAnswerInstance.exe<QueryChartData>(sql as string);
        return {
            code: 200,
            data,
            message: 'success',
        };
    } catch (error: any) {
        return {
            code: 500,
            data: null,
            message: error.message,
        };
    }
})