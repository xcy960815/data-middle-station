#!/bin/bash

# Implementation Plan Task List and Thought in Chinese
# 1. 将 expect 逻辑转换为纯 shell 脚本
# 2. 使用 sshpass 处理密码（如果本地已安装）或提示用户手动输入
# 3. 保持核心的 iptables 修复逻辑不变
# 4. 适配当前项目的网络名称 dms-network

HOST="100.109.41.26"
USER="root"
# PASSWORD 建议通过环境变量设置，或者运行脚本时手动输入
NETWORK_NAME="dms-network"

# 如果没有设置环境变量 SSH_PASS，则交互式询问
if [ -z "$SSH_PASS" ]; then
    read -sp "Enter password for $USER@$HOST: " SSH_PASS
    echo ""
fi

echo "Connecting to $HOST to fix Docker network issues..."

# 构建要在远程服务器上执行的命令
REMOTE_COMMANDS=$(cat <<EOF
    # 获取子网信息
    SUBNET=\$(docker network inspect $NETWORK_NAME -f '{{(index .IPAM.Config 0).Subnet}}' 2>/dev/null)

    if [ -z "\$SUBNET" ]; then
        echo "ERROR: Network '$NETWORK_NAME' not found on remote host."
        exit 1
    fi

    echo "Detected Subnet: \$SUBNET"

    # 清理旧的修复规则
    sed -i '/# --- Docker Network Fix Start ---/,/# --- Docker Network Fix End ---/d' /etc/firewall.user

    # 写入新的修复规则
    cat >> /etc/firewall.user <<INNER_EOF

# --- Docker Network Fix Start ---
iptables -I FORWARD 1 -s \$SUBNET -j ACCEPT
iptables -t nat -I POSTROUTING 1 -s \$SUBNET -j MASQUERADE
# --- Docker Network Fix End ---
INNER_EOF

    # 重启防火墙
    service firewall restart
    echo "FIX_COMPLETED_SUCCESSFULLY"
EOF
)

# 使用 ssh 执行远程命令
# 注意：这里假设你本地环境支持 sshpass，或者已经配置了 SSH 免密登录
# 如果没有 sshpass，建议配置 SSH Key 免密登录，安全性更高
if command -v sshpass &> /dev/null; then
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $USER@$HOST "$REMOTE_COMMANDS"
else
    echo "Warning: 'sshpass' not found. Trying standard ssh..."
    ssh -o StrictHostKeyChecking=no $USER@$HOST "$REMOTE_COMMANDS"
fi
