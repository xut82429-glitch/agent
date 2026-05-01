#!/bin/bash

# =====================================================
# Linux安全防控系统 v2.0 - GitHub部署脚本
# Professional Linux Security Defense System
# =====================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  🛡️  Linux安全防控系统 v2.0 部署工具       ║"
echo "║     Professional Security Defense System    ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目统计信息
print_project_info() {
    echo -e "${BLUE}📊 项目统计信息${NC}"
    echo "───────────────────────────────────────"
    
    local total_files=$(find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" \) ! -path "./node_modules/*" | wc -l)
    local total_lines=$(find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" \) ! -path "./node_modules/*" -exec wc -l {} + | tail -1 | awk '{print $1}')
    local css_files=$(find ./css -name "*.css" 2>/dev/null | wc -l)
    local js_files=$(find ./js -name "*.js" 2>/dev/null | wc -l)
    local modules=$(find ./js/modules -name "*.js" 2>/dev/null | wc -l)
    
    echo -e "  📁 总文件数:      ${GREEN}${total_files} 个${NC}"
    echo -e "  📝 总代码行数:    ${GREEN}${total_lines} 行${NC}"
    echo -e "  🎨 CSS文件:       ${GREEN}${css_files} 个 (6层分离架构)${NC}"
    echo -e "  ⚙️ JavaScript:    ${GREEN}${js_files} 个${NC}"
    echo -e "  🧩 功能模块:      ${GREEN}${modules} 个独立模块${NC}"
    echo ""
}

# 检查Git状态
check_git_status() {
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ 错误: 当前目录不是Git仓库${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}� Git仓库状态检查${NC}"
    echo "───────────────────────────────────────"
    git status --short | head -5
    
    if [ $(git status --short | wc -l) -gt 0 ]; then
        echo ""
        echo -e "${YELLOW}⚠️  检测到未提交的更改${NC}"
        return 1
    else
        echo ""
        echo -e "${GREEN}✅ 工作区干净${NC}"
        return 0
    fi
}

# 推送到GitHub
push_to_github() {
    REMOTE_URL="git@github.com:Paoulo31/1.git"
    
    echo -e "${BLUE}🚀 推送到GitHub${NC}"
    echo "───────────────────────────────────────"
    echo "目标仓库: ${REMOTE_URL}"
    echo ""
    
    # 检查远程仓库配置
    if git remote get-url origin &>/dev/null; then
        echo "更新远程仓库地址..."
        git remote set-url origin $REMOTE_URL
    else
        echo "添加远程仓库..."
        git remote add origin $REMOTE_URL
    fi
    
    # 尝试推送
    echo "正在推送代码..."
    if git push -u origin main 2>&1; then
        echo ""
        echo -e "${GREEN}✅✅✅ 推送成功！✅✅✅${NC}"
        echo ""
        echo -e "${BLUE}🌐 项目访问地址:${NC}"
        echo "   https://github.com/Paoulo31/1"
        echo ""
        echo -e "${YELLOW}📝 后续操作:${NC}"
        echo "   1. 在浏览器中打开上述地址查看项目"
        echo "   2. 启用GitHub Pages (Settings → Pages → Source: main分支)"
        echo "   3. 访问在线预览: https://paoulo31.github.io/1/"
        echo ""
        return 0
    else
        echo ""
        echo -e "${RED}❌ 推送失败！${NC}"
        echo ""
        echo -e "${YELLOW}可能的原因及解决方案:${NC}"
        echo ""
        echo "  ${RED}原因1: GitHub仓库尚未创建${NC}"
        echo "  解决方案:"
        echo "    ① 打开浏览器访问: https://github.com/new"
        echo "    ② 仓库名称填写: 1"
        echo "    ③ 选择 Private 或 Public"
        echo "    ④ ${YELLOW}不要勾选${NC} README, .gitignore等选项"
        echo "    ⑤ 点击 'Create repository'"
        echo "    ⑥ 再次运行此脚本: ./deploy.sh"
        echo ""
        echo "  ${RED}原因2: SSH密钥未配置${NC}"
        echo "  解决方案:"
        echo "    ① 生成SSH密钥: ssh-keygen -t ed25519 -C 'your_email@example.com'"
        echo "    ② 复制公钥: cat ~/.ssh/id_ed25519.pub"
        echo "    ③ 添加到GitHub: https://github.com/settings/ssh/new"
        echo "    ④ 测试连接: ssh -T git@github.com"
        echo "    ⑤ 再次运行此脚本: ./deploy.sh"
        echo ""
        echo "  ${RED}原因3: 权限不足${NC}"
        echo "  解决方案:"
        echo "    确认您对仓库 Paoulo31/1 有写入权限"
        echo ""
        return 1
    fi
}

# 显示目录结构
show_directory_tree() {
    echo -e "${BLUE}📂 项目目录结构${NC}"
    echo "───────────────────────────────────────"
    
    find . -type f \( -name "*.html" -o -name "*.css" -o -name "*.js" -o -name "*.json" -o -name "*.md" -o -name "*.sh" \) \
         ! -path "./node_modules/*" \
         ! -path "./.git/*" \
         | sort \
         | sed 's|^\./||' \
         | while read file; do
        depth=$(($(echo "$file" | tr -cd '/' | wc -c)))
        indent=""
        for ((i=0; i<depth; i++)); do
            indent="  ${indent}"
        done
        
        case "${file##*.}" in
            html) color="${GREEN}" ;;
            css)  color="${BLUE}" ;;
            js)   color="${YELLOW}" ;;
            json) color="${RED}" ;;
            *)    color="${NC}" ;;
        esac
        
        echo -e "  ${indent}${color}├─ ${file}${NC}"
    done
    echo ""
}

# 主流程
main() {
    print_project_info
    show_directory_tree
    
    check_git_status || true
    
    push_to_github
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}╔══════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  🎉 部署完成！感谢使用Linux安全防控系统！    ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════╝${NC}"
        exit 0
    else
        exit 1
    fi
}

# 运行主程序
main "$@"
