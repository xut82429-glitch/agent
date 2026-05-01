# 🛡️ Linux安全防控系统 v2.0 (Linux Security Defense System)

## 项目简介
**专业的开箱即用Linux平台安全防控系统** - 基于Web的现代化安全管理仪表盘，采用专业级分层架构设计。

## ✨ 核心特性

### 🏗️ 专业级架构（v2.0全新升级）
- **分层目录结构** - 清晰的文件组织和模块划分
- **组件化开发** - 独立的功能模块，易于维护和扩展
- **事件驱动架构** - 基于EventBus的高效通信机制
- **响应式设计** - 完美适配桌面端和移动设备
- **零依赖运行** - 纯原生技术栈，无需构建工具

### 🔐 十大核心功能模块

| 模块 | 功能 | 文件位置 |
|------|------|----------|
| 📊 **安全仪表盘** | 实时监控、安全评分、威胁统计 | `js/modules/dashboard.js` |
| 🔥 **防火墙管理** | iptables规则可视化配置与管理 | `js/modules/firewall.js` |
| 👥 **用户权限** | 用户账户、sudo权限、SSH密钥管理 | `js/modules/users.js` |
| ⚙️ **服务监控** | 系统服务状态实时监控与控制 | `js/modules/services.js` |
| 📝 **日志审计** | 系统/认证/安全日志集中查看与分析 | `js/modules/logs.js` |
| 🚨 **入侵检测** | 实时威胁检测、攻击类型分析、自动防御 | `js/modules/intrusion.js` |
| 🔍 **漏洞扫描** | 自动漏洞扫描、CVSS评分、修复建议 | `js/modules/vulnerability.js` |
| 🌐 **网络监控** | 连接状态、带宽使用、流量统计 | `js/modules/network.js` |
| 💾 **备份恢复** | 自动化备份策略、一键恢复功能 | `js/modules/backup.js` |
| ⚙️ **安全设置** | 密码策略、SSH加固、防火墙策略配置 | `js/modules/settings.js` |

## 📁 项目结构（专业分级）

```
linux-security-system/
│
├── index.html                    # 主入口文件 (应用骨架)
├── README.md                     # 项目文档
├── package.json                  # 项目配置
├── .gitignore                   # Git忽略规则
├── deploy.sh                     # 一键部署脚本
│
├── css/                          # CSS样式系统 (分层架构)
│   ├── main.css                 # 主入口 - 导入所有样式
│   ├── variables.css            # 变量定义 - 主题色彩系统
│   ├── base.css                 # 基础样式 - 全局重置和基础元素
│   ├── layout.css               # 布局系统 - 侧边栏、主内容区
│   ├── components.css           # 组件样式 - 卡片、按钮、表格等
│   ├── ui-components.css        # UI组件 - 模态框、表单、分页等
│   └── responsive.css           # 响应式 - 移动端适配
│
├── js/                           # JavaScript核心系统
│   ├── app.js                   # 应用入口 - 初始化和路由控制
│   │
│   ├── core/                    # 核心框架层
│   │   ├── config.js            # 配置管理 - 全局常量和主题
│   │   ├── events.js            # 事件总线 - 发布订阅模式
│   │   └── utils.js             # 工具函数 - 通用方法库
│   │
│   └── modules/                 # 业务模块层 (10个独立模块)
│       ├── dashboard.js         # 仪表盘模块
│       ├── firewall.js          # 防火墙模块
│       ├── users.js             # 用户权限模块
│       ├── services.js          # 服务监控模块
│       ├── logs.js              # 日志审计模块
│       ├── intrusion.js         # 入侵检测模块
│       ├── vulnerability.js     # 漏洞扫描模块
│       ├── network.js           # 网络监控模块
│       ├── backup.js            # 备份恢复模块
│       └── settings.js          # 安全设置模块
│
├── assets/                       # 静态资源目录
│   ├── images/                  # 图片资源
│   └── icons/                   # 图标资源
│
└── config/                       # 配置文件目录
```

## 🎯 技术架构亮点

### 1. 分层设计原则
```
┌─────────────────────────────────────┐
│          表现层 (Presentation)      │  ← HTML + CSS
├─────────────────────────────────────┤
│          应用层 (Application)       │  ← app.js (路由、初始化)
├─────────────────────────────────────┤
│          业务逻辑层 (Business)      │  ← modules/*.js (10大模块)
├─────────────────────────────────────┤
│          核心框架层 (Core)          │  ← core/*.js (配置、事件、工具)
└─────────────────────────────────────┘
```

### 2. CSS分层架构
```css
/* Layer 1: Design Tokens (变量层) */
@import url('variables.css');        /* 颜色、间距、字体等 */

/* Layer 2: Base Reset (基础层) */
@import url('base.css');              /* 重置、全局样式 */

/* Layer 3: Layout System (布局层) */
@import url('layout.css');            /* Grid、Flexbox布局 */

/* Layer 4: Components (组件层) */
@import url('components.css');        /* 可复用UI组件 */

/* Layer 5: UI Patterns (模式层) */
@import url('ui-components.css');     /* 复杂交互组件 */

/* Layer 6: Responsive (响应式层) */
@import url('responsive.css');        /* 断点、媒体查询 */
```

### 3. JavaScript模块化
- **单一职责**: 每个模块专注一个功能领域
- **依赖注入**: 通过全局变量传递实例
- **事件驱动**: EventBus解耦模块间通信
- **生命周期**: init() / destroy() 统一管理

## 🚀 快速开始

### 方式一：直接打开（推荐）
```bash
# 克隆项目
git clone git@github.com:Paoulo31/1.git
cd 1

# 直接用浏览器打开
open index.html              # macOS
xdg-open index.html          # Linux
start index.html             # Windows
```

### 方式二：本地HTTP服务
```bash
# 使用Python
python3 -m http.server 8000

# 使用Node.js
npx serve .

# 访问 http://localhost:8000
```

### 方式三：使用部署脚本
```bash
chmod +x deploy.sh
./deploy.sh
```

## 📊 浏览器兼容性

| 浏览器 | 版本要求 | 支持状态 |
|--------|----------|----------|
| Chrome | 90+ | ✅ 完全支持 |
| Firefox | 88+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 90+ | ✅ 完全支持 |
| Opera | 76+ | ✅ 完全支持 |

## 🎨 功能预览

### 📊 安全仪表盘
- 系统整体安全评分（0-100分）
- CPU/内存/磁盘实时监控
- 网络流量统计
- 最近安全事件时间线
- 快速操作入口

### 🔥 防火墙管理
- 规则列表可视化展示
- 新增/编辑/删除规则
- 规则启用/禁用切换
- 按协议、动作筛选
- 防护统计概览

### 🚨 入侵检测
- 实时威胁监控面板
- 攻击类型分类统计（暴力破解、端口扫描、DDoS等）
- 告警事件详细记录
- IP封禁操作
- 全面扫描功能

### 🔍 漏洞扫描
- 一键全系统扫描（带进度动画）
- CVE编号关联查询
- CVSS评分系统
- 漏洞等级分类（严重/高危/中危/低危）
- 一键修复补丁

### 💾 备份恢复
- 多种备份类型（完整/增量/数据库）
- 备份计划管理
- 存储空间监控
- 一键恢复功能
- 加密压缩选项

## 🔧 开发指南

### 添加新模块
1. 在 `js/modules/` 创建新文件 `yourModule.js`
2. 定义类并继承标准接口：
   ```javascript
   class YourModule {
       constructor() { this.init(); }
       init() { this.render(); }
       render() { /* 渲染UI */ }
       destroy() { /* 清理资源 */ }
   }
   ```
3. 在 `index.html` 中添加页面容器
4. 在 `app.js` 中注册模块
5. 在侧边栏添加导航项

### 自定义主题
编辑 `css/variables.css` 修改CSS变量：
```css
:root {
    --primary: #2563eb;      /* 主色调 */
    --bg-dark: #0f172a;      /* 背景色 */
    --text-primary: #f8fafc; /* 文字颜色 */
}
```

## 📈 版本历史

### v2.0.0 (2026-05-01)
- ✨ 全新专业级分层架构
- 🎨 CSS六层分离设计
- 🧩 JavaScript模块化重构
- 📱 完整移动端适配
- 🔄 事件驱动通信机制
- 📦 零依赖纯原生实现

### v1.0.0
- 🎉 初始版本发布
- 单文件实现

## 🛡️ 安全特性

- ✅ **零依赖** - 无第三方库，无供应链风险
- ✅ **本地运行** - 所有数据处理在本地完成
- ✅ **离线可用** - 完全支持断网环境
- ✅ **代码透明** - 开源可审计
- ✅ **隐私保护** - 不收集任何用户数据

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📄 许可证

MIT License

## 👨‍💻 作者

**开发者**: AI Assistant  
**版本**: v2.0.0 Professional Edition  
**架构**: 专业级分层模块化设计  

---

## ⭐ Star支持

如果这个项目对您有帮助，请给一个⭐支持！

🚀 **从单文件到专业级架构的质的飞跃！**
