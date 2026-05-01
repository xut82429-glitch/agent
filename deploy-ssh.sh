#!/bin/bash

# =====================================================
# 🛡️ Linux安全防控系统 v2.0 - SSH部署脚本
# GitHub: xut82429-glitch
# =====================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  🛡️  Linux安全防控系统 v2.0 - SSH部署工具     ║"
echo "║     GitHub Account: xut82429-glitch            ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

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

print_project_stats() {
    echo -e "${BLUE}📊 项目统计${NC}"
    echo "─────────────────────────────────────────────"
    
    local total_files=$(find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) ! -path "./node_modules/*" | wc -l)
    local total_lines=$(find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) ! -path "./node_modules/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
    local css_count=$(find ./css -name "*.css" 2>/dev/null | wc -l)
    local js_core=$(find ./js/core -name "*.js" 2>/dev/null | wc -l)
    local js_modules=$(find ./js/modules -name "*.js" 2>/dev/null | wc -l)
    
    echo -e "  ${GREEN}✓${NC} 总文件数:      ${YELLOW}${total_files} 个${NC}"
    echo -e "  ${GREEN}✓${NC} 代码总行数:    ${YELLOW}${total_lines} 行${NC}"
    echo -e "  ${GREEN}✓${NC} CSS样式文件:   ${YELLOW}${css_count} 个 (6层分离)${NC}"
    echo -e "  ${GREEN}✓${NC} JS核心框架:    ${YELLOW}${js_core} 个${NC}"
    echo -e "  ${GREEN}✓${NC} JS功能模块:    ${YELLOW}${js_modules} 个独立模块${NC}"
    echo ""
}

check_ssh_connection() {
    echo -e "${BLUE}🔐 SSH连接检测${NC}"
    echo "─────────────────────────────────────────────"
    
    if ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
        local github_user=$(ssh -T git@github.com 2>&1 | grep -oP '(?<=Hi )[^!]+')
        echo -e "  ${GREEN}✅ SSH认证成功${NC}"
        echo -e "  ${GREEN}✅ GitHub账户:${NC} ${YELLOW}${github_user}${NC}"
        echo ""
        return 0
    else
        echo -e "  ${RED}❌ SSH连接失败${NC}"
        echo ""
        return 1
    fi
}

show_directory_structure() {
    echo -e "${BLUE}📂 目录结构${NC}"
    echo "─────────────────────────────────────────────"
    
    tree -L 3 --dirsfirst -I 'node_modules|.git' . 2>/dev/null || find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.sh" \) ! -path "./node_modules/*" ! -path "./.git/*" | sort | head -30
    echo ""
}

push_to_github() {
    local repo_url="git@github.com:xut82429-glitch/1.git"
    
    echo -e "${BLUE}🚀 推送到GitHub${NC}"
    echo "─────────────────────────────────────────────"
    echo -e "  目标仓库: ${CYAN}${repo_url}${NC}"
    echo -e "  协议:     ${GREEN}SSH (已认证)${NC}"
    echo ""
    
    if git remote get-url origin &>/dev/null; then
        git remote set-url origin $repo_url
        echo -e "  ${GREEN}✓${NC} Remote URL 已更新"
    else
        git remote add origin $repo_url
        echo -e "  ${GREEN}✓${NC} Remote 已添加"
    fi
    
    echo ""
    echo -e "  正在推送代码..."
    echo "  ─────────────────────────────────────"
    
    if git push -u origin main 2>&1; then
        echo "  ─────────────────────────────────────"
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║                                                    ║${NC}"
        echo -e "${GREEN}║  ✅✅✅  推送成功！项目已发布到GitHub！  ✅✅✅  ║${NC}"
        echo -e "${GREEN}║                                                    ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${CYAN}🌐 项目地址:${NC}"
        echo -e "   ${YELLOW}https://github.com/xut82429-glitch/1${NC}"
        echo ""
        echo -e "${CYAN}📝 后续操作:${NC}"
        echo "   ① 在浏览器打开上述地址查看项目"
        echo "   ② 启用GitHub Pages获得在线预览:"
        echo "      Settings → Pages → Source → 选择 main 分支 → Save"
        echo "   ③ 访问在线地址: https://xut82429-glitch.github.io/1/"
        echo ""
        return 0
    else
        echo "  ─────────────────────────────────────"
        echo ""
        echo -e "${RED}❌ 推送失败！仓库可能尚未创建${NC}"
        echo ""
        echo -e "${YELLOW}📋 解决步骤:${NC}"
        echo ""
        echo -e "  ${RED}步骤1: 创建GitHub仓库${NC}"
        echo "  ─────────────────"
        echo "  ① 打开浏览器访问:"
        echo "     ${CYAN}https://github.com/new${NC}"
        echo ""
        echo "  ② 填写仓库信息:"
        echo "     Repository name: ${YELLOW}1${NC}"
        echo "     Description: Linux安全防控系统 v2.0"
        echo "     选择: Private 或 Public"
        echo ""
        echo "  ${RED}⚠️  重要: 不要勾选以下选项！${NC}"
        echo "     ☐ Add a README file"
        echo "     ☐ Add .gitignore"
        echo "     ☐ Choose a license"
        echo ""
        echo "  ③ 点击: ${GREEN}Create repository${NC}"
        echo ""
        echo -e "  ${RED}步骤2: 重新运行部署${NC}"
        echo "  ─────────────────"
        echo "  创建仓库后，再次运行此脚本:"
        echo "  ${CYAN}./deploy-ssh.sh${NC}"
        echo ""
        return 1
    fi
}

main() {
    print_banner
    print_project_stats
    
    check_ssh_connection || {
        echo -e "${RED}错误: SSH未正确配置${NC}"
        exit 1
    }
    
    show_directory_structure
    push_to_github
}

main "$@"
