# # 构建阶段
# FROM node:18 AS builder

# # 设置工作目录
# WORKDIR /data-middle-station

# # 设置 npm 镜像源并移除代理
# RUN npm config set registry https://registry.npmmirror.com && \
#     npm config delete proxy && \
#     npm config delete https-proxy

# # 安装 pnpm
# RUN npm install -g pnpm@8.0.0

# # 设置 pnpm 镜像源
# RUN pnpm config delete proxy && \
#     pnpm config delete https-proxy && \
#     pnpm config set registry https://registry.npmmirror.com

# # 复制 package.json 和 pnpm-lock.yaml
# COPY package.json pnpm-lock.yaml ./

# # 安装依赖
# RUN pnpm install

# # 复制项目文件
# COPY . .

# # 构建应用
# RUN pnpm run build

# # 生产阶段
# FROM node:18 AS production

# # 设置工作目录
# WORKDIR /data-middle-station

# # 设置 npm 镜像源并移除代理
# RUN npm config set registry https://registry.npmmirror.com && \
#     npm config delete proxy && \
#     npm config delete https-proxy

# # 安装 pnpm
# RUN npm install -g pnpm@8.0.0

# # 设置 pnpm 镜像源
# RUN pnpm config delete proxy && \
#     pnpm config delete https-proxy && \
#     pnpm config set registry https://registry.npmmirror.com

# # 复制 package.json 和 pnpm-lock.yaml
# COPY package.json pnpm-lock.yaml ./

# # 只安装生产环境依赖
# RUN pnpm install --prod

# # 从构建阶段复制构建产物
# COPY --from=builder /data-middle-station/.output ./.output
# COPY --from=builder /data-middle-station/.nuxt ./.nuxt
# COPY --from=builder /data-middle-station/public ./public

# # 设置环境变量
# ENV HOST=0.0.0.0
# ENV PORT=3000
# ENV NODE_ENV=production

# # 暴露端口
# EXPOSE 3000

# # 启动应用
# CMD ["node", ".output/server/index.mjs"] 

# # docker build -t xcy960815/data-middle-station:1.0 .



FROM node:18 AS builder
WORKDIR /data-middle-station
COPY package*.json ./
RUN npm install -g pnpm@8.0.0
RUN pnpm install
COPY . .
RUN pnpm run build

FROM nginx:1.21
COPY --from=builder /data-middle-station/.output/public /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]