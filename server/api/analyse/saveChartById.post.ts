
import { ChartsDao } from "../../database/charts"
import { Response } from "../../database/response"
import dayjs from 'dayjs'
/**
 * @api {post} /analyse/saveChartById
 * @apiName saveChartById
 * @apiGroup analyse
 * @apiDescription 保存图表
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<number>>>(async (event) => {
    try {
        const chartsParamsOption = await readBody<ChartsModule.ChartsParamsOption>(event);
        chartsParamsOption.updateTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        const chartsInstance = new ChartsDao();
        const data = await chartsInstance.updateChart(chartsParamsOption);
        console.log("data",data);
        
        // return Response.success(data);
        return Response.success(1);

    } catch (error: any) {
        return Response.error(error.message);
    }
});