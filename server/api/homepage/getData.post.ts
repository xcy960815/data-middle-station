
interface ReturnData {
    code: number;
    data: string;
    message: string;
}

export default defineEventHandler<Promise<ReturnData>>(async () => {
    const returnData = () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    code: 200,
                    data: "post 请求 返回结果",
                    message: "success"
                })
            }, 2000)

        })
    }
    const result = await returnData() as ReturnData

    return result

})