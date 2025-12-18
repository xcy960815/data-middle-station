#!/bin/bash

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo -e "\033[0;31m错误: Docker 未运行。请先启动 Docker Desktop。\033[0m"
    exit 1
fi

# 读取当前版本
CURRENT_VERSION=$(node -p "require('./package.json').version")

echo -e "${BLUE}当前项目版本: ${CURRENT_VERSION}${NC}"
echo "请选择构建版本的方式:"
echo "1) 使用当前版本构建 ($CURRENT_VERSION)"
echo "2) 升级为补丁版本 (Patch: x.y.Z -> x.y.Z+1)"
echo "3) 升级为次版本 (Minor: x.Y.z -> x.Y+1.0) [例如 1.0 -> 1.1]"
echo "4) 升级为主版本 (Major: X.y.z -> X+1.0.0)"
echo "5) 手动输入版本号"

read -p "请输入选项 [1-5] (默认: 1): " choice
choice=${choice:-1}

case $choice in
    1)
        VERSION=$CURRENT_VERSION
        ;;
    2)
        npm version patch --no-git-tag-version
        VERSION=$(node -p "require('./package.json').version")
        ;;
    3)
        npm version minor --no-git-tag-version
        VERSION=$(node -p "require('./package.json').version")
        ;;
    4)
        npm version major --no-git-tag-version
        VERSION=$(node -p "require('./package.json').version")
        ;;
    5)
        read -p "请输入新版本号 (例如 1.0): " VERSION
        # 尝试更新 package.json，如果格式不对 npm 会报错，这里简单处理
        npm version $VERSION --no-git-tag-version --allow-same-version
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo -e "${GREEN}>>> 开始构建版本: $VERSION${NC}"

# 1. 先进行本地构建 (保持原有逻辑，用于验证和本地使用)
docker build -t xcy960815/data-middle-station:$VERSION -t xcy960815/data-middle-station:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}>>> 本地镜像构建成功！${NC}"
    echo "生成的标签:"
    echo "  - xcy960815/data-middle-station:$VERSION"
    echo "  - xcy960815/data-middle-station:latest"

    # 更新 .env 文件中的 IMAGE_VERSION
    if [ -f .env ]; then
        # 如果 .env 存在，使用 sed 更新 IMAGE_VERSION
        # 兼容 macOS 和 Linux 的 sed 差异
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s/^IMAGE_VERSION=.*/IMAGE_VERSION=$VERSION/" .env
        else
            sed -i "s/^IMAGE_VERSION=.*/IMAGE_VERSION=$VERSION/" .env
        fi
    else
        # 如果 .env 不存在，创建它
        echo "IMAGE_VERSION=$VERSION" > .env
    fi

    echo -e "${GREEN}>>> 已更新 .env 文件，版本号: $VERSION${NC}"
    echo "启动容器时可以使用: docker-compose -p dms-service -f compose.yml up -d"

    read -p "是否立即构建多架构镜像(amd64/arm64)并推送到 Docker Hub? (y/n) [n]: " push_choice
    push_choice=${push_choice:-n}

    if [ "$push_choice" = "y" ]; then
        echo -e "${BLUE}>>> 正在准备多架构构建...${NC}"

        # 检查并设置 buildx (只在需要推送时设置)
        if ! docker buildx inspect dms-builder > /dev/null 2>&1; then
            echo "创建并启动新的 buildx builder (dms-builder)..."
            docker buildx create --name dms-builder --use --bootstrap
        else
            docker buildx use dms-builder
        fi

        echo -e "${BLUE}>>> 正在构建并推送多架构镜像 (linux/amd64, linux/arm64)...${NC}"
        # 使用 buildx 构建多架构并推送
        docker buildx build --platform linux/amd64,linux/arm64 -t xcy960815/data-middle-station:$VERSION -t xcy960815/data-middle-station:latest --push .

        if [ $? -eq 0 ]; then
             echo -e "${GREEN}>>> 多架构镜像推送完成！${NC}"
        else
             echo -e "\033[0;31m>>> 推送失败。\033[0m"
        fi
    else
        echo "已跳过推送。你可以稍后执行:"
        echo "docker push xcy960815/data-middle-station:$VERSION"
        echo "docker push xcy960815/data-middle-station:latest"
    fi
else
    echo -e "\033[0;31m>>> 构建失败，请检查错误信息。\033[0m"
    exit 1
fi
