
import { ChartsDao } from "../../database/charts"
import { Response } from "../../database/response"
/**
 * 获取图表数据
 */
export default defineEventHandler(async () => {
    const chartsDao = new ChartsDao()
    const charts = await chartsDao.getCharts()
    console.log("charts", charts);

    return Response.success(charts);
})