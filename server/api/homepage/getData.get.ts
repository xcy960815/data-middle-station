


export default defineEventHandler<{
    code: number;
    data: string;
    message: string;
}>(() => {
    return {
        code: 200,
        data: "get 请求 返回结果",
        message: "success"
    }
})