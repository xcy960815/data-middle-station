# Types 目录

此目录包含项目的 TypeScript 类型定义文件 (`.d.ts`)。

## 目录结构

- **`domain/`**: 领域特定的类型定义。
- **`store/`**: Pinia store 的状态和 action 类型定义。
- **`plugins/`**: Vue 插件的类型定义。
- **`ApiResponse.d.ts`**: API 响应接口定义。
- **`BasicLanguages.d.ts`**: 基础语言类型定义。
- **`FullScreen.d.ts`**: 全屏 API 类型定义。
- **`MonacoEditor.d.ts`**: Monaco Editor 相关类型定义。
- **`env.d.ts`**: 环境变量类型定义。
- **`vue-shims.d.ts`**: Vue 文件垫片 (shim) 定义。

## 使用说明

这些类型通过 `tsconfig.json` 自动包含在项目中。您可以全局使用它们，也可以根据需要导入。
