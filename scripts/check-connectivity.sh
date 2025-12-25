#!/bin/bash

# Implementation Plan Task List and Thought in Chinese
# 1. 创建一个用于检测容器内网络连通性的脚本
# 2. 目标地址：220.197.33.205:465 (通常是邮件服务)
# 3. 在远程服务器的 dms-container 容器内执行检测
# 4. 使用交互式密码输入，确保安全

HOST="100.109.41.26"
USER="root"
TARGET_IP="220.197.33.205"
TARGET_PORT="465"
CONTAINER_NAME="dms-app-container"

# 如果没有设置环境变量 SSH_PASS，则交互式询问
if [ -z "$SSH_PASS" ]; then
    read -sp "Enter password for $USER@$HOST: " SSH_PASS
    echo ""
fi

echo "Checking connectivity to $TARGET_IP:$TARGET_PORT from inside $CONTAINER_NAME..."

# 远程执行检测逻辑
# 使用 timeout 确保不会无限期等待
# 使用 bash 的 /dev/tcp 功能进行探测，这种方式不需要安装 telnet 或 nc
REMOTE_COMMAND=$(cat <<EOF
    if ! docker ps --format '{{.Names}}' | grep -q "^$CONTAINER_NAME$"; then
        echo "❌ Error: Container '$CONTAINER_NAME' is not running."
        exit 1
    fi

    echo "Testing connection from inside the container..."
    # 使用 Node.js 进行 TCP 连接测试，因为 Alpine 镜像没有 bash 的 /dev/tcp 功能
    if docker exec $CONTAINER_NAME node -e "const net = require('net'); const client = net.createConnection({host: '$TARGET_IP', port: $TARGET_PORT, timeout: 5000}, () => { console.log('Connected'); client.end(); process.exit(0); }); client.on('error', (err) => { console.error(err.message); process.exit(1); }); client.on('timeout', () => { console.error('Timeout'); process.exit(1); });" > /dev/null 2>&1; then
        echo "✅ SUCCESS: Container can reach $TARGET_IP:$TARGET_PORT"
    else
        echo "❌ FAILED: Container cannot reach $TARGET_IP:$TARGET_PORT"
        echo "Possible reasons: Firewall rules, ISP blocking port 465, or incorrect NAT configuration."
    fi
EOF
)

if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $USER@$HOST "$REMOTE_COMMAND"
else
    echo "Warning: 'sshpass' not found. Trying standard ssh..."
    ssh -o StrictHostKeyChecking=no $USER@$HOST "$REMOTE_COMMAND"
fi
