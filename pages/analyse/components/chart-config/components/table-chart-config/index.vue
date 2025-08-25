<template>
  <el-form label-position="top" label-width="auto" :model="tableChartConfig">
    <el-divider content-position="left">高亮与交互</el-divider>
    <!-- 行高亮 -->
    <el-form-item label="行高亮">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">行高亮</span>
          <el-tooltip content="启用后，鼠标悬停时，行会高亮" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('enableRowHoverHighlight')" size="small"
            >重置</el-button
          >
        </span>
      </template>
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableRowHoverHighlight"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 列高亮 -->
    <el-form-item label="列高亮">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">列高亮</span>
          <el-tooltip content="启用后，鼠标悬停时，列会高亮" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('enableColHoverHighlight')" size="small"
            >重置</el-button
          >
        </span>
      </template>
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableColHoverHighlight"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 高亮 cell 背景色 -->
    <el-form-item label="高亮 cell 背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">高亮 cell 背景色</span>
          <el-tooltip content="启用后，鼠标悬停时，cell 会高亮" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('highlightCellBackground')" size="small"
            >重置</el-button
          >
        </span>
      </template>
      <el-color-picker
        v-model="tableChartConfig.highlightCellBackground"
        @change="handleUpdateTableConfig"
        show-alpha
      />
    </el-form-item>

    <el-divider content-position="left">表头</el-divider>
    <!-- 表头高度 -->
    <el-form-item label="表头高度">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表头高度</span>
          <el-tooltip content="表头高度" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('headerHeight')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.headerHeight"
        placeholder="表头高度"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 表头字体 -->
    <el-form-item label="表头字体">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表头字体</span>
          <el-tooltip content="表头字体" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('headerFontFamily')" size="small">重置</el-button>
        </span>
      </template>
      <el-select
        v-model="tableChartConfig.headerFontFamily"
        placeholder="请选择表头字体"
        @change="handleUpdateTableConfig"
      >
        <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <!-- 表头字体大小 -->
    <el-form-item label="表头字体大小">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表头字体大小</span>
          <el-tooltip content="表头字体大小" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('headerFontSize')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.headerFontSize"
        placeholder="表头字体大小"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 表头文本颜色 -->
    <el-form-item label="表头文本颜色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表头文本颜色</span>
          <el-tooltip content="表头文本颜色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('headerTextColor')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.headerTextColor" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 表头背景色 -->
    <el-form-item label="表头背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表头背景色</span>
          <el-tooltip content="表头背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('headerBackground')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.headerBackground" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>

    <el-divider content-position="left">正文</el-divider>
    <!-- 行高 -->
    <el-form-item label="行高">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">行高</span>
          <el-tooltip content="行高" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bodyRowHeight')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.bodyRowHeight"
        placeholder="行高"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 表格字体 -->
    <el-form-item label="表格字体">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格字体</span>
          <el-tooltip content="表格字体" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bodyFontFamily')" size="small">重置</el-button>
        </span>
      </template>
      <el-select
        v-model="tableChartConfig.bodyFontFamily"
        placeholder="请选择表格字体"
        @change="handleUpdateTableConfig"
      >
        <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <!-- 表格字体大小 -->
    <el-form-item label="表格字体大小">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格字体大小</span>
          <el-tooltip content="表格字体大小" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bodyFontSize')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.bodyFontSize"
        placeholder="表格字体大小"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 表格文本颜色 -->
    <el-form-item label="表格文本颜色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格文本颜色</span>
          <el-tooltip content="表格文本颜色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bodyTextColor')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.bodyTextColor" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 表格奇数行背景色 -->
    <el-form-item label="表格奇数行背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格奇数行背景色</span>
          <el-tooltip content="表格奇数行背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bodyBackgroundOdd')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.bodyBackgroundOdd" @change="handleUpdateTableConfig" show-alpha />
      <el-button type="text" @click="handleResetTableConfig('bodyBackgroundOdd')" size="small">重置</el-button>
    </el-form-item>
    <!-- 表格偶数行背景色 -->
    <el-form-item label="表格偶数行背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格偶数行背景色</span>
          <el-tooltip content="表格偶数行背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bodyBackgroundEven')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.bodyBackgroundEven" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 表格边框颜色 -->
    <el-form-item label="表格边框颜色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格边框颜色</span>
          <el-tooltip content="表格边框颜色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('borderColor')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.borderColor" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>

    <el-divider content-position="left">汇总行</el-divider>
    <el-form-item label="是否展示汇总行">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">是否展示汇总行</span>
          <el-tooltip content="是否展示汇总行" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('enableSummary')" size="small">重置</el-button>
        </span>
      </template>
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableSummary"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 汇总行高度 -->
    <el-form-item label="汇总行高度">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">汇总行高度</span>
          <el-tooltip content="汇总行高度" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('summaryHeight')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.summaryHeight"
        placeholder="汇总行高度"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 汇总行字体 -->
    <el-form-item label="汇总行字体">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">汇总行字体</span>
          <el-tooltip content="汇总行字体" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('summaryFontFamily')" size="small">重置</el-button>
        </span>
      </template>
      <el-select
        v-model="tableChartConfig.summaryFontFamily"
        placeholder="请选择汇总行字体"
        @change="handleUpdateTableConfig"
      >
        <el-option v-for="item in fontFamilyOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
    </el-form-item>
    <!-- 汇总行字体大小 -->
    <el-form-item label="汇总行字体大小">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">汇总行字体大小</span>
          <el-tooltip content="汇总行字体大小" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('summaryFontSize')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.summaryFontSize"
        placeholder="汇总行字体大小"
        @blur="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 汇总行文本颜色 -->
    <el-form-item label="汇总行文本颜色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">汇总行文本颜色</span>
          <el-tooltip content="汇总行文本颜色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('summaryTextColor')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.summaryTextColor" @change="handleUpdateTableConfig" />
    </el-form-item>
    <!-- 汇总行背景色 -->
    <el-form-item label="汇总行背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">汇总行背景色</span>
          <el-tooltip content="汇总行背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('summaryBackground')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.summaryBackground" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>

    <el-divider content-position="left">滚动条</el-divider>
    <!-- 滚动条大小 -->
    <el-form-item label="滚动条大小">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">滚动条大小</span>
          <el-tooltip content="滚动条大小" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('scrollbarSize')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.scrollbarSize"
        placeholder="滚动条大小"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
    <!-- 滚动条背景色 -->
    <el-form-item label="滚动条背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">滚动条背景色</span>
          <el-tooltip content="滚动条背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('scrollbarBackground')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.scrollbarBackground" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 滚动条滑块颜色 -->
    <el-form-item label="滚动条滑块颜色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">滚动条滑块颜色</span>
          <el-tooltip content="滚动条滑块颜色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('scrollbarThumb')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.scrollbarThumb" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 滚动条滑块悬停颜色 -->
    <el-form-item label="滚动条滑块悬停颜色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">滚动条滑块悬停颜色</span>
          <el-tooltip content="滚动条滑块悬停颜色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('scrollbarThumbHover')" size="small">重置</el-button>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.scrollbarThumbHover" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>

    <el-divider content-position="left">性能</el-divider>
    <!-- 缓冲行数 -->
    <el-form-item label="缓冲行数">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">缓冲行数</span>
          <el-tooltip content="缓冲行数" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-button type="text" @click="handleResetTableConfig('bufferRows')" size="small">重置</el-button>
        </span>
      </template>
      <el-input
        v-model="tableChartConfig.bufferRows"
        placeholder="缓冲行数"
        @change="handleUpdateTableConfig"
      ></el-input>
    </el-form-item>
  </el-form>
</template>

<script lang="ts" setup>
import { IconPark } from '@icon-park/vue-next/es/all'

/**
 * @desc 图表配置store
 */
const chartsConfigStore = useChartConfigStore()

/**
 * @desc 表格配置数据
 */
const tableChartConfig = reactive<ChartConfigStore.TableChartConfig>({ ...defaultTableChartConfig })

onMounted(() => {
  if (chartsConfigStore.privateChartConfig.table) {
    Object.assign(tableChartConfig, chartsConfigStore.privateChartConfig.table)
  }
})

/**
 * @desc 更新表格配置
 * @returns {void}
 */
const handleUpdateTableConfig = (): void => {
  chartsConfigStore.setTableChartConfig(tableChartConfig)
}

/**
 * @desc 重置表格配置
 * @returns {void}
 */
const handleResetTableConfig = <K extends keyof ChartConfigStore.TableChartConfig>(chartConfigKey?: K): void => {
  if (chartConfigKey) {
    tableChartConfig[chartConfigKey] = defaultTableChartConfig[chartConfigKey]
  } else {
    Object.assign(tableChartConfig, defaultTableChartConfig)
  }
  handleUpdateTableConfig()
}

/**
 * @desc 字体选项
 */
const fontFamilyOptions = [
  {
    label: '系统默认',
    value: 'system-ui, -apple-system, Segoe UI, Roboto, Arial, Noto Sans, Ubuntu, sans-serif'
  },
  {
    label: '微软雅黑',
    value: "'Microsoft YaHei', sans-serif"
  },
  {
    label: '苹方',
    value: "'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif"
  },
  {
    label: '宋体',
    value: "'SimSun', 'STSong', serif"
  },
  {
    label: '黑体',
    value: "'SimHei', 'STHeiti', sans-serif"
  },
  {
    label: 'Arial',
    value: 'Arial, Helvetica, sans-serif'
  },
  {
    label: 'Times New Roman',
    value: "'Times New Roman', Times, serif"
  }
]
</script>

<style scoped lang="scss"></style>
