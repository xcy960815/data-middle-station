#!/bin/bash

# Implementation Plan Task List and Thought in Chinese
# 1. 创建远程 Docker 清理脚本
# 2. 清理虚悬镜像（dangling images）
# 3. 清理停止的容器
# 4. 适配 iStoreOS 磁盘空间有限的情况

HOST="100.109.41.26"
USER="root"

echo "Cleaning up remote Docker resources on $HOST..."

ssh $USER@$HOST "
    echo '--- Cleaning dangling images ---'
    docker image prune -f

    echo '--- Cleaning stopped containers ---'
    docker container prune -f

    echo '--- Docker Disk Usage ---'
    docker system df
"

echo "✅ Cleanup completed!"
