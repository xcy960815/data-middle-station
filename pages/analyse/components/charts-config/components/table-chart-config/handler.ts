

type HandlerParams = {
    conditionDialogVisible: Ref<boolean>
    conditionsState: {
        conditions: Array<ChartConfigStore.TableChartConfigConditionOption>
    }
}


export const handler = ({ conditionDialogVisible, conditionsState }: HandlerParams) => {
    const chartsConfigStore = useChartConfigStore()

    /**
     * @desc 打开条件格式dialog
     * @returns void
     */
    const handleOpenConditionDialog = (): void => {
        conditionDialogVisible.value = true
        conditionsState.conditions = JSON.parse(JSON.stringify(chartsConfigStore.chartConfig.table.conditions))
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
            conditionType: "单色",
            // 条件字段
            conditionField: "",
            // 条件符号
            conditionSymbol: "gt",
            // 最小范围值
            conditionMinValue: "",
            // 最大范围值
            conditionMaxValue: "",
            // 条件值
            conditionValue: "",
            // 条件颜色
            conditionColor: "",
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
        const inputNodeList = document.querySelectorAll<HTMLInputElement>('.condition-color-select  input');
        if (inputNodeList && inputNodeList.length) {
            const inputNode = inputNodeList[index];
            inputNode.style.color = color;
            inputNode.style.fontSize = '16px';
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

    return {
        handleOpenConditionDialog,
        handleAddCondition,
        handleColorChange,
        handleDeleteCondition,
        handleConfirm
    }
}