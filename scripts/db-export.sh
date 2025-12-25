#!/bin/bash

# Implementation Plan Task List and Thought in Chinese
# 1. 创建数据库导出脚本
# 2. 支持导出两个 MySQL 实例的数据
# 3. 自动创建备份目录并按时间命名
# 4. 适配当前项目的数据库配置

HOST="100.109.41.26"
USER="root"
NETWORK_NAME="dms-network"

# 如果没有设置环境变量 SSH_PASS，则交互式询问
if [ -z "$SSH_PASS" ]; then
    read -sp "Enter password for $USER@$HOST: " SSH_PASS
    echo ""
fi

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./sql/backups"

mkdir -p "$BACKUP_DIR"

echo "Select database to export:"
echo "1) mysql-main (dms_db)"
echo "2) mysql-data (dms_data_db)"
echo "3) both"

read -p "Choice [1-3] (default: 3): " choice
choice=${choice:-3}

export_db() {
    local container=$1
    local db_name=$2
    local filename="${db_name}_${DATE}.sql"

    echo "Exporting $db_name from $container..."
    sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $USER@$HOST "docker exec $container mysqldump -u root -p$SSH_PASS $db_name" > "$BACKUP_DIR/$filename"

    if [ $? -eq 0 ]; then
        echo "✅ Success: $BACKUP_DIR/$filename"
    else
        echo "❌ Failed to export $db_name"
    fi
}

case $choice in
    1) export_db "dms-mysql-main" "dms_db" ;;
    2) export_db "dms-mysql-data" "dms_data_db" ;;
    3)
        export_db "dms-mysql-main" "dms_db"
        export_db "dms-mysql-data" "dms_data_db"
        ;;
    *) echo "Invalid choice"; exit 1 ;;
esac
