# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=prod

ENV PNPM_HOME="/root/.local/share/pnpm"

ENV PATH="${PNPM_HOME}:${PATH}"

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

RUN rm -rf node_modules package-lock.json .nuxt .output

# 安装 pnpm
RUN npm install -g pnpm@10

# 创建logs目录
RUN mkdir -p /app/logs

# 安装 curl 用于健康检查
RUN apk add --no-cache curl




# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制项目文件
COPY . .

# 构建应用 - 增加Node.js内存限制和优化构建
RUN NODE_OPTIONS="--max-old-space-size=4096 --max-semi-space-size=128" pnpm run build:prod

# 清理构建缓存和临时文件
RUN rm -rf node_modules/.cache .nuxt/cache

# 安装pm2
RUN pnpm install -g pm2

# 暴露端口
EXPOSE 12583

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:12583/ || exit 1

# 启动命令
CMD ["sh", "-c", "ls -la /app/.output/server/ && pm2 start ecosystem.config.js --env prod --no-daemon"]



# 1. 构建镜像
# docker build -t xcy960815/data-middle-station:1.0 .
# 2. 构建多平台
# docker buildx build --platform linux/amd64,linux/arm64 -t xcy960815/data-middle-station:1.1 --push .
