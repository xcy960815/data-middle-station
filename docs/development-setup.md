# 开发环境配置指南

## ESLint 9 + Prettier 代码规范配置

本项目已升级到 ESLint 9 的扁平化配置，并配置了 Prettier 进行代码格式化。

### 主要配置文件

- `eslint.config.js` - ESLint 9 扁平化配置文件
- `.prettierrc` - Prettier 配置文件
- `.prettierignore` - Prettier 忽略文件配置
- `.editorconfig` - 编辑器通用配置
- `package.json` - 包含 lint-staged 预提交钩子配置

### VS Code 开发配置

项目已配置 VS Code 工作区设置：

- `.vscode/settings.json` - 编辑器设置，包含自动格式化和 ESLint 修复
- `.vscode/extensions.json` - 推荐安装的扩展

### 推荐的 VS Code 扩展

```json
{
  "recommendations": [
    "Vue.volar", // Vue 3 官方语言支持
    "Vue.vscode-typescript-vue-plugin", // Vue TypeScript 插件
    "esbenp.prettier-vscode", // Prettier 代码格式化
    "dbaeumer.vscode-eslint", // ESLint 代码检查
    "ms-vscode.vscode-typescript-next", // TypeScript 增强支持
    "editorconfig.editorconfig", // EditorConfig 支持
    "bradlc.vscode-tailwindcss", // Tailwind CSS 支持
    "eamodio.gitlens", // Git 增强
    "formulahendry.auto-rename-tag", // 自动重命名标签
    "christian-kohler.path-intellisense" // 路径智能感知
  ]
}
```

### 可用的脚本命令

```bash
# 代码检查
pnpm lint

# 代码检查并自动修复
pnpm lint:fix

# 代码格式化
pnpm format

# 检查格式化是否正确
pnpm format:check
```

### 预提交钩子

项目配置了 Husky + lint-staged，在每次提交前会自动：

1. 对 `*.{js,ts,vue}` 文件执行 ESLint 检查和修复
2. 对所有支持的文件类型执行 Prettier 格式化

### Git 提交规范

使用 Conventional Commits 规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

类型包括：

- `feat`: 新功能
- `fix`: 修复
- `docs`: 文档
- `style`: 样式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建过程或辅助工具的变动

### 全局变量配置

ESLint 已配置以下全局变量，无需导入：

#### Nuxt 全局变量

- `defineNuxtPlugin`, `defineEventHandler`, `defineNuxtConfig`
- `useNuxtApp`, `useState`, `useFetch`, `navigateTo` 等

#### Vue 全局变量

- `defineComponent`, `defineProps`, `defineEmits`
- `ref`, `reactive`, `computed`, `watch` 等
- `onMounted`, `onUnmounted`, `inject`, `provide` 等

#### Pinia Store 相关

- `defineStore`
- `useAnalyseStore`, `useColumnsStore` 等项目自定义 store 函数

#### 项目自定义类型

- `ChartDataVo`, `GroupStore`, `AnalyseVo` 等业务类型

### 开发流程

1. **安装依赖**

   ```bash
   pnpm install
   ```

2. **开发前检查**

   ```bash
   pnpm lint
   pnpm format:check
   ```

3. **开发过程中**
   - VS Code 会自动在保存时格式化代码
   - ESLint 会实时提示代码问题

4. **提交代码**
   ```bash
   git add .
   git commit -m "feat: 新功能描述"
   ```
   预提交钩子会自动运行代码检查和格式化

### 故障排除

#### ESLint 报错 "Cannot use import statement"

确保使用的是 `eslint.config.js`（CommonJS 格式）而不是 ES 模块格式。

#### Prettier 和 ESLint 冲突

项目已配置 Prettier 优先，ESLint 主要负责代码质量检查。

#### VS Code 无法自动格式化

1. 检查是否安装了推荐的扩展
2. 确保 `.vscode/settings.json` 配置正确
3. 重启 VS Code

#### 预提交钩子失败

```bash
# 手动运行检查
pnpm lint:fix
pnpm format

# 如果仍有问题，可以跳过钩子（不推荐）
git commit --no-verify
```

### 配置更新历史

- **v1.0.0** - 初始化 ESLint 8 + Prettier 配置
- **v2.0.0** - 升级到 ESLint 9 扁平化配置，添加完整的全局变量支持
