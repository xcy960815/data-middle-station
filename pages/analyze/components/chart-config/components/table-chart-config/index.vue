<template>
  <el-form label-position="top" label-width="auto" :model="tableChartConfig">
    <el-divider content-position="left">列配置</el-divider>
    <div class="table-column-toolbar">
      <el-button size="small" @click="handleSyncTableColumns">同步字段</el-button>
      <el-button size="small" @click="handleResetAllTableColumns">重置全部</el-button>
    </div>
    <el-empty v-if="tableColumnRows.length === 0" description="暂无表格列" :image-size="64" />
    <div v-else class="table-column-config-list">
      <div
        v-for="column in tableColumnRows"
        :key="`${column.role}-${column.columnName}`"
        class="table-column-config-row"
      >
        <div class="table-column-config-row__header">
          <div class="table-column-config-row__title">
            <span class="table-column-config-row__name">{{ getTableColumnLabel(column) }}</span>
            <span class="table-column-config-row__field">{{ column.columnName }}</span>
          </div>
          <div class="table-column-config-row__actions">
            <el-tag size="small" effect="plain">{{ column.role === 'dimension' ? '分组' : '值' }}</el-tag>
            <el-button link size="small" @click="handleResetTableColumn(column)">重置</el-button>
          </div>
        </div>
        <div class="table-column-config-row__controls">
          <label class="table-column-config-control">
            <span>宽度</span>
            <el-input-number
              size="small"
              controls-position="right"
              :min="1"
              :max="2000"
              :model-value="column.width || undefined"
              @change="handleUpdateTableColumn(column, { width: Number($event) || null })"
            />
          </label>
          <label class="table-column-config-control">
            <span>固定</span>
            <el-select
              size="small"
              :model-value="column.fixed ?? ''"
              @change="handleUpdateTableColumnFixed(column, $event)"
            >
              <el-option label="无" value="" />
              <el-option label="左" value="left" />
              <el-option label="右" value="right" />
            </el-select>
          </label>
          <label class="table-column-config-control">
            <span>对齐</span>
            <el-select
              size="small"
              :model-value="column.align ?? ''"
              @change="handleUpdateTableColumnAlign(column, $event)"
            >
              <el-option label="默认" value="" />
              <el-option label="左" value="left" />
              <el-option label="中" value="center" />
              <el-option label="右" value="right" />
            </el-select>
          </label>
          <label class="table-column-config-switch">
            <span>表头过滤</span>
            <el-switch
              size="small"
              :model-value="Boolean(column.filterable)"
              @change="handleUpdateTableColumn(column, { filterable: Boolean($event) })"
            />
          </label>
          <label class="table-column-config-switch">
            <span>排序</span>
            <el-switch
              size="small"
              :model-value="Boolean(column.sortable)"
              @change="handleUpdateTableColumn(column, { sortable: Boolean($event) })"
            />
          </label>
        </div>
      </div>
    </div>

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
              @click="handleResetTableConfig('scrollbarThumbBackground')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-color-picker
        v-model="tableChartConfig.scrollbarThumbBackground"
        @change="handleUpdateTableConfig"
        show-alpha
      />
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
              @click="handleResetTableConfig('scrollbarThumbHoverBackground')"
            />
          </el-tooltip>
        </span>
      </template>
      <el-color-picker
        v-model="tableChartConfig.scrollbarThumbHoverBackground"
        @change="handleUpdateTableConfig"
        show-alpha
      />
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
import {
  defaultAnalyzeIntervalChartConfig,
  defaultAnalyzeLineChartConfig,
  defaultAnalyzePieChartConfig,
  defaultAnalyzeTableChartConfig
} from '@/shared/analyzeChartConfigDefaults'
import {
  buildAnalyzeTableColumnsFromFields,
  createDefaultAnalyzeTableColumnUi,
  type AnalyzeTableColumnSetting
} from '@/shared/analyzeTableColumnConfig'
import { IconPark } from '@icon-park/vue-next/es/all'

/**
 * @desc 图表配置store
 */
const chartsConfigStore = useChartConfigStore()
const dimensionStore = useDimensionsStore()
const measureStore = useMeasuresStore()

/**
 * @desc 表格配置数据（直接读写 store，避免本地副本造成双源）
 */
const tableChartConfig = computed<ChartConfigStore.TableChartConfig>({
  get() {
    return chartsConfigStore.privateChartConfig?.table ?? defaultAnalyzeTableChartConfig
  },
  set(value: ChartConfigStore.TableChartConfig) {
    const current = chartsConfigStore.privateChartConfig
    chartsConfigStore.setPrivateChartConfig({
      line: current?.line ?? defaultAnalyzeLineChartConfig,
      table: value,
      pie: current?.pie ?? defaultAnalyzePieChartConfig,
      interval: current?.interval ?? defaultAnalyzeIntervalChartConfig
    })
  }
})

const dimensionFields = computed(() => dimensionStore.getDimensions)
const measureFields = computed(() => measureStore.getMeasures)

const tableColumnRows = computed(() =>
  buildAnalyzeTableColumnsFromFields(dimensionFields.value, measureFields.value, tableChartConfig.value.columns || [])
)

const tableColumnFieldMap = computed(() => {
  const entries = [...dimensionFields.value, ...measureFields.value].map((field) => [field.columnName, field] as const)
  return new Map(entries)
})

const getTableColumnLabel = (column: AnalyzeTableColumnSetting) => {
  const field = tableColumnFieldMap.value.get(column.columnName)
  return field?.displayName || field?.columnComment || column.columnName
}

const setTableColumns = (columns: AnalyzeTableColumnSetting[]) => {
  tableChartConfig.value = { ...tableChartConfig.value, columns }
}

const createDefaultTableColumns = (): AnalyzeTableColumnSetting[] => [
  ...dimensionFields.value.map((field) => ({
    columnName: field.columnName,
    role: 'dimension' as const,
    ...createDefaultAnalyzeTableColumnUi()
  })),
  ...measureFields.value.map((field) => ({
    columnName: field.columnName,
    role: 'measure' as const,
    ...createDefaultAnalyzeTableColumnUi()
  }))
]

const handleUpdateTableColumn = (column: AnalyzeTableColumnSetting, patch: Partial<AnalyzeTableColumnSetting>) => {
  const nextColumns = tableColumnRows.value.map((item) =>
    item.columnName === column.columnName && item.role === column.role ? { ...item, ...patch } : item
  )
  setTableColumns(nextColumns)
}

const handleUpdateTableColumnFixed = (column: AnalyzeTableColumnSetting, fixed: unknown) => {
  const normalizedFixed = fixed === 'left' || fixed === 'right' ? fixed : null
  handleUpdateTableColumn(column, { fixed: normalizedFixed })
}

const handleUpdateTableColumnAlign = (column: AnalyzeTableColumnSetting, align: unknown) => {
  const normalizedAlign = align === 'left' || align === 'center' || align === 'right' ? align : null
  handleUpdateTableColumn(column, { align: normalizedAlign })
}

const handleResetTableColumn = (column: AnalyzeTableColumnSetting) => {
  handleUpdateTableColumn(column, createDefaultAnalyzeTableColumnUi())
}

const handleSyncTableColumns = () => {
  setTableColumns(tableColumnRows.value)
}

const handleResetAllTableColumns = () => {
  setTableColumns(createDefaultTableColumns())
}

/**
 * @desc 更新表格配置（v-model 已通过 computed setter 写入 store，此处保留兼容）
 * @returns {void}
 */
const handleUpdateTableConfig = (): void => {
  // no-op: v-model write already persists via computed setter
}

/**
 * @desc 重置表格配置
 * @returns {void}
 */
const handleResetTableConfig = <K extends keyof ChartConfigStore.TableChartConfig>(chartConfigKey?: K): void => {
  if (chartConfigKey) {
    tableChartConfig.value = {
      ...tableChartConfig.value,
      [chartConfigKey]: defaultAnalyzeTableChartConfig[chartConfigKey]
    }
  } else {
    tableChartConfig.value = { ...defaultAnalyzeTableChartConfig }
  }
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
      width: 100%;
      gap: 8px;
      min-width: 0;

      > :last-child {
        margin-left: auto;
        flex-shrink: 0;
      }

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

.table-column-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.table-column-config-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-column-config-row {
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.table-column-config-row__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.table-column-config-row__title {
  flex: 1;
  min-width: 0;
}

.table-column-config-row__actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 6px;
}

.table-column-config-row__name,
.table-column-config-row__field {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-column-config-row__name {
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
}

.table-column-config-row__field {
  margin-top: 2px;
  color: #909399;
  font-size: 12px;
}

.table-column-config-row__controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
}

.table-column-config-control,
.table-column-config-switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 34px;
  min-width: 0;
  gap: 12px;
  padding: 6px 0;
  border-top: 1px solid #f3f4f6;
  color: #606266;
  font-size: 12px;
}

.table-column-config-control > span,
.table-column-config-switch > span {
  flex: 0 0 64px;
  color: #374151;
  font-weight: 500;
}

:deep(.table-column-config-control .el-input-number),
:deep(.table-column-config-control .el-select) {
  width: 168px;
}
</style>
