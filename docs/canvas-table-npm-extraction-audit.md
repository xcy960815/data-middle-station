# Canvas Table NPM 抽离可行性审计

> 审计日期：2026-06-14
> 审计范围：`components/table-chart/` 全部文件及其对外依赖链

本文档记录将 `table-chart` 组件抽离为独立 npm 包时存在的所有问题，按严重程度分层。

---

## 一、阻塞性问题（不解决则无法编译/运行）

### 1.1 `index.vue` 与宿主应用深度耦合

`index.vue` 作为组件的对外入口，直接依赖了宿主应用的 4 个 Pinia store（全部通过 Nuxt 自动导入，无显式 import）和 2 个共享业务模块：

| 依赖                                    | 类型        | 来源                                   |
| --------------------------------------- | ----------- | -------------------------------------- |
| `useChartConfigStore`                   | Pinia store | `stores/chart-config.ts`               |
| `useAnalyzeStore`                       | Pinia store | `stores/`                              |
| `useDimensionsStore`                    | Pinia store | `stores/`                              |
| `useMeasuresStore`                      | Pinia store | `stores/`                              |
| `defaultAnalyzeTableChartConfig`        | 业务函数    | `shared/analyzeChartConfigDefaults.ts` |
| `buildAnalyzeTableColumnsFromFields` 等 | 业务函数    | `shared/analyzeTableColumnConfig.ts`   |

此外还使用了 Nuxt 内置的 `<client-only>` 组件。

**改造方向**：只导出 `canvas-table.vue` 作为 npm 包入口，将 `index.vue` 留在宿主项目；或将 `index.vue` 改写为纯 props 驱动的通用 wrapper。

### 1.2 全局命名空间类型（零 import，全靠 ambient declare）

组件内大量使用以下全局命名空间类型，它们定义在宿主项目的 `types/` 目录下，以 `declare namespace` 方式注入，组件内没有任何显式 import：

| 类型                                   | 使用范围                                                                                                   | 定义文件                                 |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `CanvasTable.ColumnOption`             | 10/12 个 `.ts` 文件，数十处引用                                                                            | `types/plugins/CanvasTable.d.ts`         |
| `AnalyzeDataVo.AnalyzeData`            | `parameter.ts`, `runtime-state.ts`, `data-handler.ts`, `body-handler.ts`, `utils.ts`, `cell-editor.vue` 等 | `types/domain/vo/AnalyzeDataVo.d.ts`     |
| `AnalyzeConfigVo.TableChartConfigItem` | `index.vue`                                                                                                | `types/domain/vo/AnalyzeConfigVo.d.ts`   |
| `AnalyzeConfigDao.TableColumnSetting`  | `index.vue`                                                                                                | `types/domain/dao/AnalyzeConfigDao.d.ts` |
| `DimensionStore.DimensionOption`       | `index.vue`                                                                                                | `types/store/DimensionStore.d.ts`        |
| `MeasureStore.MeasureOption`           | `index.vue`                                                                                                | `types/store/MeasureStore.d.ts`          |

类型依赖链很深：`CanvasTable.ColumnOption` → `DimensionStore.DimensionOption` → `ColumnsStore.ColumnOptions` + `import('@/shared/analyzeConfigFieldRules')`。要搬走这些类型，等于带走半个 `types/` 和 `shared/` 目录。

**改造方向**：在包内建立自包含的类型定义，用显式 import 替代全局命名空间。

---

## 二、架构隐患（多实例场景下会出问题）

### 2.1 模块级单例变量

以下变量定义在模块顶层，所有组件实例共享同一份引用，页面同时渲染多个 `<canvas-table>` 时会互相干扰：

| 变量             | 文件               | 影响                                                                                            |
| ---------------- | ------------------ | ----------------------------------------------------------------------------------------------- |
| `currentContext` | `parameter.ts`     | 所有实例共享同一个 active context，异步回调（列宽拖拽 mouseup、编辑器提交）可能拿到错误 context |
| `_resizeRAFId`   | `stage-handler.ts` | ResizeObserver 防抖 ID 全局唯一，多实例互相取消对方的 RAF                                       |
| `tablePerfState` | `perf.ts`          | 所有实例共享同一份性能指标，数据会串                                                            |
| `textWidthCache` | `utils.ts`         | 共享缓存，不影响正确性（低优先级）                                                              |

**改造方向**：将实例级状态绑定到 `canvas-table.vue` 的 `<script setup>` 作用域，或通过 `provide/inject` 向下传递。

### 2.2 Konva Stage 单例

`stageVars` 在 `stage-handler.ts` 中以模块级变量存储，虽然通过 Proxy 代理访问，但底层仍指向最后一个 `initStage()` 调用创建的 Stage。多实例需要各自持有独立的 Stage 引用。

---

## 三、工程细节（容易修复但不能遗漏）

### 3.1 SSR 兼容性

大量直接使用浏览器 API 的代码缺少环境守卫：

| API                                         | 涉及文件                                                                               |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `window.addEventListener`                   | `stage-handler.ts`, `cell-editor.vue`, `filter-dropdown.vue`, `summary-dropdown.vue`   |
| `document.createElement/addEventListener`   | `utils.ts`（有守卫）, `cell-editor.vue`, `filter-dropdown.vue`, `summary-dropdown.vue` |
| `ResizeObserver`                            | `stage-handler.ts`                                                                     |
| `requestAnimationFrame`                     | `stage-handler.ts`, `canvas-table.vue`, `perf.ts`                                      |
| `window.pageXOffset/innerHeight/innerWidth` | `utils.ts`, `filter-dropdown.vue`, `summary-dropdown.vue`                              |

目前靠 `index.vue` 的 `<client-only>` 兜底，npm 包需要自行处理或在文档中标注 client-only。

### 3.2 `<teleport to="body">`

`cell-editor.vue`、`filter-dropdown.vue`、`summary-dropdown.vue` 三个组件均使用 `<teleport to="body">`，依赖 `document.body` 存在，SSR 环境下会报错。

### 3.3 `konva/lib/Node` 子路径导入

`header-handler.ts`、`summary-handler.ts`、`body-handler.ts`、`cell-editor.vue`、`filter-dropdown.vue`、`summary-dropdown.vue` 中使用了 `import type { KonvaEventObject } from 'konva/lib/Node'`。部分 bundler（特别是 Rollup）可能无法解析此子路径，建议改为从 `konva` 主入口 import 或使用 `import type`。

### 3.4 SCSS scoped styles

`.vue` 文件中使用了 `<style scoped lang="scss">`，消费方需要配置 `sass` 依赖，或在发包时预编译为 CSS。

### 3.5 手写 `.vue.d.ts` 声明文件

`cell-editor.vue.d.ts`、`filter-dropdown.vue.d.ts`、`summary-dropdown.vue.d.ts` 中使用了 `~/types/...` 路径别名，发包后该别名不存在，需要更新或移除。

---

## 四、第三方依赖清单

| 包名    | 使用范围                                                        | 建议                    |
| ------- | --------------------------------------------------------------- | ----------------------- |
| `konva` | 核心渲染引擎，几乎所有文件                                      | 作为 `peerDependencies` |
| `vue`   | `parameter.ts`, `runtime-state.ts`, `perf.ts`, 所有 `.vue` 文件 | 作为 `peerDependencies` |

---

## 五、改造优先级总结

| 优先级 | 改造项                                       | 工作量                            |
| ------ | -------------------------------------------- | --------------------------------- |
| P0     | 收拢全局命名空间类型为包内显式类型定义       | 大（类型链深，涉及 6 个命名空间） |
| P0     | 剥离 `index.vue` 宿主耦合层，改为 props 驱动 | 中                                |
| P1     | 模块级单例改为实例级状态                     | 中                                |
| P2     | SSR 守卫 / client-only 文档标注              | 小                                |
| P2     | `konva/lib/Node` 子路径导入修复              | 小                                |
| P2     | `.vue.d.ts` 路径别名清理                     | 小                                |
| P3     | SCSS 预编译或 peerDep 声明                   | 小                                |
