

import dayjs from 'dayjs'
import { ChartsDao } from "../../database/charts"
import { Response } from "../../database/response"

/**
 * @Desc 创建或者更新图表
 * @param event
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<boolean>>>(async (event) => {
    try {
        const chartsParamsOption = await readBody<ChartsModule.ChartsParamsOption>(event);
        const currentTime = dayjs().format('YYYY-MM-DD HH:mm:ss')
        chartsParamsOption.updateTime = currentTime
        chartsParamsOption.createTime = currentTime
        const chartsDao = new ChartsDao()
        const charts = await chartsDao.createChart(chartsParamsOption)
        return Response.success(charts);
    } catch (error: any) {
        return Response.error(error.message);
    }
})