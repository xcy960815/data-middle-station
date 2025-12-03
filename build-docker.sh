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

# 构建镜像，同时打上版本号标签和 latest 标签
docker build -t xcy960815/data-middle-station:$VERSION -t xcy960815/data-middle-station:latest .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}>>> 镜像构建成功！${NC}"
    echo "生成的标签:"
    echo "  - xcy960815/data-middle-station:$VERSION"
    echo "  - xcy960815/data-middle-station:latest"

    # 自动生成 .env 文件，用于 docker-compose
    echo "IMAGE_VERSION=$VERSION" > .env.docker
    echo -e "${GREEN}>>> 已生成 .env.docker 文件，版本号: $VERSION${NC}"
    echo "启动容器时可以使用: docker-compose -p dms-service -f dms-service-compose.yml --env-file .env.docker up -d"

    read -p "是否立即推送到 Docker Hub? (y/n) [n]: " push_choice
    push_choice=${push_choice:-n}

    if [ "$push_choice" = "y" ]; then
        echo -e "${BLUE}>>> 正在推送...${NC}"
        docker push xcy960815/data-middle-station:$VERSION
        docker push xcy960815/data-middle-station:latest
        echo -e "${GREEN}>>> 推送完成！${NC}"
    else
        echo "已跳过推送。你可以稍后执行:"
        echo "docker push xcy960815/data-middle-station:$VERSION"
        echo "docker push xcy960815/data-middle-station:latest"
    fi
else
    echo -e "\033[0;31m>>> 构建失败，请检查错误信息。\033[0m"
    exit 1
fi
