# Canvas Table Native Scroll Proxy 改造复盘与避坑指南

这份文档用于记录 Canvas Table 从“纯 Canvas 手绘滚动条”迁移到“原生 DOM 滚动代理 (Native Scroll Proxy)”过程中的核心关键点与设计陷阱。供后续介入的 AI 模型或开发者在阅读和修改 `canvas-table` 源码时参考（Review）。

## 核心改造思路

之前的实现中，滚动条是由 Konva 绘制在 Canvas 内部的 `verticalScrollbarGroup` 和 `horizontalScrollbarGroup`。这种方式有几个致命缺点：无法支持触控板的高精度平滑滚动（惯性滚动）、事件节流卡顿。

**改造后方案 (Native Scroll Proxy)**：
在表格上方浮动一个全尺寸、具有原生 `overflow: auto` 的代理层 (`.scroll-proxy`)，内部用一个透明的撑开层 (`.virtual-spacer`) 按照所有列/行的总宽高进行撑满。当原生代理层发生滚动时，同步将 `scrollTop/scrollLeft` 的值同步给 Canvas 触发重绘。

## ⚠️ 关键避坑指南 (Gotchas)

### 1. 容器宽度与 `scrollbarSize` 的减法陷阱

- **原逻辑**：纯 Canvas 时期，为了给手绘滚动条留出空间，我们在计算 `stageWidth` 和列宽时，需要**主动在代码中减去**配置项里的 `scrollbarSize` (`stageWidth = stageWidthRaw - scrollbarSize`)。
- **现逻辑（大坑）**：改成原生滚动代理后，`.scroll-proxy` 设置了 `overflow: auto`。在大部分操作系统（尤其是 Windows）下，原生滚动条自身占据了物理尺寸，这会导致**代理层内的可用宽度（`clientWidth`）自动减小了滚动条的宽度**。
- **结论**：**绝对不要再在代码里手动减去 `scrollbarSize`**。如果继续扣减，会导致最右侧出现等于 `scrollbarSize` 像素的空白间距，因为原生的 `clientWidth` 已经将那部分空间留给了真实滚动条。计算 Stage 宽度时直接使用取到的 `stageWidthRaw` 即可。

### 2. `.virtual-spacer` (虚拟撑开层) 必须设置为绝对定位

- **原逻辑**：由于之前没有代理层，Canvas 容器自己控制位置。
- **现逻辑（大坑）**：我们在外层包了 `.scroll-proxy`，里面放了用于撑出真实高度的 `.virtual-spacer`，紧跟着放了 `.canvas-sticky-wrapper`。
- **结论**：`.virtual-spacer` **必须**设置为 `position: absolute` 且 `pointer-events: none`。如果它以块级元素出现在正常文档流中，它所占据的真实高度会将后续的 Canvas 容器硬生生地向下“挤”，导致可视区域顶部留出巨大空白且错位。

### 3. 用户主题配置的 CSS Variables 穿透

- 以前的 `scrollbarSize` 和颜色直接传给 Konva 的 Rect 填充属性。
- 改为原生滚动条后，组件的配置并未失效，我们通过计算属性绑定到 `--sb-size`, `--sb-track-bg`, `--sb-thumb-bg` 等 CSS 变量，并在 CSS 中使用 `::-webkit-scrollbar` 将用户的原业务配置完美应用到了原生滚动条上，实现了“偷天换日”。

---

**后续模型 Review 指引**：
当你需要处理 Canvas 表格排版、宽度计算、列宽分配，或是修复滚动边界被遮挡等 Bug 时，请首先回看本篇文档的第 1 点，时刻牢记：**Canvas 的可用宽度严格受原生外层容器宽度的物理影响。**
