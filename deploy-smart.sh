#!/bin/bash

# =====================================================
# 🚀 Linux安全防控系统 v2.0 - 智能部署脚本
# 支持多账户、自动检测、一键推送
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
echo "║   🚀 Linux安全防控系统 v2.0 - 智能部署工具        ║"
echo "║      Professional Security Defense System          ║"
echo "║                                                    ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

print_banner() {
    echo -e "${CYAN}"
    echo "  ██████╗ ███████╗████████╗██████╗  ██████╗ ███╗   ██╗"
    echo "  ██╔══██╗██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗████╗  ██║"
    echo "  ██████╔╝█████╗     ██║   ██████╔╝██║   ██║██╔██╗ ██║"
    echo "  ██╔══██╗██╔══╝     ██║   ██╔══██╗██║   ██║██║╚██╗██║"
    echo "  ██║  ██║███████╗   ██║   ██║  ██║╚██████╔╝██║ ╚████║"
    echo "  ╚═╝  ╚═╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝"
    echo -e "${NC}"
    echo ""
}

show_project_info() {
    echo -e "${BLUE}📦 项目信息${NC}"
    echo "─────────────────────────────────────────────"
    
    local total_files=$(find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) ! -path "./node_modules/*" | wc -l)
    local total_lines=$(find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) ! -path "./node_modules/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
    
    echo -e "  ${GREEN}✓${NC} 项目名称: ${YELLOW}Linux安全防控系统 v2.0${NC}"
    echo -e "  ${GREEN}✓${NC} 文件数量: ${YELLOW}${total_files} 个${NC}"
    echo -e "  ${GREEN}✓${NC} 代码行数: ${YELLOW}${total_lines} 行${NC}"
    echo -e "  ${GREEN}✓${NC} 架构类型: ${YELLOW}专业级分层模块化${NC}"
    echo ""
}

check_ssh_and_github() {
    echo -e "${BLUE}🔐 环境检测${NC}"
    echo "─────────────────────────────────────────────"
    
    # 检查SSH
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        local github_user=$(ssh -T git@github.com 2>&1 | grep -oP '(?<=Hi )[^!]+')
        echo -e "  ${GREEN}✅ SSH认证成功${NC}"
        echo -e "  ${GREEN}✅ GitHub账户:${NC} ${YELLOW}${github_user}${NC}"
        GITHUB_USER="$github_user"
        return 0
    else
        echo -e "  ${RED}❌ SSH认证失败${NC}"
        return 1
    fi
}

show_current_remote() {
    echo -e "${BLUE}📍 当前Git配置${NC}"
    echo "─────────────────────────────────────────────"
    
    if git remote get-url origin &>/dev/null; then
        local current_url=$(git remote get-url origin)
        echo -e "  Remote URL: ${CYAN}${current_url}${NC}"
        
        # 提取仓库信息
        if [[ $current_url == *"github.com"* ]]; then
            REPO_PATH=$(echo $currenturl | sed 's/git@github.com://' | sed 's/.git//')
            echo -e "  仓库路径: ${YELLOW}${REPO_PATH}${NC}"
        fi
    else
        echo -e "  ${YELLOW}⚠️  未配置Remote URL${NC}"
    fi
    
    # 显示分支
    local branch=$(git branch --show-current 2>/dev/null || echo "unknown")
    echo -e "  当前分支: ${YELLOW}${branch}${NC}"
    echo ""
}

select_deployment_target() {
    echo -e "${BLUE}🎯 选择部署目标${NC}"
    echo "─────────────────────────────────────────────"
    echo ""
    echo -e "  检测到您的GitHub账户: ${YELLOW}${GITHUB_USER}${NC}"
    echo ""
    echo "  请选择要部署到的目标:"
    echo ""
    echo "  ${GREEN}1${NC}) 推送到 ${GITHUB_USER}/2 (您自己的账户)"
    echo "  ${GREEN}2${NC}) 推送到 Paoulo31/2 (指定账户)"
    echo "  ${GREEN}3${NC}) 推送到自定义仓库"
    echo "  ${GREEN}0${NC}) 取消"
    echo ""
    read -p "  请选择 [0-3]: " choice
    
    case $choice in
        1)
            TARGET_REPO="${GITHUB_USER}/2"
            TARGET_URL="git@github.com:${GITHUB_USER}/2.git"
            ;;
        2)
            TARGET_REPO="Paoulo31/2"
            TARGET_URL="git@github.com:Paoulo31/2.git"
            ;;
        3)
            read -p "  输入完整仓库路径 (例如: username/repo): " custom_repo
            if [ -n "$custom_repo" ]; then
                TARGET_REPO="$custom_repo"
                TARGET_URL="git@github.com:${custom_repo}.git"
            else
                echo -e "  ${RED}❌ 无效输入${NC}"
                return 1
            fi
            ;;
        0|*)
            echo -e "\n  已取消部署"
            exit 0
            ;;
    esac
    
    echo ""
    echo -e "  目标仓库: ${CYAN}${TARGET_REPO}${NC}"
    echo -e "  完整URL:  ${CYAN}${TARGET_URL}${NC}"
    echo ""
    
    read -p "  确定要部署到此目标吗？(y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        echo -e "  已取消"
        return 1
    fi
    
    return 0
}

push_to_github() {
    echo ""
    echo -e "${BLUE}🚀 开始部署...${NC}"
    echo "══════════════════════════════════════════════════"
    echo ""
    
    # 更新Remote URL
    echo -e "  [1/4] 配置远程仓库..."
    git remote set-url origin "$TARGET_URL"
    git remote remove origin 2>/dev/null || true
    git remote add origin "$TARGET_URL"
    echo -e "  ${GREEN}✓${NC} Remote URL 已设置"
    
    # 显示推送信息
    echo ""
    echo -e "  [2/4] 准备推送..."
    echo -e "  目标: ${TARGET_REPO}"
    echo -e "  分支: main"
    echo -e "  协议: SSH"
    echo ""
    
    # 执行推送
    echo -e "  [3/4] 正在推送代码..."
    echo "  ───────────────────────────────────────────"
    
    if git push -u origin main 2>&1; then
        echo "  ───────────────────────────────────────────"
        echo ""
        echo -e "  [4/4] ${GREEN}验证部署结果...${NC}"
        echo ""
        
        show_success_message
        return 0
    else
        echo "  ───────────────────────────────────────────"
        echo ""
        show_failure_help
        return 1
    fi
}

show_success_message() {
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}║  ✅✅✅  部署成功！项目已发布到 GitHub！  ✅✅✅       ║${NC}"
    echo -e "${GREEN}║                                                          ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${CYAN}🌐 项目地址:${NC}"
    echo -e "   ${YELLOW}https://github.com/${TARGET_REPO}${NC}"
    echo ""
    echo -e "${CYAN}📋 后续操作:${NC}"
    echo "   ① 在浏览器打开上述地址查看项目"
    echo ""
    echo "   ② (可选) 启用 GitHub Pages 获得在线预览:"
    echo "      → Settings → Pages → Source: main → Save"
    echo "      → 访问: https://${TARGET_REPO%%/*}.github.io/${TARGET_REPO#*/}/"
    echo ""
    echo -e "${CYAN}🎉 恭喜！Linux安全防控系统已成功上线！${NC}"
    echo ""
}

show_failure_help() {
    echo -e "${RED}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}║  ❌ 部署失败 - 权限被拒绝                                 ║${NC}"
    echo -e "${RED}║                                                          ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}🔍 错误原因:${NC}"
    echo "  您的账户 ${GITHUB_USER} 对仓库 ${TARGET_REPO} 没有写入权限"
    echo ""
    echo -e "${YELLOW}💡 解决方案:${NC}"
    echo ""
    echo -e "  ${RED}方案A: 推送到您自己的账户 (推荐)${NC}"
    echo "  ─────────────────────────────────────"
    echo "  1. 在浏览器中创建仓库:"
    echo "     ${CYAN}https://github.com/new${NC}"
    echo "  2. 仓库名称填写: ${YELLOW}2${NC}"
    echo "  3. 不要勾选 README/.gitignore/License"
    echo "  4. 点击 Create repository"
    echo "  5. 重新运行此脚本，选择选项 1"
    echo ""
    echo -e "  ${RED}方案B: 如果 ${TARGET_REPO%%/*} 是他人的仓库${NC}"
    echo "  ─────────────────────────────────────"
    echo "  1. 联系仓库所有者添加您为协作者"
    echo "  2. 或 Fork 该仓库到您的账户"
    echo ""
    echo -e "  ${RED}方案C: 检查是否使用了正确的GitHub账户${NC}"
    echo "  ─────────────────────────────────────"
    echo "  运行: ./setup-ssh.sh 检查SSH配置"
    echo ""
}

main() {
    print_banner
    show_project_info
    
    check_ssh_and_github || {
        echo -e "\n${RED}错误: SSH配置有问题，请先运行 ./setup-ssh.sh${NC}\n"
        exit 1
    }
    
    show_current_remote
    select_deployment_target || exit 0
    push_to_github
}

main "$@"
