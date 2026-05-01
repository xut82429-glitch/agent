#!/bin/bash

# Linux安全防控系统 - GitHub部署脚本
# 使用方法: ./deploy.sh

echo "🛡️ Linux安全防控系统 - 部署脚本"
echo "=================================="

# 检查Git仓库状态
if [ ! -d ".git" ]; then
    echo "❌ 错误: 当前目录不是Git仓库"
    exit 1
fi

# 添加所有文件
echo "📦 正在添加文件..."
git add .

# 提交更改
echo "💾 正在提交代码..."
git commit -m "feat: 完善Linux安全防控系统 v1.0.0

- 添加完整的README文档
- 配置.gitignore文件
- 优化项目结构
- 包含10大核心安全模块"

# 推送到GitHub
echo "🚀 正在推送到GitHub..."
REMOTE_URL="git@github.com:Paoulo31/1.git"

# 检查远程仓库是否已配置
if git remote get-url origin &>/dev/null; then
    git remote set-url origin $REMOTE_URL
else
    git remote add origin $REMOTE_URL
fi

# 尝试推送
if git push -u origin main; then
    echo ""
    echo "✅ 推送成功！"
    echo "🌐 项目地址: https://github.com/Paoulo31/1"
    echo ""
    echo "📝 下一步操作:"
    echo "   1. 在浏览器中打开上述地址查看项目"
    echo "   2. 如果需要在线预览，启用GitHub Pages功能"
    echo "   3. Settings -> Pages -> Source选择main分支"
else
    echo ""
    echo "⚠️  推送失败！可能的原因:"
    echo "   1. GitHub仓库尚未创建（请先在GitHub上创建仓库）"
    echo "   2. SSH密钥未配置（请参考: https://docs.github.com/authentication/connecting-to-github-with-ssh)"
    echo "   3. 权限不足（请确认您有该仓库的写入权限）"
    echo ""
    echo "🔧 解决方案:"
    echo "   1. 访问 https://github.com/new 创建新仓库 '1'"
    echo "   2. 配置SSH密钥: ssh-keygen -t ed25519 -C 'your_email@example.com'"
    echo "   3. 再次运行此脚本: ./deploy.sh"
    exit 1
fi

echo ""
echo "🎉 部署完成！感谢使用Linux安全防控系统！"
