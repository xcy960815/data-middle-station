<template>
  <el-form label-position="top" label-width="auto" :model="tableChartConfigData">
    <el-form-item label="展现方式">
      <el-select v-model="tableChartConfigData.displayMode" placeholder="展示方式">
        <el-option label="原始展示" value="originalDisplay" />
        <el-option label="聚合展示" value="aggregationDisplay" />
      </el-select>
    </el-form-item>
    <el-form-item label="是否展示同比环比">
      <el-switch v-model="tableChartConfigData.showCompare" style="
          --el-switch-on-color: #13ce66;
          --el-switch-off-color: #ff4949;
        " />
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
                <el-option v-for="field in fields" 
                  :label="field.alias || field.columnName"
                  :value="field.alias || field.columnName" />
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
              <el-select v-model="condition.conditionColor" class="condition-color-select"
                @change="handleColorChange(condition.conditionColor, index)" placeholder="颜色">
                <el-option-group v-for="monochromeColorOption in monochromeColorList" :key="monochromeColorOption.label"
                  :label="monochromeColorOption.label">
                  <el-option v-for="item in monochromeColorOption.options" :key="item.color" :label="item.label"
                    :value="item.color">
                    <span style="float: left;font-weight: 700;" :style="{ color: item.color }">██████</span>
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
          <el-button type="primary" @click="handleConfirm">
            保存
          </el-button>
        </span>
      </template>
    </el-dialog>
  </client-only>
</template>

<script lang="ts" setup>
import { initData } from "./init-data"
import { handler } from "./handler"
const {
  conditionDialogVisible,
  tableChartConfigData,
  conditionSymbolMap,
  monochromeColorList,
  multiColorList,
  conditionsState,
  fields
} = initData()

const {
  handleOpenConditionDialog,
  handleAddCondition,
  handleColorChange,
  handleDeleteCondition,
  handleConfirm
} = handler({ conditionDialogVisible, conditionsState })

</script>

<style scoped lang="scss"></style>
