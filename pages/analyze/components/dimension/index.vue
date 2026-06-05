<template>
  <!-- 分析页面下方分组 -->
  <div class="dimension relative h-full flex items-center" @dragover="dragoverHandler" @drop="dropHandler">
    <div class="dimension__header flex items-center justify-between">
      <span class="dimension__title">分组</span>
      <icon-park
        class="cursor-pointer"
        v-if="hasClearAll('dimensions')"
        type="clear"
        size="12"
        fill="#333"
        @click="clearAll('dimensions')"
      />
    </div>
    <div class="dimension__content flex items-center flex-1">
      <div
        data-action="drag"
        class="dimension__item mx-1"
        v-for="(item, index) in dimensionList"
        :key="`${item.columnName || 'dimension'}-${index}`"
        draggable="true"
        @dragstart.native="dragstartHandler(index, $event)"
        @drag.native="dragHandler(index, $event)"
        @mousedown.stop
      >
        <selector-dimension
          :class="[
            'dimension__item__name',
            {
              'dimension__item__name--path': drillEnabled && getDrillLevelState(index) === 'path'
            }
          ]"
          cast="dimension"
          :columnName="item.columnName"
          :displayName="getDimensionDisplayName(item, index)"
          :dimension="item"
          :index="index"
          :invalid="getDimensionInvalid(item)"
          :invalidMessage="getDimensionInvalidMessage(item)"
          :drill-enabled="drillEnabled"
          :drill-level-state="getDrillLevelState(index)"
          :drill-path-value="dimensionStore.getDrillPath[index]?.value"
          :current-level-label="currentDrillDimension ? getDimensionLabel(currentDrillDimension) : ''"
          :next-level-label="nextDrillDimension ? getDimensionLabel(nextDrillDimension) : ''"
          :can-drill-down="canDrillDown"
          :available-drill-values="availableDrillValues"
          @roll-up="handleRollUpFromMenu(index)"
          @drill-down="handleDrillDownFromMenu"
          @select-drill-value="handleSelectDrillValue"
          @reset-drill="dimensionStore.resetDrill()"
        >
          <template v-if="drillEnabled && index < effectiveDrillLevel" #prefix-icon>
            <el-tooltip content="钻取路径：右键可上卷" placement="top">
              <icon-park class="dimension__path-icon" type="filter" size="12" fill="#909399" />
            </el-tooltip>
          </template>
          <template v-else-if="drillEnabled && index === effectiveDrillLevel" #prefix-icon>
            <el-tooltip content="当前粒度：按此维度分组并查询" placement="top">
              <icon-park class="dimension__current-icon" type="focus" size="13" fill="#337ecc" />
            </el-tooltip>
          </template>
        </selector-dimension>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPark } from '@icon-park/vue-next/es/all'
import { ElMessage } from 'element-plus'
import { useAnalyzeDrill } from '../../useAnalyzeDrill'
import { clearAllHandler } from '../clearAll'
import { moveFieldToDimensions } from '../fieldTransfer'
const { clearAll, hasClearAll } = clearAllHandler()

const columnStore = useColumnsStore()
const measureStore = useMeasuresStore()
const dimensionStore = useDimensionsStore()
const analyzeStore = useAnalyzeStore()
const { effectiveDrillLevel, currentDrillDimension, nextDrillDimension, getDimensionLabel } = useAnalyzeDrill()
/**
 * @desc dimensionList
 */
const dimensionList = computed(() => {
  return dimensionStore.getDimensions
})

const dimensionColumnCountMap = computed(() => {
  return dimensionList.value.reduce<Record<string, number>>((countMap, item) => {
    if (!item.columnName) return countMap
    countMap[item.columnName] = (countMap[item.columnName] || 0) + 1
    return countMap
  }, {})
})

const measureColumnSet = computed(() => {
  return new Set(measureStore.getMeasures.map((item) => item.columnName).filter(Boolean))
})

const drillEnabled = computed(() => dimensionList.value.length > 1)
const canDrillDown = computed(() => {
  return (
    drillEnabled.value &&
    effectiveDrillLevel.value < dimensionList.value.length - 1 &&
    dimensionStore.getSelectedDrillValue !== null &&
    typeof dimensionStore.getSelectedDrillValue !== 'undefined' &&
    dimensionStore.getSelectedDrillValue !== ''
  )
})

const availableDrillValues = computed(() => {
  const dimension = currentDrillDimension.value
  if (!dimension?.columnName) return []
  const valueSet = new Set<string>()
  analyzeStore.getAnalyzeData.forEach((row) => {
    const value = row[dimension.columnName]
    if (value === null || typeof value === 'undefined' || value === '') return
    valueSet.add(String(value))
  })
  return Array.from(valueSet).map((value) => ({
    label: value,
    value
  }))
})

const getDrillLevelState = (index: number): 'path' | 'current' | 'next' | 'future' => {
  if (index < effectiveDrillLevel.value) return 'path'
  if (index === effectiveDrillLevel.value) return 'current'
  if (index === effectiveDrillLevel.value + 1) return 'next'
  return 'future'
}

const getDimensionDisplayName = (dimension: DimensionStore.DimensionOption, index: number) => {
  const label = getDimensionLabel(dimension)
  if (index < effectiveDrillLevel.value) {
    const value = dimensionStore.getDrillPath[index]?.value
    return `${label}=${value ?? ''}`
  }
  return label
}

const handleRollUpFromMenu = (index: number) => {
  dimensionStore.rollUpTo(index)
}

const handleSelectDrillValue = (value: DimensionStore.DrillPathItem['value']) => {
  dimensionStore.setSelectedDrillValue(value)
}

const handleDrillDownFromMenu = (overrideValue?: DimensionStore.DrillPathItem['value']) => {
  if (!currentDrillDimension.value || !nextDrillDimension.value) return
  const value = overrideValue ?? dimensionStore.getSelectedDrillValue
  if (value === null || typeof value === 'undefined' || value === '') {
    ElMessage.warning(`请先通过右键菜单选择「${getDimensionLabel(currentDrillDimension.value)}」值`)
    return
  }
  dimensionStore.drillDown({
    dimension: currentDrillDimension.value,
    value
  })
}

const getDimensionInvalid = (dimension: DimensionStore.DimensionOption) => {
  return getDimensionInvalidMessage(dimension) !== ''
}

const getDimensionInvalidMessage = (dimension: DimensionStore.DimensionOption) => {
  if (!dimension.columnName) return ''
  if ((dimensionColumnCountMap.value[dimension.columnName] || 0) > 1) {
    return '该分组已存在'
  }
  if (measureColumnSet.value.has(dimension.columnName)) {
    return '该字段已在值中使用'
  }
  return ''
}

/**
 * @desc getTargetIndex
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {number}
 */
const getTargetIndex = (index: number, dragEvent: DragEvent): number => {
  const dropX = dragEvent.clientX
  let xs = [].slice
    .call(document.querySelectorAll('.dimension__content > [data-action="drag"]'))
    .map(
      (element: HTMLDivElement) => (element.getBoundingClientRect().left + element.getBoundingClientRect().right) / 2
    )
  xs.splice(index, 1)
  let targetIndex = xs.findIndex((middleX) => dropX < middleX)
  if (targetIndex === -1) {
    targetIndex = xs.length
  }
  return targetIndex
}

/**
 * @desc dragstartHandler
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragstartHandler = (index: number, dragEvent: DragEvent) => {
  dragEvent.dataTransfer?.setData(
    'text',
    JSON.stringify({
      from: 'dimensions',
      index,
      value: dimensionList.value[index]
    })
  )
  // 不做任何自定义拖影，保持和值字段一致
}
/**
 * @desc dragHandler
 * @param {number} index
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragHandler = (_index: number, dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}
/**
 * @desc dragoverHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dragoverHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
}
/**
 * @desc dropHandler
 * @param {DragEvent} dragEvent
 * @returns {void}
 */
const dropHandler = (dragEvent: DragEvent) => {
  dragEvent.preventDefault()
  const data: DragData<ColumnsStore.ColumnOptions> = JSON.parse(dragEvent.dataTransfer?.getData('text') || '{}')
  if (!data.value) return
  const index = data.index
  switch (data.from) {
    case 'dimensions': {
      // relocate position by dragging
      const targetIndex = getTargetIndex(data.index, dragEvent)
      if (targetIndex === data.index) return
      const dimensions = JSON.parse(JSON.stringify(dimensionStore.getDimensions))
      const target = dimensions.splice(data.index, 1)[0]
      dimensions.splice(targetIndex, 0, target)
      dimensionStore.setDimensions(dimensions)
      break
    }
    case 'measures':
      moveFieldToDimensions(data.value, { from: data.from, index })
      break
    default: {
      // 更新列名 主要是显示已经选中的标志
      columnStore.updateColumn({ column: data.value, index })
      moveFieldToDimensions(data.value, { from: 'columns', index })
      break
    }
  }
}
</script>

<style lang="scss" scoped>
.dimension {
  .dimension__content {
    list-style: none;
    overflow: auto;

    .dimension__item {
      cursor: move;
      position: relative;
    }
  }

  .dimension__current-icon,
  .dimension__path-icon {
    flex: 0 0 auto;
    margin-right: 4px;
  }

  .dimension__item__name--path {
    :deep(.chart-selector-container) {
      background-color: #f7f8fa;
      border-color: #dcdfe6;
      color: #606266;
    }
  }
}
</style>
