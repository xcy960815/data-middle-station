# ==========================================
# Stage 1: Builder (构建阶段)
# ==========================================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm
RUN npm install -g pnpm

# 1. 优先复制依赖描述文件，利用 Docker 缓存
COPY package.json pnpm-lock.yaml ./

# 2. 安装所有依赖 (包括 devDependencies，因为构建需要它们)
RUN pnpm install --frozen-lockfile

# 3. 复制项目源码
COPY . .

# 4. 执行构建
# 增加内存限制防止构建 OOM
RUN NODE_OPTIONS="--max-old-space-size=4096" pnpm run build:prod

# ==========================================
# Stage 2: Runner (运行阶段)
# ==========================================
FROM node:18-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=prod
ENV PORT=12583

# 安装生产环境必要的全局工具
# curl 用于健康检查, pm2 用于进程管理
RUN apk add --no-cache curl && \
    npm install -g pm2

# 创建日志目录
RUN mkdir -p /app/logs

# 关键优化：只复制构建产物和必要配置
# Nuxt 3 的 .output 目录是自包含的，不需要复制根目录的 node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/ecosystem.config.js ./
COPY --from=builder /app/package.json ./

# 暴露端口
EXPOSE 12583

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:12583/ || exit 1

# 启动命令
# 使用 pm2-runtime 专为 Docker 设计，保持前台运行
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "prod"]

# 1. 构建镜像
# docker build -t xcy960815/data-middle-station:1.0 .
# 2. 构建多平台
# docker buildx build --platform linux/amd64,linux/arm64 -t xcy960815/data-middle-station:1.1 --push .
