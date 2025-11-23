#!/bin/bash

# 日志查看工具脚本
# 使用方法: ./view-logs.sh [选项] [日志类型] [日期]

LOGS_DIR="/Users/opera/Documents/self/data-middle-station/logs"
TODAY=$(date +%Y-%m-%d)

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE}日志查看工具${NC}"
    echo ""
    echo "使用方法:"
    echo "  ./view-logs.sh [选项] [日志类型] [日期]"
    echo ""
    echo "选项:"
    echo "  -f, --follow      实时监控日志（类似 tail -f）"
    echo "  -n, --lines NUM   显示最后 N 行（默认 50）"
    echo "  -s, --search TEXT 搜索包含指定文本的日志"
    echo "  -e, --errors      只显示错误日志"
    echo "  -l, --list        列出所有日志文件"
    echo "  -h, --help        显示此帮助信息"
    echo ""
    echo "日志类型:"
    echo "  api         API 日志"
    echo "  auth        认证日志"
    echo "  database    数据库日志"
    echo "  middleware  中间件日志"
    echo "  plugins     插件日志"
    echo "  server      服务器日志"
    echo "  all         所有日志（默认）"
    echo ""
    echo "日期格式: YYYY-MM-DD (默认: 今天)"
    echo ""
    echo "示例:"
    echo "  ./view-logs.sh -n 100 server              # 查看今天服务器日志最后100行"
    echo "  ./view-logs.sh -f server                  # 实时监控服务器日志"
    echo "  ./view-logs.sh -s 'error' server          # 搜索服务器日志中的错误"
    echo "  ./view-logs.sh -e all 2025-11-22          # 查看指定日期的所有错误日志"
    echo "  ./view-logs.sh -l server                  # 列出所有服务器日志文件"
}

# 列出日志文件
list_logs() {
    local log_type=$1
    if [ "$log_type" = "all" ] || [ -z "$log_type" ]; then
        echo -e "${GREEN}所有日志文件:${NC}"
        find "$LOGS_DIR" -type f -name "*.log" -o -name "*.log.gz" | sort
    else
        echo -e "${GREEN}${log_type} 日志文件:${NC}"
        find "$LOGS_DIR/$log_type" -type f \( -name "*.log" -o -name "*.log.gz" \) 2>/dev/null | sort
    fi
}

# 查看日志
view_log() {
    local log_type=$1
    local date=$2
    local lines=$3
    local follow=$4

    if [ "$log_type" = "all" ] || [ -z "$log_type" ]; then
        # 查看所有类型的日志
        for dir in api auth database middleware plugins server; do
            if [ -d "$LOGS_DIR/$dir" ]; then
                echo -e "${BLUE}=== $dir 日志 ===${NC}"
                for log_file in "$LOGS_DIR/$dir"/*${date}*.log; do
                    if [ -f "$log_file" ]; then
                        echo -e "${YELLOW}文件: $log_file${NC}"
                        if [ "$follow" = "true" ]; then
                            tail -f "$log_file"
                        else
                            tail -n "$lines" "$log_file"
                        fi
                        echo ""
                    fi
                done
            fi
        done
    else
        # 查看特定类型的日志
        local log_pattern="$LOGS_DIR/$log_type/*${date}*.log"
        local found=false

        for log_file in $log_pattern; do
            if [ -f "$log_file" ]; then
                found=true
                echo -e "${YELLOW}查看: $log_file${NC}"
                if [ "$follow" = "true" ]; then
                    tail -f "$log_file"
                else
                    tail -n "$lines" "$log_file"
                fi
            fi
        done

        # 如果没有找到 .log 文件，尝试 .log.gz
        if [ "$found" = false ]; then
            for log_file in "$LOGS_DIR/$log_type"/*${date}*.log.gz; do
                if [ -f "$log_file" ]; then
                    found=true
                    echo -e "${YELLOW}查看 (压缩): $log_file${NC}"
                    if [ "$follow" = "true" ]; then
                        zcat "$log_file" | tail -f
                    else
                        zcat "$log_file" | tail -n "$lines"
                    fi
                fi
            done
        fi

        if [ "$found" = false ]; then
            echo -e "${RED}未找到 $log_type 类型在 $date 的日志文件${NC}"
        fi
    fi
}

# 搜索日志
search_logs() {
    local search_text=$1
    local log_type=$2
    local date=$3

    echo -e "${GREEN}搜索包含 '${search_text}' 的日志...${NC}"
    echo ""

    if [ "$log_type" = "all" ] || [ -z "$log_type" ]; then
        grep -r -i --color=always "$search_text" "$LOGS_DIR"/*/${date}*.log 2>/dev/null
        # 也搜索压缩文件
        for gz_file in "$LOGS_DIR"/*/${date}*.log.gz; do
            if [ -f "$gz_file" ]; then
                zcat "$gz_file" | grep -i --color=always "$search_text"
            fi
        done
    else
        grep -i --color=always "$search_text" "$LOGS_DIR/$log_type"/*${date}*.log 2>/dev/null
        # 也搜索压缩文件
        for gz_file in "$LOGS_DIR/$log_type"/*${date}*.log.gz; do
            if [ -f "$gz_file" ]; then
                zcat "$gz_file" | grep -i --color=always "$search_text"
            fi
        done
    fi
}

# 查看错误日志
view_errors() {
    local log_type=$1
    local date=$2

    echo -e "${RED}=== 错误日志 ===${NC}"
    echo ""
    search_logs "error\|fail\|exception\|fatal" "$log_type" "$date"
}

# 解析参数
LINES=50
FOLLOW=false
SEARCH=""
ERRORS=false
LIST=false
LOG_TYPE="all"
DATE="$TODAY"

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--lines)
            LINES="$2"
            shift 2
            ;;
        -s|--search)
            SEARCH="$2"
            shift 2
            ;;
        -e|--errors)
            ERRORS=true
            shift
            ;;
        -l|--list)
            LIST=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        api|auth|database|middleware|plugins|server|all)
            LOG_TYPE="$1"
            shift
            ;;
        [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9])
            DATE="$1"
            shift
            ;;
        *)
            echo -e "${RED}未知参数: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# 执行相应操作
if [ "$LIST" = true ]; then
    list_logs "$LOG_TYPE"
elif [ -n "$SEARCH" ]; then
    search_logs "$SEARCH" "$LOG_TYPE" "$DATE"
elif [ "$ERRORS" = true ]; then
    view_errors "$LOG_TYPE" "$DATE"
else
    view_log "$LOG_TYPE" "$DATE" "$LINES" "$FOLLOW"
fi
