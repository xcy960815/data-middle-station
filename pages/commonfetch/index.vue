<template>
    <div class='test-commonfetch'>
        <button @click="getData">test-commonfetch</button>
    </div>
</template>

<script lang='ts' setup>
// 调用非全局的中间件
definePageMeta({
    // middleware: ['check-permission',"inject-data"]
})

commonFetch.baseUrl = "http://localhost:3000/api"
commonFetch.timeout = 2000
const getData = async () => {
    const result = await commonFetch.post<string>('/homepage/getData', { name: 'test', age: 18 }, {
        // method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    console.log("result",result);
    
}

onMounted(() => {
    getData()
})

</script>
<style lang='scss' scoped></style>