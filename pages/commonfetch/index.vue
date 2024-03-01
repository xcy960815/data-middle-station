<template>
    <div class='test-commonfetch'>
        <button @click="getData">test-commonfetch</button>
    </div>
</template>

<script lang='ts' setup>
// 设置请求域名
// commonFetch.baseUrl = 'https://api.github.com'
// commonFetch.withCredentials = true
const getData = async () => {
    const result = await commonFetch.post<string>('/api/homepage/getData', { name: 'test', age: 18 }, {
        // method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

onMounted(() => {
    getData()
})

</script>
<style lang='scss' scoped></style>