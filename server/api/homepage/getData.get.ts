


export default defineEventHandler<{
    code: number;
    data: string;
    message: string;
}>(() => {
    return {
        code: 200,
        data: "hello world",
        message: "success"
    }
})