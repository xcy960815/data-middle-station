# 构建阶段
FROM node:18 AS builder

# 设置工作目录
WORKDIR /data-middle-station

# 设置 npm 镜像源
RUN npm config set registry https://registry.npmmirror.com


# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm
RUN npm install -g pnpm@10


# 创建logs目录
RUN mkdir -p /data-middle-station/logs


# 安装依赖
RUN pnpm install

# 复制项目文件
COPY . .

# 构建应用
RUN pnpm run build


# 安装pm2
RUN pnpm install -g pm2

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["pm2", "start", "ecosystem.config.js", "--env", "dev"]