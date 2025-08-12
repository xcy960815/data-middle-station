# VSCode Nuxt3 调试配置测试

## 🔧 问题修复

之前的错误是因为Nuxt3使用ES模块格式，可执行文件是 `nuxt.mjs` 而不是 `nuxt.js`。

## ✅ 已修复的配置

所有调试配置中的 `program` 路径已从：
```json
"program": "${workspaceFolder}/node_modules/nuxt/bin/nuxt.js"
```

更新为：
```json
"program": "${workspaceFolder}/node_modules/nuxt/bin/nuxt.mjs"
```

## 🧪 测试调试配置

### 1. 基本测试
1. 按 `F5` 启动调试
2. 选择 `Nuxt3: 开发模式调试`
3. 应该能正常启动，不再出现 "MODULE_NOT_FOUND" 错误

### 2. 断点测试
1. 在任意 `.vue` 文件中设置断点
2. 启动调试
3. 访问对应页面，断点应该能正常触发

### 3. 环境变量测试
1. 确保 `env/.env.daily` 文件存在
2. 启动调试后检查环境变量是否正确加载

## 🚨 如果仍有问题

### 检查依赖
```bash
# 重新安装依赖
pnpm install

# 检查nuxt版本
pnpm list nuxt
```

### 检查环境文件
```bash
# 确保环境文件存在
ls -la env/.env.daily
ls -la env/.env.pre
ls -la env/.env.prod
```

### 检查Node.js版本
```bash
# 确保Node.js版本兼容
node --version
# 推荐: v16+ 或 v18+
```

## 🎯 推荐调试流程

1. **开发阶段**: 使用 `Nuxt3: 开发模式调试`
2. **问题排查**: 使用 `Nuxt3: 检查器调试`
3. **全栈调试**: 使用 `Nuxt3: 全栈调试 (服务器 + 客户端)`

## 📱 调试快捷键

- `F5` - 继续执行
- `F10` - 单步跳过
- `F11` - 单步进入
- `Shift+F11` - 单步跳出
- `Shift+F5` - 停止调试
- `F9` - 设置/取消断点

## 🔍 调试面板功能

- **变量**: 查看当前作用域的变量值
- **监视**: 添加要监视的表达式
- **调用堆栈**: 查看函数调用链
- **断点**: 管理所有断点
- **控制台**: 执行JavaScript表达式

现在你的VSCode调试配置应该可以正常工作了！
