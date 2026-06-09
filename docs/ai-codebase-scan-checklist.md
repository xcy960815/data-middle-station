# AI 生成代码扫描清单与改造建议

这份文档用于系统性扫描当前项目中可能由 AI 生成、拼接或反复演化后留下的问题，并作为后续“不计成本优化改造”的执行清单。

目标不是一次性大重构，而是把项目拆成可逐步推进的模块，按统一标准做体检、收敛和验证。

## 适用范围

- `pages/` 页面与页面级组合逻辑
- `components/` 复用组件与图表组件
- `stores/` Pinia 状态
- `server/api -> server/service -> server/mapper` 服务端链路
- `shared/` 共享规则、常量、默认配置
- `types/` 类型声明
- `sql/` 初始化或导出脚本
- `docs/` 项目文档与设计说明

## 使用方式

每次只选一个模块推进，例如：

- 分析页表格链路
- AnalyzeConfig 保存与迁移链路
- Dashboard 渲染链路
- Dataset / DataSource 配置链路
- Shared / Types 命名与死代码清理

每个模块都按“扫描 -> 定位 -> 整理 -> 验证 -> 记录”的顺序推进，不建议同时横扫多个业务域。

## 一、总扫描清单

### 0. 项目级清晰度约束

这些约束优先级高于局部实现习惯，后续无论由人还是 AI 修改代码，都应先遵守这些项目级规则。

#### 业务词汇表

同一个业务概念只能使用一套稳定词汇。代码、类型、JSDoc、文档、接口字段应尽量保持一致。

| 英文名               | 中文含义          | 使用边界                                                            |
| -------------------- | ----------------- | ------------------------------------------------------------------- |
| `analyze`            | 分析              | 分析页、分析配置、分析数据查询                                      |
| `dimension`          | 分组              | 查询维度、分组字段、上卷下钻层级                                    |
| `measure`            | 值/度量           | 聚合指标、统计字段                                                  |
| `filter`             | 筛选              | 查询过滤条件                                                        |
| `order`              | 排序              | 查询排序条件                                                        |
| `column`             | 数据库列 / 表格列 | 需要结合上下文，数据库字段用 `column`，表格私有配置用 `tableColumn` |
| `field`              | 分析字段          | 已进入分析配置区域的字段                                            |
| `rule`               | 查询语义规则      | `measureRule / dimensionRule / filterRule / orderRule`              |
| `privateChartConfig` | 图表私有配置      | 图表样式、图表交互、图表私有 UI 配置                                |
| `tableColumnSetting` | 表格列私有配置    | 表格列宽、固定列、对齐、过滤、排序、编辑等 UI 配置                  |
| `DAO`                | 数据库结构        | mapper 和数据库记录侧类型                                           |
| `VO`                 | 接口返回结构      | API 返回给前端使用的结构                                            |

约束：

- 不要在同一个上下文中混用“字段配置 / 列配置 / 维度配置”表达同一件事。
- 查询语义用 `field / rule`，表格 UI 用 `tableColumn / setting`。
- 文档中第一次出现英文核心词时，应附上中文含义。

#### 数据结构归属表

每类数据必须有明确归属，不允许因为实现方便临时塞到相邻对象里。

| 数据                               | 归属                  | 不应放在                         |
| ---------------------------------- | --------------------- | -------------------------------- |
| `dimensions`                       | 分组查询语义数组      | 表格列宽、固定列、对齐等 UI 字段 |
| `measures`                         | 值/度量查询语义数组   | 表格列宽、固定列、对齐等 UI 字段 |
| `filters`                          | 筛选查询语义数组      | 图表样式、表格渲染状态           |
| `orders`                           | 排序查询语义数组      | 图表样式、表格渲染状态           |
| `commonChartConfig`                | 跨图表通用配置        | 单个图表的私有交互配置           |
| `privateChartConfig`               | 图表私有配置集合      | 查询语义字段数组                 |
| `privateChartConfig.table.columns` | 表格列 UI 配置        | `dimensions / measures`          |
| `stores/*`                         | 页面可复用编辑状态    | 单个图表内部运行时状态           |
| `CanvasTable.*`                    | Canvas 表格渲染态类型 | Store 语义字段类型               |
| `server/mapper`                    | 数据访问和 SQL        | 复杂业务编排                     |
| `server/service`                   | 业务编排和兼容迁移    | 页面交互状态                     |

约束：

- 新增字段前必须先判断它属于查询语义、图表配置、页面状态、渲染态还是数据库结构。
- 如果一个字段只对某个图表有效，优先放在该图表的 `privateChartConfig`。
- 如果一个字段只在渲染时需要，优先放在图表运行时结构，不写回 store。

#### 命名禁用词与慎用词

以下名字不是绝对禁止，但在公共方法、跨层逻辑、复杂对象中应避免直接使用。

慎用变量名：

- `data`
- `item`
- `info`
- `config`
- `list`
- `params`
- `result`
- `temp`
- `newData`
- `oldData`

慎用方法名：

- `handleData`
- `processData`
- `handleConfig`
- `processConfig`
- `dealData`
- `formatData`
- `initData`

替代建议：

- `data` -> `analyzeRows`、`tableColumns`、`dashboardWidgets`
- `config` -> `tableChartConfig`、`privateChartConfig`、`measureRule`
- `result` -> `migrationResult`、`validationResult`、`queryResult`
- `handleData` -> `normalizeAnalyzeRows`、`buildTableColumnsFromFields`
- `processConfig` -> `migrateAnalyzeConfig`、`mergePrivateChartConfig`

#### 复杂度阈值

这些不是机械规则，但超过阈值就必须在扫描报告中说明是否需要拆分。

| 项目                   | 阈值                   | 建议动作                   |
| ---------------------- | ---------------------- | -------------------------- |
| 单函数长度             | 超过 80 行             | 评估拆成 2 到 4 个具名步骤 |
| 单文件长度             | 超过 500 行            | 评估按职责拆文件           |
| 嵌套层级               | 超过 3 层              | 优先提前返回或抽函数       |
| 重复逻辑               | 出现 2 次以上          | 评估是否抽共享 helper      |
| `shared` helper 调用方 | 少于 2 个稳定调用方    | 评估是否收回原文件         |
| `as` 强转              | 同一文件多处出现       | 检查类型边界是否设计错误   |
| JSDoc 缺失             | 导出函数或跨层方法缺失 | 必须补齐                   |

#### AI 改代码交付约束

后续由 AI 执行代码修改时，每次交付都必须说明：

- 改了什么
- 为什么这么改
- 影响范围是什么
- 做了哪些验证
- 没有验证什么
- 是否需要补文档
- 是否引入了临时兼容或迁移逻辑

涉及结构性变化时，还必须额外说明：

- 新的数据归属是什么
- 旧结构如何兼容
- 迁移逻辑是否长期保留
- 如果是临时逻辑，删除条件是什么

#### 示例驱动文档约束

文档不要只写原则，涉及复杂规则时必须给“坏例子 / 好例子”。

坏例子：

```ts
handleConfig(data)
dimension.width = 120
processData(list)
```

好例子：

```ts
buildTableColumnsFromFields(dimensions, measures, existingColumns)
privateChartConfig.table.columns[index].width = 120
normalizeAnalyzeRows(rawRows)
```

### 1. 文件与目录命名

检查项：

- 文件名是否准确表达职责，而不是历史实现细节
- 同类文件命名风格是否统一
- 是否出现一个目录中既有业务名、又有技术名、又有临时名混用
- 是否存在“demo / temp / new / copy / test2”这类临时文件残留
- 是否有共享文件放在业务目录、业务文件放在 `shared/` 的情况

改进建议：

- 页面级逻辑优先以业务名命名，例如 `analyzeConfig`、`dashboardWidget`
- `shared/` 只放跨 2 个以上真实调用方的稳定概念
- 临时迁移文件、一次性清洗脚本、回滚辅助文件，完成后应及时删除

### 2. 方法命名

检查项：

- 方法名是否表达“读取 / 推断 / 构建 / 迁移 / 标准化 / 写回”的真实语义
- 是否存在 `handleXxx`、`processXxx`、`dealXxx` 这种过宽泛命名
- 是否存在 `resolve` 实际上是 `infer`，或 `build` 实际上是 `merge` 的语义错位
- 同一动作是否在不同文件里使用不同命名

改进建议：

- 读取已有数据：`get / read / find`
- 从输入推导结果：`infer`
- 组装新结构：`build`
- 对旧数据做兼容：`migrate`
- 补默认值和清理字段：`normalize`
- 把运行时字段剥离回业务字段：`strip`

### 3. 变量命名

检查项：

- 临时变量是否过于抽象，例如 `data`、`item`、`result`、`config` 连续套娃
- 布尔变量是否能看出判断语义，例如 `flag`、`ok`、`status`
- 是否存在一个变量名在不同上下文中表达不同概念
- 是否有“UI 配置”和“业务语义”共用同一个变量名

改进建议：

- 布尔值优先使用 `is / has / should / can`
- 对比变量使用 `previous / next / current / resolved / normalized`
- 查询字段与渲染字段明确区分，例如 `measureField` vs `tableColumnSetting`

### 4. JSDoc 与注释完整性

检查项：

- 导出的函数、复杂私有函数、跨层调用函数是否缺少 JSDoc
- JSDoc 是否说明函数职责，而不是只复述函数名
- 带参数的方法是否逐个写明 `@param`，包括参数作用和 TypeScript 类型
- 有返回值的方法是否写明 `@returns`，包括返回数据含义和 TypeScript 类型
- 异步方法是否说明 Promise resolve 后的数据结构
- 复杂对象参数是否说明关键字段含义，必要时拆出具名类型
- 注释是否已经过期，仍在描述旧字段、旧接口、旧交互或旧数据结构

改进建议：

- 公共导出函数必须补齐 JSDoc
- 服务端 `api / service / mapper` 方法优先补齐 JSDoc，因为它们是跨层契约
- 复杂前端 composable、store action、图表渲染 helper 也要补齐 JSDoc
- JSDoc 与 TypeScript 类型互补：TS 表达类型，JSDoc 表达业务含义、参数作用、返回语义

推荐格式：

```ts
/**
 * 根据分组字段和值字段构建表格列私有配置。
 * @param dimensions {Array<{ columnName: string } & Record<string, unknown>>} 分组字段列表。
 * @param measures {Array<{ columnName: string } & Record<string, unknown>>} 值字段列表。
 * @param existing {TableColumnSetting[]} 已保存的表格列配置。
 * @returns {TableColumnSetting[]} 与当前字段顺序和角色对齐后的表格列配置。
 */
```

### 5. 死代码

检查项：

- 无调用的导出函数、类型、常量
- 只剩一处使用但抽象过重的共享函数
- 已删除业务后残留的迁移接口、白名单、VO 类型、SQL 检查脚本
- 只在注释或旧文档中出现、代码里已不再使用的概念

改进建议：

- 迁移期接口优先删除，不长期暴露为运行时 API
- 无引用类型直接删除，不要“也许以后会用”
- 只剩单点调用的抽象，评估是否就地收回

### 6. 左手倒右手

检查项：

- 一个对象在 A 层转一次、B 层再转一次、C 层再剥一次
- 同一份数据在 store、组件、服务端之间反复 `map / clone / stringify / parse`
- 前端已经校验过，服务端又重复一套不一致的校验
- 同样的默认值在 `shared`、store、组件里各写一份

改进建议：

- 一个概念只保留一个“主表示”
- 一次转换只负责一个边界：语义字段 -> 渲染字段，或 DAO -> VO
- 默认值统一归口，例如图表默认配置放 `shared/chartDefaults.ts`

### 7. 实现过度复杂

检查项：

- 单文件职责过多，既做状态、又做渲染、又做兼容迁移
- 单方法分支过长，需要滚动很多屏才能理解
- 类型定义为了兼容历史结构而出现多层交叉扩展
- 小问题被做成大抽象，调用方并不多

改进建议：

- 先拆职责，再谈抽象
- “单点逻辑留在原地”，不要为了看起来通用而制造二次复杂度
- 只有 2 个以上稳定调用方，才考虑抽共享 helper

### 8. 分层不合理

检查项：

- 页面直接处理服务端数据兼容逻辑
- API 文件里写复杂业务编排
- Service 里拼过多 SQL 细节
- Mapper 里夹带业务判断
- Store 混入只属于某个图表或某个页面的私有 UI 状态

改进建议：

- `pages/components` 只管交互和展示
- `stores` 只放页面可复用状态，不放图表私有渲染字段
- `api` 负责入参和返回
- `service` 负责业务编排
- `mapper` 负责数据访问

### 9. 类型系统不合理

检查项：

- 语义字段类型和渲染字段类型混在一起
- 运行时已经拆层，类型层仍然糊成一层
- 大量 `as` 强转掩盖真实边界问题
- 同一结构在 `types/domain`、`types/store`、`types/plugins` 重复定义但不一致

改进建议：

- 业务语义类型、存储类型、渲染类型明确分层
- 优先缩小 `as` 的范围，把转换放在边界点
- 迁移结构单独命名，不污染长期类型

### 10. 配置与常量不合理

检查项：

- 默认值散落在多个文件
- `MAP`、`OPTIONS`、`DEFAULTS`、`RULES` 命名混用
- 常量与业务规则耦合过深
- UI 默认配置和查询语义配置放在同一个对象上

改进建议：

- 规则、默认值、选项列表分文件归类
- 名称与用途对齐，例如 `DEFAULT_*`、`*_OPTIONS`、`*_TYPES`
- 表格私有配置与 `dimensions / measures / filters / orders` 分离

### 11. 文档与代码不一致

检查项：

- README、docs、SQL、实际实现不一致
- 文档仍描述旧字段或旧交互
- 迁移完成后没有删除旧说明

改进建议：

- 每完成一轮结构性重构，同步更新 `docs/`
- 删除失效的迁移说明和已废弃接口描述

## 二、建议的模块扫描顺序

按风险和收益排序，建议这样推进：

### 第一批：高收益、高风险

1. 分析页主链路
   - `pages/analyze/`
   - `components/table-chart/`
   - `stores/dimensions.ts / measures.ts / filters.ts / orders.ts / chart-config.ts`

重点：

- 语义字段和渲染字段是否分层清楚
- 图表私有配置是否还挂在错误层级
- 是否存在重复转换、重复默认值、重复兼容逻辑

2. AnalyzeConfig 保存 / 读取链路
   - `server/api/`
   - `server/service/analyzeConfigService.ts`
   - `server/mapper/analyzeConfigMapper.ts`
   - `types/domain/dao|vo/AnalyzeConfig*`

重点：

- 旧数据兼容逻辑是否都收敛到边界
- 一次性清洗能力是否已删除
- DAO / VO / Store / 渲染类型是否串层

### 第二批：中收益、中风险

3. Dashboard 渲染与私有配置透传链路
   - `pages/dashboard/`
   - `components/*-chart/`

重点：

- 各图表组件的 prop 契约是否一致
- `privateChartConfig` 是否存在行为不一致
- 看板链路是否混入分析页编辑态逻辑

4. Dataset / DataSource 链路
   - `pages/data-source/`
   - `pages/dataset/`
   - `server/service/datasetService.ts`
   - `server/service/dataSourceService.ts`

重点：

- 字段配置、语义字段、展示字段是否命名混乱
- DAO / mapper 的转换逻辑是否过深

### 第三批：低风险、长期收益

5. `shared/` 与 `types/`

重点：

- 死类型、死常量、迁移残留
- 命名是否准确表达语义
- 是否有“看起来通用、其实单点使用”的共享抽象

6. `scripts/`、`sql/`、`docs/`

重点：

- 是否保留了已经无效的运维脚本和 SQL
- 文档是否还描述旧结构

## 三、每个模块的执行清单

### A. 入口扫描

- 找到用户真正触发的页面、组件或 API
- 列出调用链
- 区分语义对象、渲染对象、存储对象

输出要求：

- 一段“真实调用链”
- 一段“本模块主数据结构说明”

### B. 命名扫描

- 文件名是否反映职责
- 方法名是否反映真实动作
- 变量名是否反映真实数据含义

输出要求：

- 命名不合理项清单
- 建议改名及理由

### C. JSDoc 扫描

- 导出函数是否有 JSDoc
- 跨层调用方法是否有 JSDoc
- 参数是否逐个写明作用和 TS 类型
- 返回值是否写明数据含义和 TS 类型
- 注释是否与当前实现一致

输出要求：

- 缺失 JSDoc 的方法清单
- JSDoc 不准确或过期的清单
- 建议补齐后的注释模板

### D. 死代码扫描

- 无引用导出
- 已废弃接口
- 迁移残留类型
- 注释与逻辑不一致

输出要求：

- 可直接删除项
- 删除前需要确认的项

### E. 复杂度扫描

- 超长方法
- 过多 `if/else`
- 多层 `map/filter/reduce` 套叠
- 单文件职责过多

输出要求：

- 可直接简化项
- 需要拆模块项

### F. 分层扫描

- 页面是否做了 service 的事
- store 是否做了图表私有配置的事
- mapper 是否做了业务规则判断

输出要求：

- 当前分层问题
- 目标分层建议

### G. 类型扫描

- `as` 强转是否过多
- 类型名是否准确
- 同一概念是否有重复定义

输出要求：

- 类型边界问题清单
- 建议的类型分层方案

### H. 验证与回写

- 至少跑目标文件 `eslint`
- 需要时跑 `tsc --noEmit`
- 把结论写回 `docs/`

## 四、当前项目已暴露的典型问题模式

这些是已经在本仓库里出现过的模式，后续扫描时应优先关注：

1. 语义字段与表格渲染字段混在同一对象上  
   例如 `dimensions / measures` 曾混入 `width / fixed / align / draggable`。

2. 一次性迁移工具长期残留为运行时接口  
   例如历史清洗 API、白名单放行、迁移 VO 类型。

3. 图表组件表面接口一致，内部行为不一致  
   例如 `privateChartConfig` 有的组件从 prop 读，有的只从 store 读。

4. 类型名和行为不一致  
   例如 `resolveXxx` 实际上是 `inferXxx`。

5. 共享抽象已经失去调用方  
   例如死类型、死 helper、只剩单点调用的 shared 方法。

6. 运行时逻辑已经分层，类型和数据结构还保留历史粘连  
   例如 store 类型、Canvas 渲染类型、VO 类型边界混乱。

## 五、建议的改造原则

### 原则 1：先删，再合并，再抽象

顺序优先级：

1. 删除死代码
2. 合并重复逻辑
3. 只在必要时抽共享

### 原则 2：一个概念只保留一个主归属

例如：

- 查询语义属于 `dimensions / measures / filters / orders`
- 表格渲染配置属于 `privateChartConfig.table.columns`
- 图表运行时状态属于图表内部

### 原则 3：迁移逻辑只保留在边界

可保留：

- 保存配置时自动迁移
- DAO -> VO 的兼容层

不应长期保留：

- 面向公网的全库清洗接口
- 页面内临时补丁式兼容代码

### 原则 4：命名服务于维护，而不是服务于当下实现

避免：

- `handleData`
- `processConfig`
- `tempList`
- `newData`

优先：

- `buildTableColumnsFromFields`
- `stripTableColumnUi`
- `inferTableColumnRoleFromField`
- `normalizedDimensions`

## 六、每轮改造的交付模板

每完成一个模块，建议固定输出下面四项：

1. 本轮扫描范围
2. 发现的问题清单
3. 已完成的改造项
4. 剩余风险与下一轮建议

## 七、推荐的第一轮清理目标

如果从收益最大的一轮开始，建议优先做：

1. `components/table-chart/`
2. `pages/analyze/components/chart-config/`
3. `server/service/analyzeConfigService.ts`
4. `shared/` 与 `types/plugins/CanvasTable.d.ts`

原因：

- 这条链路已经暴露出命名、分层、迁移残留、类型边界、共享抽象等多种典型问题
- 一旦这条链路清楚，后面看板和分析配置的很多问题会一起变简单
