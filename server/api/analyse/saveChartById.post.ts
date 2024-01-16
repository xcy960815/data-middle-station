
import { ChartsDao } from "../../database/charts"
import { Response } from "../../database/response"

/**
 * @api {post} /analyse/saveChartById
 * @apiName saveChartById
 * @apiGroup analyse
 * @apiDescription 保存图表
 * 
 */
export default defineEventHandler(async (event) => {
    try {
        const chartsParamsOption = await readBody<ChartsModule.ChartsParamsOption>(event);
        const chartsInstance = new ChartsDao();
        console.log('chartsParamsOption', chartsParamsOption);
        
        const data = await chartsInstance.updateChart(chartsParamsOption);
        return Response.success(data);
    } catch (error: any) {
        return Response.error(error.message);
    }
});