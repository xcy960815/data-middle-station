<template>
    <el-popover :visible="visible1" :width="400" trigger="click">
        <template #reference>
            <el-popover :visible="visible2" :width="400" trigger="click">
                <template #reference>
                    <el-button @click="handleClick">Click to activate</el-button>
                </template>
                <div>popover1</div>
            </el-popover>
        </template>
        <div @click="handleClick2">popover2</div>
    </el-popover>
</template>
  
<script lang="ts" setup>
const visible1 = ref(false)
const visible2 = ref(false)
const handleClick = () => {
    visible1.value = true
    // visible2.value = !visible2.value
}
const handleClick2 = () => {
    visible1.value = false
    visible2.value = true
}
</script>
  