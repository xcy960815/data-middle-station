<template>
    <div class='test-commonfetch'>
        test-commonfetch
    </div>
</template>

<script lang='ts' setup>
commonFetch.baseUrl = 'https://api.github.com'
const getData = async () => {
    const res = await commonFetch.get<string>('/users/defunkt', { name: "xiaoming" }, {
        method: 'GET',
    })
    const result = await res.json()
}
// getData()


onMounted(() => {
    // fetch('https://api.github.com/users/defunkt', {
    //     method: 'GET',
    //     // body: JSON.stringify({
    //     //     name: 'defunkt'
    //     // })
    // })
    //     .then(res => res)
    //     .then(data => {
    //         console.log(data)
    //     })
})
</script>
<style lang='scss' scoped></style>