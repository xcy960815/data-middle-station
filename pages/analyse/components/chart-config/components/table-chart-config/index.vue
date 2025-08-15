<template>
  <el-form label-position="top" label-width="auto" :model="tableChartConfigData">
    <el-form-item label="展现方式">
      <el-select v-model="tableChartConfigData.displayMode" placeholder="展示方式">
        <el-option label="原始展示" value="originalDisplay" />
        <el-option label="聚合展示" value="aggregationDisplay" />
      </el-select>
    </el-form-item>
    <el-form-item label="是否展示同比环比">
      <el-switch
        v-model="tableChartConfigData.showCompare"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <el-form-item label="条件格式">
      <el-tag v-for="(conditionOption, index) in tableChartConfigData.conditions" :key="index" closable type="warning">
        {{ conditionOption.conditionField }}
        {{ conditionSymbolMap[conditionOption.conditionSymbol] }}
        {{ conditionOption.conditionValue }}
      </el-tag>
      <el-icon :size="18" class="cursor-pointer" @click="handleOpenConditionDialog">
        <CirclePlus />
      </el-icon>
    </el-form-item>
  </el-form>

  <!-- 条件格式dialog -->
  <client-only>
    <el-dialog v-model="conditionDialogVisible" title="条件格式设置" width="50%">
      <el-form label-position="left" label-width="auto">
        <el-icon :size="18" class="cursor-pointer" @click="handleAddCondition">
          <CirclePlus />
        </el-icon>
        <el-row v-for="(condition, index) in conditionsState.conditions">
          <el-col :span="3">
            <el-form-item>
              <el-select v-model="condition.conditionType" placeholder="条件类型">
                <el-option label="单色" value="单色" />
                <el-option label="色阶" value="色阶" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <!-- 字段 -->
              <el-select v-model="condition.conditionField" placeholder="条件字段">
                <el-option
                  v-for="field in fields"
                  :label="field.displayName || field.columnName"
                  :value="field.columnName"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色'">
            <el-form-item>
              <!-- 条件 -->
              <el-select v-model="condition.conditionSymbol" placeholder="条件">
                <!-- 介于 -->
                <el-option label="介于" value="between" />
                <el-option label="大于" value="gt" />
                <el-option label="小于" value="lt" />
                <el-option label="等于" value="eq" />
                <el-option label="不等于" value="neq" />
                <el-option label="大于等于" value="gte" />
                <el-option label="小于等于" value="lte" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色' && condition.conditionSymbol !== 'between'">
            <el-form-item>
              <!-- 适用于非介于的情况 -->
              <el-input v-model="condition.conditionValue" placeholder="条件值"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色' && condition.conditionSymbol === 'between'">
            <el-form-item>
              <!-- 适用于介于的情况 -->
              <el-input v-model="condition.conditionMinValue" placeholder="条件最小值"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-if="condition.conditionType === '单色' && condition.conditionSymbol === 'between'">
            <el-form-item>
              <!-- 适用于介于的情况 -->
              <el-input v-model="condition.conditionMaxValue" placeholder="条件最大值"></el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item>
              <!-- 单色颜色 -->
              <el-select
                v-model="condition.conditionColor"
                class="condition-color-select"
                @change="handleColorChange(condition.conditionColor, index)"
                placeholder="颜色"
              >
                <el-option-group
                  v-for="monochromeColorOption in monochromeColorList"
                  :key="monochromeColorOption.label"
                  :label="monochromeColorOption.label"
                >
                  <el-option
                    v-for="item in monochromeColorOption.options"
                    :key="item.color"
                    :label="item.label"
                    :value="item.color"
                  >
                    <span style="float: left; font-weight: 700" :style="{ color: item.color }">██████</span>
                  </el-option>
                </el-option-group>
              </el-select>
            </el-form-item>
          </el-col>
          <!-- 删除 -->
          <el-col :span="1">
            <el-button type="danger" circle @click="handleDeleteCondition(index)">
              <el-icon class="cursor-pointer" :size="14">
                <Delete />
              </el-icon>
            </el-button>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="conditionDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirm"> 保存 </el-button>
        </span>
      </template>
    </el-dialog>
  </client-only>
</template>

<script lang="ts" setup>
const conditionDialogVisible = ref(false)
const chartsConfigStore = useChartConfigStore()
const dimensionStore = useDimensionStore()
const groupStore = useGroupStore()

const tableChartConfigData = computed(() => {
  return (
    chartsConfigStore.chartConfig?.table || {
      displayMode: 'originalDisplay',
      showCompare: false,
      conditions: []
    }
  )
})
const conditionSymbolMap: { [k: string]: string } = {
  between: '介于',
  gt: '大于',
  lt: '小于',
  eq: '等于',
  neq: '不等于',
  gte: '大于等于',
  lte: '小于等于'
}
// 单色配色列表
const monochromeColorList = [
  {
    label: '红色系',
    options: [
      { label: '██████', color: 'rgb(235, 80, 126)' },
      { label: '██████', color: 'rgb(238, 75, 75)' },
      { label: '██████', color: 'rgb(173, 27, 7)' }
    ]
  },
  {
    label: '绿色系',
    options: [
      { label: '██████', color: 'rgb(67, 178, 68)' },
      { label: '██████', color: 'rgb(64, 162, 118)' },
      { label: '██████', color: 'rgb(18, 161, 130)' }
    ]
  },
  {
    label: '黄色系',
    options: [
      { label: '██████', color: 'rgb(250, 204, 135)' },
      { label: '██████', color: 'rgb(241, 202, 23)' },
      { label: '██████', color: 'rgb(252, 161, 4)' }
    ]
  },
  {
    label: '蓝色系',
    options: [
      { label: '██████', color: 'rgb(114, 175, 217)' },
      { label: '██████', color: 'rgb(19 ,138 ,221)' },
      { label: '██████', color: 'rgb(169, 153, 201)' }
    ]
  }
]
// 多色配色列表
const multiColorList = [
  { label: '██████', color: 'rgb(255, 117, 78)' },
  { label: '██████', color: 'rgb(247, 144, 163)' },
  { label: '██████', color: 'rgb(140, 192, 253)' },
  { label: '██████', color: 'rgb(25, 170, 209)' },
  { label: '██████', color: 'rgb(109, 215, 163)' },
  { label: '██████', color: 'rgb(147, 190, 196)' },
  { label: '██████', color: 'rgb(253, 240, 111)' },
  { label: '██████', color: 'rgb(195, 86, 145)' }
]

const conditionsState = reactive<{
  conditions: Array<ChartConfigStore.TableChartConfigConditionOption>
}>({
  conditions: []
})
/**
 * @desc 可以选择的字段
 * @returns Array<Dimension | Group>
 */
const fields = computed(() => {
  const fields = dimensionStore.getDimensions.concat(groupStore.getGroups).filter((field) => {
    return (
      field.columnType?.includes('int') || field.columnType?.includes('float') || field.columnType?.includes('double')
    )
  })

  return fields
})

/**
 * @desc 打开条件格式dialog
 * @returns void
 */
const handleOpenConditionDialog = (): void => {
  conditionDialogVisible.value = true
  conditionsState.conditions = JSON.parse(JSON.stringify(chartsConfigStore.chartConfig?.table.conditions || []))
  nextTick(() => {
    conditionsState.conditions.forEach((condition, index) => {
      handleColorChange(condition.conditionColor, index)
    })
  })
}

/**
 * @desc 添加条件
 * @returns {void}
 */
const handleAddCondition = () => {
  const condition: ChartConfigStore.TableChartConfigConditionOption = {
    // 条件
    conditionType: '单色',
    // 条件字段
    conditionField: '',
    // 条件符号
    conditionSymbol: 'gt',
    // 最小范围值
    conditionMinValue: '',
    // 最大范围值
    conditionMaxValue: '',
    // 条件值
    conditionValue: '',
    // 条件颜色
    conditionColor: ''
  }
  conditionsState.conditions.push(condition)
}

/**
 * @desc 处理颜色改变
 * @param color {string} 颜色
 * @param index {number} 下标
 * @returns {void}
 */
const handleColorChange = (color: string, index: number): void => {
  const inputNodeList = document.querySelectorAll<HTMLInputElement>('.condition-color-select  input')
  if (inputNodeList && inputNodeList.length) {
    const inputNode = inputNodeList[index]
    inputNode.style.color = color
    inputNode.style.fontSize = '16px'
  }
}
/**
 * @desc 删除条件
 * @param index {number} 下标
 * @returns {void}
 */
const handleDeleteCondition = (index: number): void => {
  // chartsConfigStore.deleteTableChartConditions(index)
  conditionsState.conditions.splice(index, 1)
}
/**
 * @desc 确认
 * @returns {void}
 */
const handleConfirm = (): void => {
  chartsConfigStore.setTableChartConditions(conditionsState.conditions)
  conditionDialogVisible.value = false
}
</script>

<style scoped lang="scss"></style>
