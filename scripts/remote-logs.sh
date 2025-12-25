#!/bin/bash

# Implementation Plan Task List and Thought in Chinese
# 1. 创建一个查看远程 Docker 容器日志的脚本
# 2. 支持选择不同的服务（nuxt3, mysql, redis）
# 3. 支持 tail -f 实时查看
# 4. 适配 iStoreOS 环境

HOST="100.109.41.26"
USER="root"

echo "Available services:"
echo "1) nuxt3 (App)"
echo "2) mysql-main (App DB)"
echo "3) mysql-data (Business DB)"
echo "4) redis"
echo "5) all (combined logs)"

read -p "Select service [1-5] (default: 1): " choice
choice=${choice:-1}

case $choice in
    1) CONTAINER="dms-container" ;;
    2) CONTAINER="dms-mysql-container" ;;
    3) CONTAINER="dms-data-mysql-container" ;;
    4) CONTAINER="dms-redis-container" ;;
    5) CONTAINER="" ;;
    *) echo "Invalid choice"; exit 1 ;;
esac

read -p "Follow logs? (y/n) [y]: " follow
follow=${follow:-y}

FLAGS="--tail 100"
if [ "$follow" = "y" ]; then
    FLAGS="$FLAGS -f"
fi

if [ -z "$CONTAINER" ]; then
    echo "Showing logs for all containers in the project..."
    ssh $USER@$HOST "cd /root/data-middle-station && docker-compose logs $FLAGS"
else
    echo "Showing logs for $CONTAINER..."
    ssh $USER@$HOST "docker logs $FLAGS $CONTAINER"
fi
