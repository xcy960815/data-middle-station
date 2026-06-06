# 分析配置字段收拢复盘与 Review 清单

## 背景

分析页配置原来把字段元信息和字段行为配置混在同一层，例如排序的 `orderType`、`aggregationType`，过滤的 `filterType`、`filterValue`、`aggregationType`。这类字段名过于通用，跨“排序 / 过滤 / 值 / 分组”复用时容易产生语义混淆，也会让后续扩展不断在平铺字段上加新属性。

这次调整目标是把 4 类分析配置统一改成“字段元信息 + 行为规则对象”的结构：

```ts
type MeasureOption = ColumnItem & {
  measureRule: {
    aggregation?: MeasureAggregationType
  }
}

type DimensionOption = ColumnItem & {
  dimensionRule: {}
}

type FilterOption = ColumnItem & {
  filterRule: {
    operator: FilterType
    operand?: string
    aggregation?: FilterAggregationType
  }
}

type OrderOption = ColumnItem & {
  orderRule: {
    direction: OrderType
    aggregation?: OrderAggregationType
  }
}
```

## 本次改动记录

### Order

排序从平铺字段收拢为 `orderRule` 对象：

- `orderType` -> `orderRule.direction`
- `aggregationType` -> `orderRule.aggregation`

这样排序字段的方向和排序时使用的聚合口径都归在 `orderRule` 下，避免和过滤、值字段的聚合概念混在一起。

### Filter

过滤从平铺字段收拢为 `filterRule` 对象：

- `filterType` -> `filterRule.operator`
- `filterValue` -> `filterRule.operand`
- `aggregationType` -> `filterRule.aggregation`

`filterRule` 表达过滤字段的行为规则，`operator / operand / aggregation` 比 `type / value` 更明确：`operator` 是操作符，`operand` 是右侧操作数，`aggregation` 是过滤作用于原始字段还是聚合表达式。

### Measure

值字段从单独聚合字段收拢为 `measureRule` 对象：

- `aggregationType` -> `measureRule.aggregation`

`measureRule` 后续可以继续承载值字段自己的行为配置，例如展示口径、格式化规则、计算方式等。类型上也从排序聚合类型改回 `MeasureAggregationType`，避免 `raw` 这种排序/过滤可用但值字段不应使用的类型混进来。

### Dimension

分组字段新增 `dimensionRule` 对象：

- 当前先保存为 `dimensionRule: {}`
- 查询逻辑暂不消费该字段

这是为后续日期粒度、层级、分组桶等能力预留结构。当前不引入兼容转换，也不做左手倒右手的运行时 normalize。

### Columns

`columns` 只作为分析编辑器左侧候选字段的运行态数据，不再保存到 `analyze_config` 历史配置中。分析历史只保存真正参与查询和展示的 `measures / dimensions / filters / orders / chart config`。

### SQL 与文档

- `sql/data_middle_station.sql` 中的分析配置示例已按新结构清洗。
- `docs/project-documentation.md` 已记录新的 `analyze_config` JSON 结构。
- `scripts/` 下旧运维脚本和分析查询快照脚本已删除，避免保留不再维护的入口。

## Review 重点

### 1. 命名是否合理

- 行为对象名是否贴近业务语义：`orderRule / filterRule / measureRule / dimensionRule`。
- 对象内部字段是否比旧字段更清楚：`direction / aggregation / operator / operand`。
- 是否还有过于泛化的名字，例如无上下文的 `type / value / config / option`。
- 类型名是否归属正确领域，例如值字段只能依赖 `MeasureAggregationType`，不要复用 `OrderAggregationType`。

### 2. 是否有左手倒右手的方法调用

- 是否存在只为了兼容旧结构的 `normalizeXxx`、`mapOldToNew`、`resolveLegacyXxx`。
- 是否存在 A 方法只包一层调用 B 方法，但没有增加约束、校验或业务含义。
- 是否存在前端保存时转一次、服务端查询前又转一次的重复结构转换。
- 是否存在对象字段已经是最终结构，却仍被重新 clone / remap 成同样结构。

### 3. 是否可以精简

- 新增 helper 是否真的减少重复，还是只是把一行对象字面量藏起来。
- Store action、组件事件、service 入参是否有重复中转。
- 类型声明是否可以直接引用 shared 类型，而不是在 dao / vo / store 多处重复定义同名结构。
- 已删除 `scripts/` 后，package、docs、CI 是否还有失效命令或说明。
- 追求最优实现时也要保持代码清晰明了；不要为了“更通用”引入难读的抽象、隐式约定或过深的调用链。

### 4. 是否破坏功能

- 新建分析、编辑分析、保存历史版本、切换历史版本是否都写入新结构。
- 分析页查询入参是否只传有效字段，不把候选 `columns` 写入配置历史。
- 邮件、看板、历史配置读取是否都消费新结构。
- SQL 初始化数据和代码类型是否一致。

### 5. 前后端边界是否清楚

- 页面组件只负责交互和展示，不应承担 SQL 语义判断。
- Store 只管理状态，不应隐藏复杂数据迁移逻辑。
- API 只接收入参和调用 service，不应拼 SQL。
- 查询语义应集中在 `AnalyzeQueryBuilder`，不要散落在组件里。

### 6. 类型是否能约束错误

- `MeasureAggregationType` 不应包含 `raw`。
- `OrderAggregationType` 和 `FilterAggregationType` 可以包含 `raw`。
- 可选字段要符合真实业务：例如 `aggregation?` 可以缺省，由查询构造器按场景决定默认值。
- 如果一个字段运行时必需，类型上不要为了省事写成可选。

### 7. 数据清洗是否彻底

- 数据库初始化 SQL 不应再出现旧分析配置字段。
- 不做兼容时，要确认线上旧数据是否已通过 SQL 清洗。
- 示例数据、文档 JSON、类型声明要保持一致。
- 日志表里的历史错误文本可以保留，但不能误认为业务配置仍在使用旧字段。

### 8. UI 交互是否仍然直观

- 排序切换方向时，聚合默认值是否符合预期。
- 值字段只有在存在分组时才展示聚合选择，明细表不应误导用户。
- 过滤的操作符、操作数、聚合选择是否仍能表达原始过滤和聚合过滤。
- 拖拽字段到不同区域时，新建对象是否带上正确默认规则。

### 9. TypeScript 类型是否清晰

- Review 前要检查 IDE / TS 插件是否还有类型报错，尤其是聚合类型跨领域误用，例如把 `OrderAggregationType` 传给值字段。
- 类型声明要清晰明了，不要把多个领域揉成一个大类型；排序、过滤、值、分组应该分别有自己的规则类型。
- shared 类型只放跨层稳定复用的领域定义；只在组件内部使用的临时类型应留在组件内，不要上升到 shared。
- dao / vo / store 类型要表达各自边界，不要为了省事互相穿透到难以判断来源。
- 类型别名如果只是换个名字但没有提供更清楚的领域语义，应考虑删除或直接引用原类型。
- `*.d.ts` 文件只放声明，不放运行时代码；创建默认对象的函数应放在 `shared/*.ts` 或实际业务模块里。

### 10. 文件位置是否合理

- 字段规则类型如果被前端、服务端、store 共同使用，优先放在 `shared/`。
- 只属于分析页拖拽或 UI 创建逻辑的函数，应留在 `pages/analyze/components/fieldTransfer.ts` 或对应组件附近。
- 查询语义和 SQL 规则应留在 `server/service/analyzeQueryBuilder.ts`，不要放进 shared 或组件。
- Store 类型放 `types/store`，接口持久化结构放 `types/domain/dao`、返回给前端的结构放 `types/domain/vo`。
- 如果一个文件只为绕开循环依赖或路径引用而存在，应重新评估是不是抽象过度。
- 字段规则类型集中放在 `shared/analyzeFieldRules.ts`，避免为几行规则拆出过多模块；如果后续某类规则明显膨胀，再按领域拆分。
- 字段规则的默认创建和规则字段变更也集中放在 `shared/analyzeFieldRules.ts`，组件不要直接手写 rule 对象或到处修改 `xxxRule.xxx`。

### 11. Selector Template 交互是否一致

- `selector-template` 应只负责通用外观、字段名称、无效态、删除按钮和基础弹层承载，不要直接理解排序、过滤、值、分组的业务细节。
- `selector-measure / selector-dimension / selector-filter / selector-order` 应作为各领域 wrapper，负责各自右键菜单、弹层和业务事件。
- 四个 wrapper 使用 `selector-template` 时要保持一致：`displayName / cast / invalid / invalidMessage / index` 必须通过显式 props 和显式传参进入 template，不要藏在 `$attrs` 里。
- wrapper 组件应设置 `inheritAttrs: false`；`$attrs` 只用于处理 `class` 这类非业务属性，不要用 `v-bind="$attrs"` 宽泛转发核心参数。
- `cast` 当前用于删除逻辑和默认无效提示；如果后续 wrapper 自己承担删除，应评估是否还能移除 template 对 store 的直接依赖。
- 插槽命名要能表达位置和用途：`measure-suffix / order-aggregation / order-direction / filter-action / prefix-icon`，避免同一个插槽在不同领域承担不同含义。
- 交互入口要一致：点击用于打开普通选择弹层，右键用于上下文菜单；如果某个标签只能右键操作，应考虑 cursor 和 tooltip 是否能让用户理解。
- 删除、无效提示、聚合标签、方向图标、过滤图标都应保持固定尺寸，避免字段名过长时挤压或换行。
- `chart-selector-container` 的高度、间距、ellipsis 和 trailing 区域要覆盖四种区域，不应让某个区域单独写一套外观。
- 弹层关闭职责要清楚：template 只暴露 `closePopover`，具体选择成功后由调用方决定是否关闭。

## 建议的 Review 路径

1. 从类型开始看：`types/domain/dao`、`types/domain/vo`、`types/store`、`shared/*`。
2. 再看字段创建入口：`pages/analyze/components/fieldTransfer.ts`。
3. 再看 4 个配置组件：`measure / dimension / filter / order`。
4. 再看 selector 交互：`components/selector/template` 和 `components/selector/{measure,dimension,filter,order}`。
5. 再看请求组装：`pages/analyze/useAnalyzeDataHandler.ts`、看板相关配置读取。
6. 最后看服务端查询：`server/service/analyzeQueryBuilder.ts`。
7. 对照 `sql/data_middle_station.sql` 和 `docs/project-documentation.md`，确认数据结构一致。

## 当前已知取舍

- 不保留旧字段兼容逻辑，旧数据通过 SQL 清洗。
- `dimensionRule` 当前只是结构占位，不改变查询行为。
- 删除分析查询快照脚本后，SQL 拼装缺少专项自动回归测试；后续如果要补测试，建议放到正式测试目录和 package test 体系里，不再放 `scripts/`。
- 当前 lint 仍有一个既有 warning：`pages/analyze/components/column/index.vue` 中 `ref` 未使用。
