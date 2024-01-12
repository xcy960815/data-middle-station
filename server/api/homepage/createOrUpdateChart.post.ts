


import { ChartsDao } from "../../database/charts"
import { Response } from "../../database/response"

/**
 * @Desc 创建或者更新图表
 * @param event
 * @returns {Promise<ResponseModule.Response<number>>}
 */
export default defineEventHandler<Promise<ResponseModule.Response<number>>>(async (event) => {
    try {
        const body = await readBody<ChartsModule.ChartsParamsOption>(event);
        let {
            id,
            name,
            filter,
            group,
            dimension,
            order,
        } = body
        // 做兼容处理
        filter = filter || []
        group = group || []
        dimension = dimension || []
        order = order || []
        const chartsDao = new ChartsDao()
        if (id) {
            const charts = await chartsDao.updateChart({
                id,
                name,
                filter,
                group,
                dimension,
                order,
            })
            return Response.success(charts);
        } else {
            const charts = await chartsDao.createChart({
                name,
                filter,
                group,
                dimension,
                order,
            })
            return Response.success(charts);
        }

    } catch (error: any) {
        return Response.error(error.message);
    }
})