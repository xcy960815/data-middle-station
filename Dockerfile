# 构建阶段
FROM node:18 AS builder

# 设置工作目录
WORKDIR /data-middle-station

# 设置环境变量
ENV NODE_ENV=pre
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
RUN mkdir -p /data-middle-station/logs

# 安装依赖
RUN pnpm install

# 复制项目文件
COPY . .

# 构建应用
RUN pnpm run build:pre

# 安装pm2
RUN pnpm install -g pm2

# 暴露端口
EXPOSE 12582

# 健康检查
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:12582/ || exit 1

# 启动命令
CMD ["sh", "-c", "ls -la /data-middle-station/.output/server/ && pm2 start ecosystem.config.js --env pre --no-daemon"]