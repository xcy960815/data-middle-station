# Canvas Table 终极开源改造计划 (NPM Publish TodoList)

> [!NOTE]
> 当前的 Canvas-Table 在特定业务流内表现良好，但如果要发布为通用的 Vue 3 / Vanilla JS 开源数据表格库（类似 S2 或 canvas-datagrid），需要进行彻底的底层解耦与渲染架构升级。

这份清单按照优先级和实施阶段分为四部分，指明了通往“最终版本”的关键重构步骤。

---

## 阶段一：底层滚动架构升级（最核心改造）

**目标：摒弃纯 Canvas 的物理滚动模拟，引入原生滚动代理（Native Scroll Proxy），彻底解决触控板体验和边界滚动等交互痛点。**

- [ ] **剥离 Konva 绘制的滚动条**：删除 `scrollbar-handler.ts` 中手绘滚动条矩形和绑定拖拽的逻辑，因为这些工作以后将由原生 DOM 承担。
- [ ] **搭建原生滚动代理层**：
  - 在包裹 `<canvas>` 的容器上方，绝对定位覆盖一个原生 `<div>` (`overflow: auto`)。
  - 在这个透明代理内部放置一个空 `<div>`，动态设置其 `height` 和 `width` 等于表格在当前数据量下的**虚拟总宽高**。
- [ ] **对接原生滚动事件**：
  - 取消在 Canvas 上绑定的 `wheel` 事件，改在代理 `<div>` 上监听原生的 `onscroll` 事件。
  - 当原生滚动发生时，读取其真实的 `scrollTop` 和 `scrollLeft`，将它们精确同步给现有的 `scrollbarVars.stageScrollY` 等变量。
- [ ] **重构渲染节流触发机制**：依托原生滚动事件触发 `refreshTable` 进行可见区域的批量重绘。这将自动解锁 Mac 触控板丝滑的回弹与惯性。

---

## 阶段二：建立透明 DOM 交互层 (Text Selection & A11y)

**目标：赋予 Canvas 表格原生 HTML 表格才有的文本选择与无障碍能力，满足开源库的基础准入条件。**

- [ ] **创建交互 DOM 层**：在 Canvas 上方再次覆盖一个绝对定位的透明层（紧贴表格内容区）。
- [ ] **实现双击/框选文字能力**：
  - 监听鼠标在 Canvas 的拖拽动作，根据坐标映射计算出用户想要选中的单元格。
  - 动态在透明 DOM 层中生成一个包含真实文本的 `<textarea>` 或可选中 `<div>` 覆盖在对应的单元格上。
  - 当用户使用 `Ctrl+C` 或鼠标拖拽时，选中的其实是这个透明层中的真实文本。
- [ ] **支持 Tab 键导航能力 (Focus Management)**：通过隐藏输入框监听焦点，支持键盘 `Tab` 键在虚拟单元格之间无缝切换。

---

## 阶段三：彻底解耦业务逻辑与强依赖

**目标：抽离 Nuxt 框架与业务代码强绑定，使组件框架无关或变成纯净的 Vue 3 通用库。**

- [ ] **移除 Pinia 强依赖**：
  - 目前 `canvas-table/index.vue` 强依赖了 `useChartConfigStore`、`useAnalyzeStore` 等业务状态。
  - **改造方案**：将所有状态全部提升为标准的 `props` (传入配置与数据) 和 `emits` / `v-model` (输出宽度修改、值变动、事件)。内部使用 `reactive` 或普通的 `ref` 管理运行时状态。
- [ ] **剥离业务字段处理**：像 `mergeAnalyzeFieldWithTableColumn` 这样的数据组装逻辑应该由宿主业务项目进行，NPM 组件只接收统一的 Columns JSON Schema（如 Ant Design Table 的 `columns` 配置）。
- [ ] **提供对外的 Imperative API**：
  - 使用 `defineExpose` 对外暴露例如 `scrollTo(x, y)`、`scrollToRow(index)`、`getSelection()`、`exportCsv()` 等标准 API。

---

## 阶段四：NPM 工程化与文档

**目标：标准库打包、类型导出与示例文档搭建。**

- [ ] **剥离到独立的包/库结构**：如果仍然放在当前仓库，需要配置 Monorepo（比如 pnpm workspaces）新建一个 `packages/canvas-table`。
- [ ] **Vite / Rollup Library 模式打包配置**：
  - 配置 `vite.config.ts` 的 `build.lib` 选项。
  - 剔除 `konva` 以外的大型依赖，或将其标记为 `peerDependencies`。
- [ ] **生成完整的 d.ts 类型定义文件**：向外暴露出所有配置项参数类型（如 `CanvasTableColumn`, `TableThemeConfig` 等）。
- [ ] **编写完善的 README 和 Demo 文档**：包括快速起步、API 参考、性能压测报告。
