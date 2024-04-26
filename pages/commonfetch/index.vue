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

commonFetch.baseUrl = "http://localhost:3000/api"
// commonFetch.credentials = "same-origin"
// commonFetch.timeout = 1000
const getData = async () => {
    const result = await commonFetch.post<ReturnData>('/homepage/getData', { name: 'test', age: 18 }, {
        headers: {
            'Content-Type': 'application/json'
        },
        responseInterceptor(response) {
            console.log(response);
            
            return response
        },
    })
    const data = await result.json()
    console.log('data', data);
}

onMounted(() => {
    getData()
})

</script>
<style lang='scss' scoped></style>