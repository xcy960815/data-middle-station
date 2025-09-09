# 图表邮件发送功能

## 功能概述

这个功能允许您将 G2 图表导出为高清图片，并通过邮件发送给指定收件人。解决了在前端页面中图表与其他 DOM 节点混合的问题，实现单独导出图表的需求。

## 主要特性

- ✅ **单独导出图表**：只导出图表内容，不包含页面其他元素
- ✅ **高清图片**：支持 PNG/JPEG 格式，可自定义质量
- ✅ **邮件发送**：美观的 HTML 邮件模板，支持多个收件人
- ✅ **批量操作**：支持同时导出多个图表
- ✅ **类型安全**：完整的 TypeScript 支持
- ✅ **错误处理**：完善的错误处理和用户反馈

## 核心组件

### 1. ChartExporter 工具类

```typescript
import { ChartExporter } from '~/utils/chart-export'

// 导出图表为 Base64
const base64Image = await ChartExporter.exportChartAsBase64(chartInstance, {
  type: 'image/png',
  quality: 1,
  width: 800,
  height: 600
})

// 导出图表为 Buffer（服务端使用）
const buffer = await ChartExporter.exportChartAsBuffer(chartInstance)

// 直接下载图表
await ChartExporter.downloadChart(chartInstance, 'my-chart')
```

### 2. useChartEmail 组合式函数

```typescript
const { sendEmailFromChartRef, downloadCharts } = useChartEmail()

// 从图表组件发送邮件
await sendEmailFromChartRef(
  chartRef1, // 图表引用
  '销售报表', // 图表标题
  {
    to: ['manager@company.com'],
    subject: '每日数据报告',
    additionalContent: '请查看最新的数据分析结果'
  }
)
```

### 3. ChartEmailService 服务端服务

```typescript
import { ChartEmailService } from '~/server/service/chartEmailService'

const service = new ChartEmailService()
await service.sendChartEmail({
  to: ['user@example.com'],
  subject: '数据报告',
  charts: chartEmailData
})
```

## 使用方法

### 前端集成

1. **在图表组件中添加导出功能**：

所有图表组件（PieChart、IntervalChart、LineChart）已经内置了导出方法：

```vue
<template>
  <PieChart ref="pieChartRef" :data="chartData" :title="chartTitle" />
</template>

<script setup>
const pieChartRef = ref()

// 导出图表
const exportChart = async () => {
  const base64 = await pieChartRef.value.exportAsImage({
    type: 'image/png',
    quality: 1
  })
}

// 下载图表
const downloadChart = async () => {
  await pieChartRef.value.downloadChart('my-pie-chart')
}
</script>
```

2. **在操作栏中使用邮件功能**：

操作栏组件已经集成了邮件发送功能，点击"邮件"按钮即可使用。

### API 端点

#### POST /api/sendChartEmail

发送包含图表的邮件：

```typescript
// 请求体
{
  "to": ["user@example.com"],
  "subject": "数据分析报告",
  "charts": [
    {
      "title": "销售趋势",
      "base64Image": "data:image/png;base64,iVBOR...",
      "filename": "sales_trend"
    }
  ],
  "additionalContent": "请查看最新的销售数据分析"
}

// 响应
{
  "success": true,
  "messageId": "12345",
  "message": "邮件发送成功，包含 1 个图表"
}
```

## 邮件模板

邮件采用响应式 HTML 模板，包含：

- 📊 专业的头部设计
- 📈 图表展示区域
- 📋 额外说明内容
- 📧 系统信息和联系方式

## 技术实现

### 图表导出原理

1. **DOM 截图**：使用 html2canvas 库对图表容器进行截图
2. **转换为图片**：将截图的 Canvas 转换为 Base64 格式的图片
3. **尺寸处理**：支持自定义输出尺寸，保持图片清晰度
4. **跨域支持**：配置 CORS 选项确保图片资源正常加载

### 邮件发送流程

1. **前端导出**：图表组件导出 Base64 图片
2. **API 调用**：将图片数据发送到服务端
3. **邮件生成**：服务端生成 HTML 邮件内容
4. **附件处理**：将 Base64 图片转换为邮件附件
5. **发送邮件**：使用 Nodemailer 发送邮件

## 配置说明

### 邮件服务器配置

确保在 `.env` 文件中配置了邮件服务器信息：

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-password
SMTP_FROM=Data Platform <noreply@example.com>
```

### 图表导出配置

可以自定义图表导出参数：

```typescript
const exportOptions = {
  type: 'image/png', // 图片格式
  quality: 1, // 图片质量 (0-1)
  width: 1200, // 输出宽度
  height: 800 // 输出高度
}
```

## 错误处理

系统提供了完善的错误处理机制：

- **图表导出失败**：提示用户重试或检查图表状态
- **邮件地址验证**：验证邮件地址格式
- **网络错误**：提供用户友好的错误信息
- **服务端错误**：记录详细日志便于排查

## 性能优化

- **异步处理**：图表导出和邮件发送均为异步操作
- **错误恢复**：单个图表导出失败不影响其他图表
- **内存管理**：及时清理临时创建的 Canvas 元素
- **批量处理**：支持同时处理多个图表，提高效率

## 未来扩展

- 📅 **定时报告**：支持定时自动发送图表报告
- 📱 **移动端适配**：优化移动设备上的邮件显示
- 🎨 **自定义模板**：支持用户自定义邮件模板
- 📊 **数据洞察**：在邮件中包含自动生成的数据分析结论

## 使用示例

完整的使用示例请参考：`examples/chart-email-usage.vue`

这个功能完美解决了您提到的问题：在包含多个 DOM 节点的页面中，能够单独导出和发送 G2 图表，而不会包含其他页面元素。
