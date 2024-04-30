<template>
    <div class='test-commonfetch'>
        <button @click="getData">test-commonfetch</button>
    </div>
</template>

<script lang='ts' setup>
interface ReturnData {
    code: number;
    data: string;
    message: string;
}
// 调用非全局的中间件
definePageMeta({
    // middleware: ['check-permission',"inject-data"]
})

// commonFetch.baseUrl = "http://localhost:3000/api"
// commonFetch.credentials = "same-origin"
// commonFetch.timeout = 1000
const getData = async () => {
    const result = await commonFetch.get<ReturnData>('/homepage/getData', { name: 'test', age: 18 }, {
        headers: {
            'Content-Type': 'application/json'
        },
        // 自定义请求拦截器
        requestInterceptor: function (requestConfig) {
            // 临时修改域名
            requestConfig.baseUrl = "http://localhost:3000/api"
            // 临时添加cookie
            requestConfig.credentials = "same-origin"
            // 临时修改超时时间
            requestConfig.timeout = 3000

            return requestConfig
        },
        // 自定义响应拦截器
        // responseInterceptor: async function (response) {
        //     const data = await response.json()
        //     console.log("data---data", data);
        //     // 响应拦截器
        //     return response
        // },
    })
    console.log("result--result", result);

}




onMounted(() => {
    getData()

})

</script>
<style lang='scss' scoped></style>