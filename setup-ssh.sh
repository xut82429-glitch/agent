#!/bin/bash

# =====================================================
# 🔐 GitHub SSH 一键配置脚本
# 账户: xut82429-glitch
# =====================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║                                                    ║"
echo "║   🔐  GitHub SSH 配置工具 v1.0                     ║"
echo "║      Account: xut82429-glitch                      ║"
echo "║                                                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

show_menu() {
    echo -e "${BLUE}请选择操作:${NC}"
    echo "─────────────────────────────────────"
    echo "  ${GREEN}1${NC}) 查看当前SSH状态"
    echo "  ${GREEN}2${NC}) 显示公钥 (用于复制)"
    echo "  ${GREEN}3${NC}) 测试GitHub连接"
    echo "  ${GREEN}4${NC}) 修复权限问题"
    echo "  ${GREEN}5${NC}) 启动SSH Agent"
    echo "  ${GREEN}6${NC}) 添加密钥到Agent"
    echo "  ${GREEN}7${NC}) 生成新密钥"
    echo "  ${GREEN}0${NC}) 退出"
    echo ""
    read -p "请输入选项 [0-7]: " choice
}

check_ssh_status() {
    echo ""
    echo -e "${BLUE}📊 SSH配置状态检查${NC}"
    echo "═══════════════════════════════════════"
    
    # 检查SSH目录
    if [ -d ~/.ssh ]; then
        echo -e "  ✅ SSH目录存在: ${GREEN}~/.ssh${NC}"
    else
        echo -e "  ❌ SSH目录不存在"
        return 1
    fi
    
    # 检查私钥
    if [ -f ~/.ssh/id_ed25519 ]; then
        echo -e "  ✅ 私钥文件存在: ${GREEN}id_ed25519${NC}"
        local perm=$(stat -c %a ~/.ssh/id_ed25519 2>/dev/null || stat -f %Lp ~/.ssh/id_ed25519)
        if [ "$perm" = "600" ]; then
            echo -e "  ✅ 私钥权限正确: ${GREEN}${perm}${NC}"
        else
            echo -e "  ⚠️  私钥权限异常: ${YELLOW}${perm}${NC} (应为 600)"
        fi
    else
        echo -e "  ❌ 私钥文件不存在"
    fi
    
    # 检查公钥
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        echo -e "  ✅ 公钥文件存在: ${GREEN}id_ed25519.pub${NC}"
    else
        echo -e "  ❌ 公钥文件不存在"
    fi
    
    # 测试连接
    echo ""
    echo -e "${CYAN}正在测试GitHub连接...${NC}"
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        local user=$(ssh -T git@github.com 2>&1 | grep -oP '(?<=Hi )[^!]+')
        echo -e "  ✅ GitHub认证成功!"
        echo -e "  ✅ 认证账户: ${GREEN}${user}${NC}"
    else
        echo -e "  ❌ GitHub认证失败"
    fi
    
    echo ""
}

show_public_key() {
    echo ""
    echo -e "${BLUE}📋 您的SSH公钥${NC}"
    echo "═══════════════════════════════════════"
    echo ""
    
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        echo -e "${YELLOW}┌──────────────────────────────────────────┐${NC}"
        echo -e "${YELLOW}│${NC}                                          ${YELLOW}│${NC}"
        cat ~/.ssh/id_ed25519.pub | while read line; do
            printf "${YELLOW}│${NC}  %-40s ${YELLOW}│${NC}\n" "$line"
        done
        echo -e "${YELLOW}│${NC}                                          ${YELLOW}│${NC}"
        echo -e "${YELLOW}└──────────────────────────────────────────┘${NC}"
        echo ""
        echo -e "  文件位置: ${CYAN}~/.ssh/id_ed25519.pub${NC}"
        echo ""
        echo -e "  ${GREEN}复制方法:${NC}"
        echo "  方法1: 手动选中上方公钥内容复制"
        echo "  方法2: 执行命令: ${CYAN}cat ~/.ssh/id_ed25519.pub | xclip -selection clipboard${NC}"
        echo ""
        echo -e "  ${YELLOW}添加到GitHub:${NC}"
        echo "  打开: ${CYAN}https://github.com/settings/keys${NC}"
        echo "  点击 'New SSH key' 并粘贴公钥"
        echo ""
    else
        echo -e "  ${RED}❌ 公钥文件不存在${NC}"
    fi
}

test_connection() {
    echo ""
    echo -e "${BLUE}🔗 测试GitHub SSH连接${NC}"
    echo "═══════════════════════════════════════"
    echo ""
    echo -e "  正在连接 github.com..."
    echo ""
    
    result=$(ssh -T git@github.com 2>&1)
    
    if echo "$result" | grep -q "successfully authenticated"; then
        user=$(echo "$result" | grep -oP '(?<=Hi )[^!]+')
        echo -e "  ${GREEN}✅✅✅ 连接成功！✅✅✅${NC}"
        echo ""
        echo -e "  ${GREEN}✓${NC} SSH认证: ${GREEN}通过${NC}"
        echo -e "  ${GREEN}✓${NC} GitHub账户: ${YELLOW}${user}${NC}"
        echo -e "  ${GREEN}✓${NC} 协议: ${GREEN}Ed25519${NC}"
        echo -e "  ${GREEN}✓${NC} 状态: ${GREEN}可以正常使用 Git Push/Pull${NC}"
        echo ""
        
        # 显示远程仓库配置
        echo -e "${CYAN}当前Git Remote配置:${NC}"
        git remote -v 2>/dev/null | grep origin || echo "  (当前不在Git仓库中)"
        echo ""
    else
        echo -e "  ${RED}❌ 连接失败${NC}"
        echo ""
        echo -e "  错误信息: ${result}"
        echo ""
        echo -e "  ${YELLOW}可能的原因:${NC}"
        echo "  1. 公钥未添加到GitHub"
        echo "  2. 私钥权限不正确"
        echo "  3. 网络连接问题"
        echo ""
        echo -e "  ${YELLOW}解决方案:${NC}"
        echo "  运行选项4修复权限，或访问:"
        echo "  ${CYAN}https://docs.github.com/authentication/troubleshooting-ssh${NC}"
        echo ""
    fi
}

fix_permissions() {
    echo ""
    echo -e "${BLUE}🔧 修复SSH文件权限${NC}"
    echo "═══════════════════════════════════════"
    echo ""
    
    if [ -d ~/.ssh ]; then
        chmod 700 ~/.ssh
        echo -e "  ✅ ~/.ssh 目录权限 → ${GREEN}700${NC}"
    fi
    
    if [ -f ~/.ssh/id_ed25519 ]; then
        chmod 600 ~/.ssh/id_ed25519
        echo -e "  ✅ id_ed25519 权限 → ${GREEN}600${NC}"
    fi
    
    if [ -f ~/.ssh/id_ed25519.pub ]; then
        chmod 644 ~/.ssh/id_ed25519.pub
        echo -e "  ✅ id_ed25519.pub 权限 → ${GREEN}644${NC}"
    fi
    
    if [ -f ~/.ssh/known_hosts ]; then
        chmod 644 ~/.ssh/known_hosts
        echo -e "  ✅ known_hosts 权限 → ${GREEN}644${NC}"
    fi
    
    if [ -f ~/.ssh/config ]; then
        chmod 600 ~/.ssh/config
        echo -e "  ✅ config 权限 → ${GREEN}600${NC}"
    fi
    
    echo ""
    echo -e "  ${GREEN}✅ 所有权限已修复！${NC}"
    echo ""
}

start_ssh_agent() {
    echo ""
    echo -e "${BLUE}🔄 启动SSH Agent${NC}"
    echo "═══════════════════════════════════════"
    echo ""
    
    eval "$(ssh-agent -s)"
    echo -e "  ✅ SSH Agent 已启动"
    echo -e "  PID: ${GREEN}$SSH_AGENT_PID${NC}"
    echo ""
    
    echo -e "  提示: Agent将在会话结束后自动关闭"
    echo ""
}

add_key_to_agent() {
    echo ""
    echo -e "${BLUE}🔑 加载私钥到Agent${NC}"
    echo "═══════════════════════════════════════"
    echo ""
    
    if [ -z "$SSH_AUTH_SOCK" ]; then
        echo -e "  ⚠️  SSH Agent未运行"
        echo -e "  请先运行选项5启动Agent"
        return 1
    fi
    
    if [ -f ~/.ssh/id_ed25519 ]; then
        ssh-add ~/.ssh/id_ed25519
        echo ""
        echo -e "  ✅ 密钥已加载"
        echo ""
        
        echo -e "  当前已加载的密钥:"
        ssh-add -l
        echo ""
    else
        echo -e "  ❌ 私钥文件不存在"
    fi
}

generate_new_key() {
    echo ""
    echo -e "${BLUE}🔐 生成新的SSH密钥对${NC}"
    echo "═══════════════════════════════════════"
    echo ""
    
    echo -e "  ${YELLOW}警告: 这将生成新的密钥对${NC}"
    echo -e "  如果已有密钥在GitHub使用，需要重新添加公钥"
    echo ""
    read -p "  确定要继续吗？(y/N): " confirm
    
    if [[ $confirm =~ ^[Yy]$ ]]; then
        read -p "  输入邮箱 (默认: xut82429@gmail.com): " email
        email=${email:-"xut82429@gmail.com"}
        
        read -p "  输入密钥文件名 (默认: id_ed25519): " keyname
        keyname=${keyname:-"id_ed25519"}
        
        filepath="$HOME/.ssh/$keyname"
        
        if [ -f "$filepath" ] || [ -f "$filepath.pub" ]; then
            echo -e "  ${RED}错误: 文件已存在: $filepath${NC}"
            echo -e "  请选择其他名称或先备份现有密钥"
            return 1
        fi
        
        ssh-keygen -t ed25519 -C "$email" -f "$filepath"
        
        echo ""
        echo -e "  ${GREEN}✅ 新密钥已生成！${NC}"
        echo -e "  私钥: ${CYAN}$filepath${NC}"
        echo -e "  公钥: ${CYAN}$filepath.pub${NC}"
        echo ""
        echo -e "  ${YELLOW}下一步:${NC}"
        echo "  1. 复制公钥内容"
        echo "  2. 添加到GitHub: https://github.com/settings/keys"
        echo "  3. 测试连接: ssh -T git@github.com"
        echo ""
        
        # 自动设置权限
        chmod 600 "$filepath"
        chmod 644 "$filepath.pub"
        echo -e "  ✅ 文件权限已设置"
        echo ""
    else
        echo -e "  已取消操作"
    fi
}

# 主循环
while true; do
    show_menu
    
    case $choice in
        1) check_ssh_status ;;
        2) show_public_key ;;
        3) test_connection ;;
        4) fix_permissions ;;
        5) start_ssh_agent ;;
        6) add_key_to_agent ;;
        7) generate_new_key ;;
        0) 
           echo ""
           echo -e "${GREEN}感谢使用！${NC}"
           exit 0 
           ;;
        *) 
           echo -e "\n${RED}无效选项，请重新选择${NC}\n" 
           ;;
    esac
    
    echo -e "${CYAN}按回车键继续...${NC}"
    read
done
