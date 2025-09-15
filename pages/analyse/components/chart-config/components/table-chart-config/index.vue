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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('enableRowHoverHighlight')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableRowHoverHighlight"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 行高亮背景色 -->
    <el-form-item label="行高亮背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">行高亮背景色</span>
          <el-tooltip content="行高亮背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('highlightRowBackground')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.highlightRowBackground" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 列高亮 -->
    <el-form-item label="列高亮">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">列高亮</span>
          <el-tooltip content="启用后，鼠标悬停时，列会高亮" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('enableColHoverHighlight')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-switch
        @change="handleUpdateTableConfig"
        v-model="tableChartConfig.enableColHoverHighlight"
        style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
      />
    </el-form-item>
    <!-- 列高亮背景色 -->
    <el-form-item label="列高亮背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">列高亮背景色</span>
          <el-tooltip content="列高亮背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('highlightColBackground')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-color-picker v-model="tableChartConfig.highlightColBackground" @change="handleUpdateTableConfig" show-alpha />
    </el-form-item>
    <!-- 高亮 cell 背景色 -->
    <el-form-item label="高亮 cell 背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">高亮 cell 背景色</span>
          <el-tooltip content="启用后，鼠标悬停时，cell 会高亮" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('highlightCellBackground')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('headerRowHeight')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-input
        v-model.number="tableChartConfig.headerRowHeight"
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('headerFontFamily')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('headerFontSize')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-input
        v-model.number="tableChartConfig.headerFontSize"
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('headerTextColor')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('headerBackground')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bodyRowHeight')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-input
        v-model.number="tableChartConfig.bodyRowHeight"
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bodyFontFamily')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bodyFontSize')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-input
        v-model.number="tableChartConfig.bodyFontSize"
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bodyTextColor')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bodyBackgroundOdd')"
            />
          </el-tooltip>
        </span>
      </template>
      <div class="flex items-center gap-2">
        <el-color-picker v-model="tableChartConfig.bodyBackgroundOdd" @change="handleUpdateTableConfig" show-alpha />
      </div>
    </el-form-item>
    <!-- 表格偶数行背景色 -->
    <el-form-item label="表格偶数行背景色">
      <template #label>
        <span class="el-form-item__slot flex items-center">
          <span class="mr-2 el-form-item-label">表格偶数行背景色</span>
          <el-tooltip content="表格偶数行背景色" placement="top">
            <icon-park type="Info" size="16" fill="#ccc" />
          </el-tooltip>
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bodyBackgroundEven')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('borderColor')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('enableSummary')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('summaryRowHeight')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-input
        v-model.number="tableChartConfig.summaryRowHeight"
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('summaryFontFamily')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('summaryFontSize')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-input
        v-model.number="tableChartConfig.summaryFontSize"
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('summaryTextColor')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('summaryBackground')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('scrollbarSize')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('scrollbarBackground')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('scrollbarThumb')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('scrollbarThumbHover')"
            />
          </el-tooltip>
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
          <el-tooltip content="重置" placement="top">
            <icon-park
              class="ml-auto reset-icon"
              type="Refresh"
              size="16"
              fill="#666"
              @click="handleResetTableConfig('bufferRows')"
            />
          </el-tooltip>
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
  if (chartsConfigStore.privateChartConfig?.table) {
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

<style scoped lang="scss">
// 重置图标样式
.reset-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 4px;
  padding: 2px;

  &:hover {
    fill: #409eff !important;
    background-color: rgba(64, 158, 255, 0.1);
    transform: rotate(90deg);
  }

  &:active {
    transform: rotate(90deg) scale(0.95);
  }
}

// 表单项样式美化
.el-form {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-form-item__label {
      font-weight: 500;
      color: #374151;
      margin-bottom: 8px;
    }

    .el-form-item__slot {
      .el-form-item-label {
        font-size: 14px;
        font-weight: 500;
        color: #374151;
      }
    }
  }

  // 分割线样式
  :deep(.el-divider) {
    margin: 32px 0 24px 0;

    .el-divider__text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 600;
      font-size: 14px;
      padding: 0 16px;
    }

    &::before,
    &::after {
      border-top: 2px solid #e5e7eb;
    }
  }

  // 开关样式
  :deep(.el-switch) {
    --el-switch-on-color: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --el-switch-off-color: #e5e7eb;

    .el-switch__core {
      border-radius: 12px;
      height: 22px;
      min-width: 44px;

      &::after {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
    }

    &.is-checked .el-switch__core::after {
      background: white;
    }
  }

  // 输入框样式
  :deep(.el-input) {
    .el-input__wrapper {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      &.is-focus {
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
    }
  }

  // 选择器样式
  :deep(.el-select) {
    .el-select__wrapper {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      &.is-focus {
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
    }
  }

  // 颜色选择器样式
  :deep(.el-color-picker) {
    .el-color-picker__trigger {
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
      border: 2px solid #e5e7eb;

      &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-color: #d1d5db;
      }
    }
  }
}

// 信息图标样式
:deep(.el-tooltip__trigger) {
  .icon-park[type='Info'] {
    transition: all 0.3s ease;

    &:hover {
      fill: #409eff !important;
      transform: scale(1.1);
    }
  }
}

// 颜色选择器和重置按钮的容器
.flex.items-center.gap-2 {
  .el-color-picker {
    flex: 1;
  }

  .reset-icon {
    flex-shrink: 0;
  }
}
</style>
