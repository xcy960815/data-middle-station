
import { ChartsDao } from "../../database/charts"
import { Response } from "../../database/response"
/**
 * @获取图表数据
 * @returns { Promise<Array<ChartsModule.ChartsOption>>}
 *
 */
export default defineEventHandler<Promise<ResponseModule.Response<Array<ChartsModule.ChartsOption>>>>(async () => {
    try {
        const chartsDao = new ChartsDao()
        const charts = await chartsDao.getCharts()
        return Response.success(charts);
    } catch (e: any) {
        return Response.error(e.message);
    }
})