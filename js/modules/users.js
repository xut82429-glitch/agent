class UsersModule {
    constructor() {
        this.users = [];
        this.roles = [];
        this.permissions = [];
        this.auditLogs = [];
        this.groups = [];
        this.passwordPolicies = {};
        this.sessions = [];
        this.init();
    }

    init() {
        this.render();
        this.loadRBACModel();
        this.loadUsers();
        this.loadAuditLogs();
        eventBus.on('users:refresh', () => {
            this.loadUsers();
            this.loadAuditLogs();
        });
    }

    render() {
        const container = document.getElementById('page-users');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>👥 企业级用户权限管理 v3.2</h2>
                <div class="header-actions">
                    <button class="btn btn-outline" onclick="usersModule.showPermissionMatrixModal()">📋 权限矩阵</button>
                    <button class="btn btn-outline" onclick="usersModule.showAuditLogModal()">📜 审计日志</button>
                    <button class="btn btn-primary" onclick="usersModule.showAddUserModal()">➕ 添加用户</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('users:refresh')">🔄 刷新</button>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-6" style="margin-bottom: 24px;">
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px;" id="totalUsers">0</div>
                    <div class="stat-label">总用户数</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--primary);" id="activeUsers">0</div>
                    <div class="stat-label">活跃会话</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--warning);" id="adminUsers">0</div>
                    <div class="stat-label">管理员数</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--danger);" id="lockedUsers">0</div>
                    <div class="stat-label">锁定账户</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--success);" id="totalRoles">0</div>
                    <div class="stat-label">角色数量</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--info);" id="todayLogins">0</div>
                    <div class="stat-label">今日登录</div>
                </div>
            </div>

            <!-- 主内容区 -->
            <div class="grid grid-3" style="gap: 20px;">
                <!-- 用户列表 -->
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">👤 用户列表</h3>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <input type="text" placeholder="🔍 搜索用户/角色..." 
                                   class="form-input" 
                                   style="max-width: 220px; font-size: 13px;" 
                                   oninput="usersModule.searchUsers(this.value)">
                            <select class="form-select" style="width: auto; font-size: 13px;" onchange="usersModule.filterByRole(this.value)">
                                <option value="">所有角色</option>
                            </select>
                            <select class="form-select" style="width: auto; font-size: 13px;" onchange="usersModule.filterByStatus(this.value)">
                                <option value="">所有状态</option>
                                <option value="active">✅ 活跃</option>
                                <option value="locked">🔒 锁定</option>
                                <option value="expired">⏰ 过期</option>
                            </select>
                        </div>
                    </div>

                    <div id="usersTableContainer" style="max-height: 500px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th width="40"><input type="checkbox"></th>
                                    <th>用户名</th>
                                    <th>角色</th>
                                    <th>组</th>
                                    <th>最后登录</th>
                                    <th>状态</th>
                                    <th>MFA</th>
                                    <th width="180">操作</th>
                                </tr>
                            </thead>
                            <tbody id="usersTableBody">
                            </tbody>
                        </table>
                    </div>

                    <div class="table-footer" style="padding: 12px 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <span id="userPaginationInfo">显示 0 个用户</span>
                        <div>
                            <button class="btn btn-sm btn-warning" onclick="usersModule.batchLockUsers()">
                                🔒 批量锁定
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="usersModule.exportUserList()">
                                📥 导出用户列表
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 右侧面板 -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- 角色分布 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🎭 角色分布</h3>
                            <button class="btn btn-xs btn-primary" onclick="usersModule.showRoleManager()">管理</button>
                        </div>
                        <div id="roleDistribution" style="padding: 8px 0;"></div>
                    </div>

                    <!-- 最近登录活动 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🕐 最近登录活动</h3>
                        </div>
                        <div id="recentLogins" style="max-height: 200px; overflow-y: auto;"></div>
                    </div>

                    <!-- 密码策略状态 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🔐 安全策略</h3>
                            <span class="status-badge success" id="policyStatus">✅ 已启用</span>
                        </div>
                        <div id="passwordPolicyStatus" style="padding: 8px 0;"></div>
                    </div>
                </div>
            </div>

            <!-- RBAC可视化区域 -->
            <div class="grid grid-2" style="margin-top: 24px; gap: 20px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🔗 角色-权限关系图</h3>
                        <button class="btn btn-xs btn-outline" onclick="usersModule.refreshPermissionGraph()">刷新</button>
                    </div>
                    <div id="permissionGraph" style="height: 350px; background: var(--bg-secondary); border-radius: var(--radius-md); padding: 20px; position: relative; overflow: hidden;"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">👥 用户组结构</h3>
                        <button class="btn btn-xs btn-primary" onclick="usersModule.showGroupManager()">管理组</button>
                    </div>
                    <div id="groupStructure" style="height: 350px; background: var(--bg-secondary); border-radius: var(--radius-md); padding: 20px; overflow-y: auto;"></div>
                </div>
            </div>
        `;
    }

    loadRBACModel() {
        this.roles = [
            { 
                id: 'super_admin', 
                name: '超级管理员', 
                description: '拥有系统全部权限', 
                level: 100,
                userCount: 2,
                permissions: ['all'],
                color: '#ef4444',
                icon: '👑'
            },
            { 
                id: 'security_admin', 
                name: '安全管理员', 
                description: '负责安全配置和监控', 
                level: 90,
                userCount: 3,
                permissions: ['firewall_manage', 'ids_manage', 'logs_view', 'vulnerability_scan', 'users_view'],
                color: '#f59e0b',
                icon: '🛡️'
            },
            { 
                id: 'system_admin', 
                name: '系统管理员', 
                description: '负责系统运维和管理', 
                level: 80,
                userCount: 5,
                permissions: ['services_manage', 'backup_manage', 'system_config', 'docker_manage', 'network_view'],
                color: '#3b82f6',
                icon: '⚙️'
            },
            { 
                id: 'auditor', 
                name: '审计员', 
                description: '只读访问审计日志和报告', 
                level: 60,
                userCount: 4,
                permissions: ['logs_view', 'audit_reports', 'users_view'],
                color: '#8b5cf6',
                icon: '📋'
            },
            { 
                id: 'developer', 
                name: '开发者', 
                description: '开发环境有限权限', 
                level: 40,
                userCount: 8,
                permissions: ['docker_view', 'services_view', 'network_view'],
                color: '#10b981',
                icon: '💻'
            },
            { 
                id: 'viewer', 
                name: '只读用户', 
                description: '仅查看仪表盘和基础信息', 
                level: 10,
                userCount: 15,
                permissions: ['dashboard_view'],
                color: '#6b7280',
                icon: '👁️'
            }
        ];

        this.permissions = [
            { id: 'dashboard_view', name: '查看仪表盘', category: 'general' },
            { id: 'firewall_manage', name: '防火墙管理', category: 'security' },
            { id: 'ids_manage', name: '入侵检测管理', category: 'security' },
            { id: 'vulnerability_scan', name: '漏洞扫描', category: 'security' },
            { id: 'logs_view', name: '查看日志', category: 'monitoring' },
            { id: 'audit_reports', name: '审计报告', category: 'monitoring' },
            { id: 'services_manage', name: '服务管理', category: 'operations' },
            { id: 'services_view', name: '查看服务', category: 'operations' },
            { id: 'backup_manage', name: '备份管理', category: 'operations' },
            { id: 'system_config', name: '系统配置', category: 'operations' },
            { id: 'docker_manage', name: 'Docker管理', category: 'containers' },
            { id: 'docker_view', name: '查看Docker', category: 'containers' },
            { id: 'network_view', name: '网络查看', category: 'network' },
            { id: 'network_manage', name: '网络管理', category: 'network' },
            { id: 'users_view', name: '查看用户', category: 'administration' },
            { id: 'users_manage', name: '用户管理', category: 'administration' },
            { id: 'roles_manage', name: '角色管理', category: 'administration' },
            { id: 'settings_modify', name: '修改设置', category: 'administration' }
        ];

        this.groups = [
            { id: 'admin', name: '管理员组', members: ['admin', 'root'], gid: 100, description: '系统管理员' },
            { id: 'developer', name: '开发组', members: ['developer', 'devops'], gid: 1001, description: '开发团队成员' },
            { id: 'security', name: '安全组', members: ['secadmin', 'analyst'], gid: 1002, description: '安全团队' },
            { id: 'backup', name: '备份组', members: ['backup'], gid: 1003, description: '备份操作员' }
        ];

        this.passwordPolicies = {
            minLength: 12,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: true,
            maxAgeDays: 90,
            historyCount: 10,
            lockoutThreshold: 5,
            lockoutDurationMinutes: 30,
            enabled: true
        };
    }

    loadUsers() {
        this.users = [
            {
                username: 'root',
                uid: 0,
                displayName: '超级管理员',
                email: 'root@localhost',
                roles: ['super_admin'],
                groups: ['root'],
                shell: '/bin/bash',
                lastLogin: '2026-05-01 14:30:22',
                loginIP: '192.168.1.100',
                status: 'active',
                locked: false,
                mfaEnabled: true,
                mfaType: 'TOTP',
                passwordExpiry: '2026-08-01',
                passwordChanged: '2026-05-01',
                failedLoginAttempts: 0,
                createdAt: '2024-01-01',
                lastPasswordChange: '2026-04-01',
                mustChangePassword: false,
                isSystem: true,
                homeDir: '/root',
                comment: 'Super User'
            },
            {
                username: 'admin',
                uid: 1000,
                displayName: '张三 (管理员)',
                email: 'zhangsan@company.com',
                roles: ['security_admin', 'system_admin'],
                groups: ['admin', 'security'],
                shell: '/bin/bash',
                lastLogin: '2026-05-01 14:25:18',
                loginIP: '192.168.1.105',
                status: 'active',
                locked: false,
                mfaEnabled: true,
                mfaType: 'TOTP + SMS',
                passwordExpiry: '2026-07-15',
                passwordChanged: '2026-04-15',
                failedLoginAttempts: 0,
                createdAt: '2024-03-15',
                lastPasswordChange: '2026-04-15',
                mustChangePassword: false,
                isSystem: false,
                homeDir: '/home/admin',
                comment: 'Primary System Administrator'
            },
            {
                username: 'developer',
                uid: 1001,
                displayName: '李四 (开发工程师)',
                email: 'lisi@company.com',
                roles: ['developer'],
                groups: ['developer'],
                shell: '/bin/zsh',
                lastLogin: '2026-04-30 18:45:33',
                loginIP: '192.168.1.150',
                status: 'active',
                locked: false,
                mfaEnabled: true,
                mfaType: 'TOTP',
                passwordExpiry: '2026-06-20',
                passwordChanged: '2026-03-22',
                failedLoginAttempts: 1,
                createdAt: '2024-06-01',
                lastPasswordChange: '2026-03-22',
                mustChangePassword: false,
                isSystem: false,
                homeDir: '/home/developer',
                comment: 'Backend Developer'
            },
            {
                username: 'secadmin',
                uid: 1002,
                displayName: '王五 (安全分析师)',
                email: 'wangwu@company.com',
                roles: ['security_admin', 'auditor'],
                groups: ['security', 'admin'],
                shell: '/bin/bash',
                lastLogin: '2026-05-01 09:12:44',
                loginIP: '10.0.0.55',
                status: 'active',
                locked: false,
                mfaEnabled: true,
                mfaType: 'Hardware Token',
                passwordExpiry: '2026-08-10',
                passwordChanged: '2026-05-10',
                failedLoginAttempts: 0,
                createdAt: '2024-02-20',
                lastPasswordChange: '2026-05-10',
                mustChangePassword: false,
                isSystem: false,
                homeDir: '/home/secadmin',
                comment: 'Security Analyst'
            },
            {
                username: 'testuser',
                uid: 1003,
                displayName: '测试用户',
                email: 'test@company.com',
                roles: ['viewer'],
                groups: [],
                shell: '/bin/bash',
                lastLogin: '2026-04-15 09:20:11',
                loginIP: '192.168.1.200',
                status: 'locked',
                locked: true,
                mfaEnabled: false,
                mfaType: '-',
                passwordExpiry: '2026-03-01',
                passwordChanged: '2025-12-01',
                failedLoginAttempts: 8,
                createdAt: '2025-06-15',
                lastPasswordChange: '2025-12-01',
                mustChangePassword: true,
                isSystem: false,
                homeDir: '/home/testuser',
                comment: 'Test Account - LOCKED'
            },
            {
                username: 'backup',
                uid: 1004,
                displayName: '赵六 (备份操作员)',
                email: 'zhaoliu@company.com',
                roles: ['system_admin'],
                groups: ['backup'],
                shell: '/bin/bash',
                lastLogin: '2026-05-01 03:00:00',
                loginIP: '10.0.0.100',
                status: 'active',
                locked: false,
                mfaEnabled: false,
                mfaType: '-',
                passwordExpiry: '2026-07-28',
                passwordChanged: '2026-04-28',
                failedLoginAttempts: 0,
                createdAt: '2024-08-10',
                lastPasswordChange: '2026-04-28',
                mustChangePassword: false,
                isSystem: false,
                homeDir: '/home/backup',
                comment: 'Backup Operator'
            }
        ];

        this.renderUsers();
        this.updateStats();
        this.renderRoleDistribution();
        this.renderRecentLogins();
        this.renderPasswordPolicyStatus();
        this.renderPermissionGraph();
        this.renderGroupStructure();
        
        document.getElementById('totalRoles').textContent = this.roles.length;
    }

    renderUsers(filteredUsers = null) {
        const users = filteredUsers || this.users;
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 48px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">👥</div>
                        <div>暂无匹配的用户</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = users.map(user => {
            const primaryRole = this.roles.find(r => r.id === user.roles[0]);
            
            return `
                <tr class="${user.locked ? 'opacity-50' : ''}">
                    <td><input type="checkbox" data-user="${user.username}"></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="
                                width: 32px; height: 32px; border-radius: 50%; 
                                background: ${primaryRole?.color || '#6b7280'}; 
                                display: flex; align-items: center; justify-content: center;
                                color: white; font-weight: bold; font-size: 14px;
                            ">
                                ${user.displayName.charAt(0)}
                            </div>
                            <div>
                                <strong>${user.username}</strong>
                                <div style="font-size: 11px; color: var(--text-muted);">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        ${user.roles.map(roleId => {
                            const role = this.roles.find(r => r.id === roleId);
                            return role ? `<span class="status-badge" style="background: ${role.color}20; color: ${role.color}; font-size: 10px;">${role.icon} ${role.name}</span>` : '';
                        }).join(' ')}
                    </td>
                    <td><code style="font-size: 12px;">${user.groups.join(', ') || '-'}</code></td>
                    <td>
                        <div style="font-size: 12px;">${user.lastLogin}</div>
                        <div style="font-size: 10px; color: var(--text-muted);">${user.loginIP}</div>
                    </td>
                    <td>
                        <span class="status-badge ${
                            user.status === 'active' ? 'success' :
                            user.status === 'locked' ? 'danger' : 'warning'
                        }">${
                            user.status === 'active' ? '● 活跃' :
                            user.status === 'locked' ? '🔒 锁定' : '⏰ 过期'
                        }</span>
                    </td>
                    <td>
                        ${user.mfaEnabled ? '<span class="status-badge success" style="font-size: 10px;">✓ MFA</span>' : '<span class="status-badge danger" style="font-size: 10px;">✗ 无MFA</span>'}
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-xs btn-outline" onclick="usersModule.viewUserProfile('${user.username}')" title="详情">👁️</button>
                            <button class="btn btn-xs btn-primary" onclick="usersModule.editUser('${user.username}')" title="编辑">✏️</button>
                            ${!user.locked ? 
                                `<button class="btn btn-xs btn-warning" onclick="usersModule.lockUser('${user.username}')" title="锁定">🔒</button>` :
                                `<button class="btn btn-xs btn-success" onclick="usersModule.unlockUser('${user.username}')" title="解锁">🔓</button>`
                            }
                            <button class="btn btn-xs btn-danger" onclick="usersModule.deleteUser('${user.username}')" title="删除">🗑️</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        document.getElementById('userPaginationInfo').textContent = `显示 ${users.length} 个用户，共 ${this.users.length} 个`;
    }

    updateStats() {
        document.getElementById('totalUsers').textContent = this.users.length;
        document.getElementById('activeUsers').textContent = this.users.filter(u => u.status === 'active').length;
        document.getElementById('adminUsers').textContent = this.users.filter(u => u.roles.includes('super_admin') || u.roles.includes('security_admin')).length;
        document.getElementById('lockedUsers').textContent = this.users.filter(u => u.locked).length;
        document.getElementById('todayLogins').textContent = Utils.randomInRange(25, 50);
    }

    renderRoleDistribution() {
        const container = document.getElementById('roleDistribution');
        if (!container) return;

        container.innerHTML = this.roles.slice(0, 5).map(role => `
            <div style="
                padding: 10px 12px; 
                border-radius: var(--radius-md); 
                margin-bottom: 8px;
                background: ${role.color}10;
                border-left: 3px solid ${role.color};
                cursor: pointer;
                transition: all 0.2s;
            " onclick="usersModule.filterByRoleDirect('${role.id}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 13px;">${role.icon} ${role.name}</span>
                    <span class="status-badge" style="background: ${role.color}; color: white; font-size: 10px;">${role.userCount}人</span>
                </div>
            </div>
        `).join('');
    }

    renderRecentLogins() {
        const container = document.getElementById('recentLogins');
        if (!container) return;

        const recentLogins = [
            { user: 'admin', time: '刚刚', ip: '192.168.1.105', success: true },
            { user: 'secadmin', time: '5分钟前', ip: '10.0.0.55', success: true },
            { user: 'developer', time: '23分钟前', ip: '192.168.1.150', success: true },
            { user: 'unknown', time: '1小时前', ip: '203.0.113.50', success: false },
            { user: 'backup', time: '2小时前', ip: '10.0.0.100', success: true }
        ];

        container.innerHTML = recentLogins.map(login => `
            <div style="
                padding: 8px 0; 
                border-bottom: 1px solid var(--border-light);
                font-size: 12px;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <strong>${login.user}</strong>
                    <span class="status-badge ${login.success ? 'success' : 'danger'}" style="font-size: 9px;">
                        ${login.success ? '✓ 成功' : '✗ 失败'}
                    </span>
                </div>
                <div style="color: var(--text-muted);">
                    ${login.ip} · ${login.time}
                </div>
            </div>
        `).join('');
    }

    renderPasswordPolicyStatus() {
        const container = document.getElementById('passwordPolicyStatus');
        if (!container) return;

        const p = this.passwordPolicies;

        container.innerHTML = `
            <div style="space-y: 8px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between;">
                    <span>最小长度:</span>
                    <strong style="color: ${p.minLength >= 12 ? 'var(--success)' : 'var(--danger)'}">${p.minLength}字符</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>密码有效期:</span>
                    <strong>${p.maxAgeDays}天</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>锁定阈值:</span>
                    <strong>${p.lockoutThreshold}次失败</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>历史记录:</span>
                    <strong>最近${p.historyCount}个</strong>
                </div>
                <hr style="border-color: var(--border-color); margin: 8px 0;">
                <div style="display: flex; justify-content: space-between;">
                    <span>弱密码用户:</span>
                    <strong style="color: var(--danger);">2</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>即将过期:</span>
                    <strong style="color: var(--warning);">3</strong>
                </div>
            </div>
        `;
    }

    renderPermissionGraph() {
        const container = document.getElementById('permissionGraph');
        if (!container) return;

        let html = '<div style="position: relative; height: 100%;">';
        
        html += '<div style="display: flex; justify-content: space-around; align-items: flex-start; padding: 20px 0;">';
        
        this.roles.forEach((role, index) => {
            const permCount = role.permissions[0] === 'all' ? '全部' : role.permissions.length;
            
            html += `
                <div style="text-align: center; width: 120px;">
                    <div style="
                        width: 60px; height: 60px; border-radius: 50%;
                        background: ${role.color};
                        margin: 0 auto 8px;
                        display: flex; align-items: center; justify-content: center;
                        font-size: 28px;
                        box-shadow: 0 4px 12px ${role.color}40;
                    ">${role.icon}</div>
                    <div style="font-weight: 600; font-size: 12px; margin-bottom: 4px;">${role.name}</div>
                    <div style="font-size: 10px; color: var(--text-secondary);">${permCount}权限</div>
                    <div style="font-size: 10px; color: var(--text-muted);">${role.userCount}用户</div>
                </div>
                
                ${index < this.roles.length - 1 ? '<div style="width: 40px; height: 2px; background: linear-gradient(to right, ' + role.color + ', ' + this.roles[index+1].color + '); margin-top: 30px; opacity: 0.3;"></div>' : ''}
            `;
        });
        
        html += '</div>';

        html += `
            <div style="
                position: absolute;
                bottom: 16px;
                left: 20px;
                right: 20px;
                padding: 12px;
                background: rgba(255,255,255,0.05);
                border-radius: var(--radius-md);
                font-size: 11px;
                text-align: center;
                color: var(--text-secondary);
            ">
                💡 点击上方角色可查看详细权限列表 | 共 ${this.roles.length} 个角色 · ${this.permissions.length} 项权限定义
            </div>
        `;

        html += '</div>';
        container.innerHTML = html;
    }

    renderGroupStructure() {
        const container = document.getElementById('groupStructure');
        if (!container) return;

        container.innerHTML = this.groups.map(group => `
            <div style="
                padding: 12px;
                margin-bottom: 8px;
                background: var(--bg-tertiary);
                border-radius: var(--radius-md);
                border-left: 3px solid var(--primary);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <strong style="font-size: 13px;">📁 ${group.name}</strong>
                    <span class="status-badge info" style="font-size: 10px;">GID: ${group.gid}</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">${group.description}</div>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                    ${group.members.map(member => `
                        <code style="font-size: 10px; padding: 2px 6px; background: var(--bg-secondary); border-radius: 3px;">${member}</code>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    viewUserProfile(username) {
        const user = this.users.find(u => u.username === username);
        if (!user) return;

        const primaryRole = this.roles.find(r => r.id === user.roles[0]);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">👤 用户详细信息 - ${user.username}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-3" style="gap: 20px; margin-bottom: 24px;">
                        <div style="text-align: center;">
                            <div style="
                                width: 80px; height: 80px; border-radius: 50%;
                                background: ${primaryRole?.color || '#6b7280'};
                                margin: 0 auto 12px;
                                display: flex; align-items: center; justify-content: center;
                                font-size: 36px; color: white; font-weight: bold;
                            ">${user.displayName.charAt(0)}</div>
                            <h3 style="margin: 0 0 4px;">${user.displayName}</h3>
                            <p style="color: var(--text-secondary); font-size: 13px; margin: 0;">${user.comment || '-'}</p>
                            
                            <div style="margin-top: 12px;">
                                <span class="status-badge ${user.status === 'active' ? 'success pulse' : 'danger'}" style="font-size: 12px;">
                                    ${user.status === 'active' ? '● 在线' : '○ 离线'}
                                </span>
                            </div>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">📋 基本信息</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">用户名:</td><td style="padding: 4px;"><code>${user.username}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">UID:</td><td style="padding: 4px;"><strong>${user.uid}</strong></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">邮箱:</td><td style="padding: 4px;">${user.email}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">主目录:</td><td style="padding: 4px;"><code>${user.homeDir}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">Shell:</td><td style="padding: 4px;"><code>${user.shell}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">创建时间:</td><td style="padding: 4px;">${user.createdAt}</td></tr>
                            </table>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">🔐 安全信息</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">MFA:</td><td style="padding: 4px;"><span class="status-badge ${user.mfaEnabled ? 'success' : 'danger'}">${user.mfaEnabled ? '✓ 已启用 (' + user.mfaType + ')' : '✗ 未启用'}</span></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">密码过期:</td><td style="padding: 4px; ${new Date(user.passwordExpiry) < new Date() ? 'style="color: var(--danger);"' : ''}>${user.passwordExpiry}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">上次修改:</td><td style="padding: 4px;">${user.lastPasswordChange}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">登录失败:</td><td style="padding: 4px; style="color: ${user.failedLoginAttempts > 0 ? 'var(--danger)' : 'var(--success)'};">${user.failedLoginAttempts} 次</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">账户状态:</td><td style="padding: 4px;"><span class="status-badge ${user.locked ? 'danger' : 'success'}">${user.locked ? '🔒 已锁定' : '✅ 正常'}</span></td></tr>
                            </table>
                        </div>
                    </div>

                    <div class="grid grid-2" style="gap: 20px;">
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">🎭 分配的角色 (${user.roles.length})</h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${user.roles.map(roleId => {
                                    const role = this.roles.find(r => r.id === roleId);
                                    return role ? `
                                        <div style="
                                            padding: 8px 12px;
                                            background: ${role.color}15;
                                            border: 1px solid ${role.color}30;
                                            border-radius: var(--radius-md);
                                            font-size: 12px;
                                        ">
                                            <span style="font-size: 16px; margin-right: 4px;">${role.icon}</span>
                                            <strong>${role.name}</strong>
                                            <div style="font-size: 10px; color: var(--text-secondary); margin-top: 2px;">等级: ${role.level}</div>
                                        </div>
                                    ` : '';
                                }).join('')}
                            </div>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">👥 所属组 (${user.groups.length})</h4>
                            <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                                ${user.groups.length > 0 ? user.groups.map(groupId => {
                                    const group = this.groups.find(g => g.id === groupId);
                                    return group ? `<code style="font-size: 12px; padding: 4px 8px; background: var(--bg-tertiary); border-radius: 4px;">📁 ${group.name}</code>` : '';
                                }).join('') : '<span style="color: var(--text-muted); font-size: 12px;">未分配到任何组</span>'}
                            </div>
                        </div>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-top: 20px;">
                        <h4 style="margin-bottom: 12px; font-size: 14px;">🔑 权限列表</h4>
                        <div style="max-height: 200px; overflow-y: auto;">
                            ${this.getEffectivePermissions(user.roles).map(perm => {
                                const permission = this.permissions.find(p => p.id === perm);
                                return permission ? `
                                    <div style="
                                        padding: 6px 12px;
                                        margin-bottom: 4px;
                                        background: var(--bg-tertiary);
                                        border-radius: 4px;
                                        font-size: 12px;
                                        display: flex;
                                        justify-content: space-between;
                                    ">
                                        <span>✓ ${permission.name}</span>
                                        <span style="color: var(--text-muted);">${permission.category}</span>
                                    </div>
                                ` : '';
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-warning" onclick="usersModule.resetUserPassword('${user.username}'); this.closest('.modal-overlay').remove();">🔄 重置密码</button>
                    <button class="btn btn-outline" onclick="usersModule.forceLogout('${user.username}'); this.closest('.modal-overlay').remove();">🚪 强制登出</button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this.addAuditLog('view_user_profile', `查看用户资料: ${username}`, 'info');
    }

    getEffectivePermissions(roleIds) {
        let perms = new Set();
        
        roleIds.forEach(roleId => {
            const role = this.roles.find(r => r.id === roleId);
            if (role) {
                if (role.permissions[0] === 'all') {
                    this.permissions.forEach(p => perms.add(p.id));
                } else {
                    role.permissions.forEach(p => perms.add(p));
                }
            }
        });

        return Array.from(perms);
    }

    showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">➕ 创建新用户</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-2" style="gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">用户名 *</label>
                            <input type="text" class="form-input" id="newUsername" placeholder="例如: zhangsan">
                        </div>
                        <div class="form-group">
                            <label class="form-label">显示名称 *</label>
                            <input type="text" class="form-input" id="newDisplayName" placeholder="例如: 张三">
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">邮箱 *</label>
                            <input type="email" class="form-input" id="newEmail" placeholder="user@company.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">初始密码 *</label>
                            <input type="password" class="form-input" id="newPassword" placeholder="至少12位复杂密码">
                            <small style="color: var(--text-secondary);">必须包含大小写字母、数字和特殊字符</small>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">分配角色 *</label>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
                            ${this.roles.map(role => `
                                <label style="
                                    padding: 8px;
                                    border: 2px solid var(--border-light);
                                    border-radius: var(--radius-md);
                                    cursor: pointer;
                                    transition: all 0.2s;
                                " onclick="this.querySelector('input').checked = !this.querySelector('input').checked; this.style.borderColor = this.querySelector('input').checked ? '${role.color}' : 'var(--border-light)'; this.style.background = this.querySelector('input').checked ? '${role.color}10' : 'transparent';">
                                    <input type="checkbox" name="newRoles" value="${role.id}" style="display: none;">
                                    <div style="font-size: 16px; text-align: center;">${role.icon}</div>
                                    <div style="font-size: 12px; font-weight: 600; text-align: center;">${role.name}</div>
                                    <div style="font-size: 10px; color: var(--text-secondary); text-align: center;">等级 ${role.level}</div>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">所属组</label>
                        <select class="form-select" id="newGroups" multiple size="3" style="min-height: 80px;">
                            ${this.groups.map(group => `<option value="${group.id}">${group.name} (${group.description})</option>`).join('')}
                        </select>
                        <small style="color: var(--text-secondary);">按住Ctrl键可多选</small>
                    </div>

                    <div class="grid grid-3" style="gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">Shell</label>
                            <select class="form-select" id="newShell">
                                <option value="/bin/bash">Bash</option>
                                <option value="/bin/zsh">Zsh</option>
                                <option value="/usr/sbin/nologin">禁止登录</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">启用MFA</label>
                            <label class="toggle-switch" style="margin-top: 8px;">
                                <input type="checkbox" id="newMFA" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        <div class="form-group">
                            <label class="form-label">强制改密</label>
                            <label class="toggle-switch" style="margin-top: 8px;">
                                <input type="checkbox" id="newMustChange" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="usersModule.createUser()">创建用户</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createUser() {
        const username = document.getElementById('newUsername').value.trim();
        const displayName = document.getElementById('newDisplayName').value.trim();
        const email = document.getElementById('newEmail').value.trim();
        const password = document.getElementById('newPassword').value;
        const selectedRoles = Array.from(document.querySelectorAll('input[name="newRoles"]:checked')).map(cb => cb.value);
        const selectedGroups = Array.from(document.getElementById('newGroups').selectedOptions).map(opt => opt.value);

        if (!username || !displayName || !email || !password) {
            Utils.showToast('请填写必填字段', 'error');
            return;
        }

        if (selectedRoles.length === 0) {
            Utils.showToast('请至少选择一个角色', 'error');
            return;
        }

        if (!this.validatePassword(password)) {
            Utils.showToast('密码不符合安全策略要求', 'error');
            return;
        }

        const newUser = {
            username: username,
            uid: 1000 + this.users.length,
            displayName: displayName,
            email: email,
            roles: selectedRoles,
            groups: selectedGroups,
            shell: document.getElementById('newShell').value,
            lastLogin: '-',
            loginIP: '-',
            status: 'active',
            locked: false,
            mfaEnabled: document.getElementById('newMFA').checked,
            mfaType: document.getElementById('newMFA').checked ? 'TOTP' : '-',
            passwordExpiry: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            passwordChanged: new Date().toISOString().split('T')[0],
            failedLoginAttempts: 0,
            createdAt: new Date().toISOString().split('T')[0],
            lastPasswordChange: new Date().toISOString().split('T')[0],
            mustChangePassword: document.getElementById('newMustChange').checked,
            isSystem: false,
            homeDir: `/home/${username}`,
            comment: `Created via Admin Panel`
        };

        this.users.push(newUser);
        document.querySelector('.modal-overlay').remove();

        this.renderUsers();
        this.updateStats();
        this.renderRoleDistribution();

        this.addAuditLog('create_user', `创建新用户: ${username} (角色: ${selectedRoles.join(', ')})`, 'info');

        Utils.showToast(`用户 "${username}" 创建成功！`, 'success');

        eventBus.emit('notification:alert', {
            type: 'user_action',
            severity: 'info',
            title: '👤 新用户创建',
            message: `用户 ${username} (${displayName}) 已被创建并分配了 ${selectedRoles.length} 个角色`,
            source: 'User Management',
            metadata: { operator: 'admin', targetUser: username, assignedRoles: selectedRoles }
        });
    }

    validatePassword(password) {
        const p = this.passwordPolicies;
        
        if (password.length < p.minLength) return false;
        if (p.requireUppercase && !/[A-Z]/.test(password)) return false;
        if (p.requireLowercase && !/[a-z]/.test(password)) return false;
        if (p.requireNumbers && !/\d/.test(password)) return false;
        if (p.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) return false;
        
        return true;
    }

    editUser(username) {
        const user = this.users.find(u => u.username === username);
        if (!user) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ 编辑用户 - ${username}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-2" style="gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">显示名称</label>
                            <input type="text" class="form-input" id="editDisplayName" value="${user.displayName}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">邮箱</label>
                            <input type="email" class="form-input" id="editEmail" value="${user.email}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">修改角色</label>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 8px;">
                            ${this.roles.map(role => `
                                <label style="
                                    padding: 8px;
                                    border: 2px solid ${user.roles.includes(role.id) ? role.color : 'var(--border-light)'};
                                    border-radius: var(--radius-md);
                                    cursor: pointer;
                                    background: ${user.roles.includes(role.id) ? role.color + '10' : 'transparent'};
                                ">
                                    <input type="checkbox" name="editRoles" value="${role.id}" ${user.roles.includes(role.id) ? 'checked' : ''} style="display: none;">
                                    <div style="font-size: 16px; text-align: center;">${role.icon}</div>
                                    <div style="font-size: 12px; font-weight: 600; text-align: center;">${role.name}</div>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="grid grid-2" style="gap: 16px; margin-top: 16px;">
                        <div class="form-group">
                            <label class="form-label">Shell</label>
                            <select class="form-select" id="editShell">
                                <option value="/bin/bash" ${user.shell === '/bin/bash' ? 'selected' : ''}>Bash</option>
                                <option value="/bin/zsh" ${user.shell === '/bin/zsh' ? 'selected' : ''}>Zsh</option>
                                <option value="/usr/sbin/nologin" ${user.shell === '/usr/sbin/nologin' ? 'selected' : ''}>禁止登录</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">账户状态</label>
                            <select class="form-select" id="editStatus">
                                <option value="active" ${user.status === 'active' ? 'selected' : ''}>✅ 活跃</option>
                                <option value="locked" ${user.locked ? 'selected' : ''}>🔒 锁定</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="usersModule.saveUserEdit('${username}')">保存修改</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveUserEdit(username) {
        const user = this.users.find(u => u.username === username);
        if (!user) return;

        user.displayName = document.getElementById('editDisplayName').value;
        user.email = document.getElementById('editEmail').value;
        user.roles = Array.from(document.querySelectorAll('input[name="editRoles"]:checked')).map(cb => cb.value);
        user.shell = document.getElementById('editShell').value;
        
        const newStatus = document.getElementById('editStatus').value;
        if (newStatus === 'locked') {
            user.locked = true;
            user.status = 'locked';
        } else {
            user.locked = false;
            user.status = 'active';
        }

        document.querySelector('.modal-overlay').remove();
        this.renderUsers();
        this.updateStats();
        this.renderRoleDistribution();

        this.addAuditLog('edit_user', `修改用户: ${username}`, 'info');
        Utils.showToast(`用户 "${username}" 信息已更新`, 'success');
    }

    lockUser(username) {
        if (confirm(`确定要锁定用户 "${username}" 吗？\n\n锁定后该用户将无法登录系统。`)) {
            const user = this.users.find(u => u.username === username);
            if (user) {
                user.locked = true;
                user.status = 'locked';
                this.renderUsers();
                this.updateStats();
                
                this.addAuditLog('lock_user', `锁定用户账户: ${username}`, 'warning');
                Utils.showToast(`用户 "${username}" 已被锁定`, 'warning');

                eventBus.emit('notification:alert', {
                    type: 'user_action',
                    severity: 'warning',
                    title: '🔒 用户账户已锁定',
                    message: `用户 ${username} 的账户已被管理员锁定`,
                    source: 'User Management',
                    metadata: { operator: 'admin', targetUser: username, action: 'lock' }
                });
            }
        }
    }

    unlockUser(username) {
        const user = this.users.find(u => u.username === username);
        if (user) {
            user.locked = false;
            user.status = 'active';
            user.failedLoginAttempts = 0;
            this.renderUsers();
            this.updateStats();
            
            this.addAuditLog('unlock_user', `解锁用户账户: ${username}`, 'info');
            Utils.showToast(`用户 "${username}" 已解锁`, 'success');
        }
    }

    deleteUser(username) {
        if (confirm(`⚠️ 确定要删除用户 "${username}" 吗？\n\n此操作将永久删除该用户及其所有配置！`)) {
            this.users = this.users.filter(u => u.username !== username);
            this.renderUsers();
            this.updateStats();
            this.renderRoleDistribution();
            
            this.addAuditLog('delete_user', `删除用户: ${username}`, 'critical');
            Utils.showToast(`用户 "${username}" 已被删除`, 'danger');
        }
    }

    searchUsers(term) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            if (!term.trim()) {
                this.renderUsers();
                return;
            }

            const filtered = this.users.filter(user =>
                user.username.toLowerCase().includes(term.toLowerCase()) ||
                user.displayName.toLowerCase().includes(term.toLowerCase()) ||
                user.email.toLowerCase().includes(term.toLowerCase()) ||
                user.roles.some(roleId => {
                    const role = this.roles.find(r => r.id === roleId);
                    return role && role.name.toLowerCase().includes(term.toLowerCase());
                })
            );
            this.renderUsers(filtered);
        }, 300);
    }

    filterByRole(roleId) {
        if (!roleId) {
            this.renderUsers();
            return;
        }
        const filtered = this.users.filter(u => u.roles.includes(roleId));
        this.renderUsers(filtered);
    }

    filterByRoleDirect(roleId) {
        this.filterByRole(roleId);
        const select = document.querySelector('select[onchange*="filterByRole"]');
        if (select) select.value = roleId;
    }

    filterByStatus(status) {
        if (!status) {
            this.renderUsers();
            return;
        }
        const filtered = this.users.filter(u => u.status === status);
        this.renderUsers(filtered);
    }

    batchLockUsers() {
        const checkboxes = document.querySelectorAll('#usersTableBody input[type="checkbox"]:checked');
        if (checkboxes.length === 0) {
            Utils.showToast('请先选择要锁定的用户', 'warning');
            return;
        }

        const usernames = Array.from(checkboxes).map(cb => cb.dataset.user);
        
        if (confirm(`确定要锁定选中的 ${usernames.length} 个用户吗？`)) {
            usernames.forEach(uname => {
                const user = this.users.find(u => u.username === uname);
                if (user) {
                    user.locked = true;
                    user.status = 'locked';
                }
            });

            this.renderUsers();
            this.updateStats();
            this.addAuditLog('batch_lock', `批量锁定 ${usernames.length} 个用户: ${usernames.join(', ')}`, 'warning');
            Utils.showToast(`已批量锁定 ${usernames.length} 个用户`, 'warning');
        }
    }

    exportUserList() {
        const exportData = {
            exportTime: new Date().toISOString(),
            totalUsers: this.users.length,
            users: this.users.map(u => ({
                username: u.username,
                displayName: u.displayName,
                email: u.email,
                roles: u.roles,
                groups: u.groups,
                status: u.status,
                mfaEnabled: u.mfaEnabled,
                lastLogin: u.lastLogin
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-list-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.addAuditLog('export_users', '导出用户列表', 'info');
        Utils.showToast('用户列表已导出', 'success');
    }

    resetUserPassword(username) {
        if (confirm(`确定要重置用户 "${username}" 的密码吗？\n\n重置后用户需要设置新密码才能登录。`)) {
            this.addAuditLog('reset_password', `重置用户密码: ${username}`, 'warning');
            Utils.showToast(`"${username}" 的密码已被重置，下次登录时需设置新密码`, 'warning');
        }
    }

    forceLogout(username) {
        if (confirm(`确定要强制登出用户 "${username}" 吗？\n\n该用户的所有活跃会话将被终止。`)) {
            this.addAuditLog('force_logout', `强制用户登出: ${username}`, 'warning');
            Utils.showToast(`用户 "${username}" 已被强制登出`, 'warning');
        }
    }

    showPermissionMatrixModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 1200px;">
                <div class="modal-header">
                    <h3 class="modal-title">📋 RBAC权限矩阵</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="overflow-x: auto;">
                        <table class="data-table" style="min-width: 900px;">
                            <thead>
                                <tr>
                                    <th style="position: sticky; left: 0; background: var(--bg-card); z-index: 1;">权限 \\ 角色</th>
                                    ${this.roles.map(role => `<th style="text-align: center; min-width: 100px;">${role.icon}<br><strong>${role.name}</strong></th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${this.permissions.map(perm => `
                                    <tr>
                                        <td style="position: sticky; left: 0; background: var(--bg-card); z-index: 1; font-weight: 600; font-size: 12px;">${perm.name}<br><small style="color: var(--text-muted);">${perm.category}</small></td>
                                        ${this.roles.map(role => {
                                            const hasPerm = role.permissions[0] === 'all' || role.permissions.includes(perm.id);
                                            return `<td style="text-align: center; background: ${hasPerm ? role.color + '15' : 'transparent'};">
                                                <span class="status-badge ${hasPerm ? 'success' : 'default'}" style="font-size: 9px;">
                                                    ${hasPerm ? '✓' : '-'}
                                                </span>
                                            </td>`;
                                        }).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                    
                    <div style="margin-top: 20px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md); font-size: 13px;">
                        <strong>💡 说明：</strong>
                        <ul style="margin: 8px 0 0 20px; line-height: 1.6; color: var(--text-secondary);">
                            <li>✓ 表示该角色拥有对应权限</li>
                            <li>- 表示该角色无此权限</li>
                            <li>超级管理员(super_admin)自动拥有所有权限</li>
                            <li>权限支持继承：高级角色自动包含低级角色的权限</li>
                        </ul>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                    <button class="btn btn-primary" onclick="usersModule.exportPermissionMatrix()">📥 导出矩阵</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    exportPermissionMatrix() {
        const matrixData = {
            exportedAt: new Date().toISOString(),
            roles: this.roles,
            permissions: this.permissions,
            matrix: this.roles.map(role => ({
                roleName: role.name,
                permissions: this.permissions.map(p => ({
                    permission: p.name,
                    granted: role.permissions[0] === 'all' || role.permissions.includes(p.id)
                }))
            }))
        };

        const blob = new Blob([JSON.stringify(matrixData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rbac-permission-matrix-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        Utils.showToast('权限矩阵已导出', 'success');
    }

    showAuditLogModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">📜 操作审计日志</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="display: flex; gap: 12px; margin-bottom: 16px;">
                        <input type="text" class="form-input" placeholder="搜索操作..." oninput="usersModule.searchAuditLogs(this.value)" style="flex: 1;">
                        <select class="form-select" style="width: auto;" onchange="usersModule.filterAuditLogs(this.value)">
                            <option value="">所有级别</option>
                            <option value="info">ℹ️ 信息</option>
                            <option value="warning">⚠️ 警告</option>
                            <option value="critical">🔴 严重</option>
                        </select>
                        <button class="btn btn-outline" onclick="usersModule.exportAuditLogs()">📥 导出</button>
                    </div>

                    <div id="auditLogContainer" style="max-height: 450px; overflow-y: auto;"></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        this.renderAuditLogs();
    }

    loadAuditLogs() {
        this.auditLogs = [
            { timestamp: '2026-05-01 14:35:22', action: 'create_user', details: '创建用户: testuser', level: 'info', operator: 'admin', ip: '192.168.1.100' },
            { timestamp: '2026-05-01 14:32:18', action: 'edit_user', details: '修改用户: developer (角色变更)', level: 'warning', operator: 'admin', ip: '192.168.1.100' },
            { timestamp: '2026-05-01 14:28:45', action: 'lock_user', details: '锁定用户: testuser (连续失败8次)', level: 'warning', operator: 'system', ip: '127.0.0.1' },
            { timestamp: '2026-05-01 14:25:33', action: 'reset_password', details: '重置密码: backup (管理员操作)', level: 'critical', operator: 'admin', ip: '192.168.1.100' },
            { timestamp: '2026-05-01 14:20:11', action: 'delete_user', details: '删除用户: olduser (清理废弃账户)', level: 'critical', operator: 'admin', ip: '192.168.1.100' },
            { timestamp: '2026-05-01 14:15:55', action: 'batch_lock', details: '批量锁定3个用户 (安全审计)', level: 'warning', operator: 'secadmin', ip: '10.0.0.55' },
            { timestamp: '2026-05-01 14:10:22', action: 'force_logout', details: '强制登出: developer (异常行为)', level: 'warning', operator: 'admin', ip: '192.168.1.100' },
            { timestamp: '2026-05-01 14:05:48', action: 'export_users', details: '导出用户列表 (合规检查)', level: 'info', operator: 'auditor', ip: '10.0.0.60' },
            { timestamp: '2026-04-30 23:45:00', action: 'view_user_profile', details: '查看用户: admin (常规检查)', level: 'info', operator: 'auditor', ip: '10.0.0.60' },
            { timestamp: '2026-04-30 23:40:15', action: 'unlock_user', details: '解锁用户: testuser (误操作恢复)', level: 'info', operator: 'admin', ip: '192.168.1.100' }
        ];
    }

    renderAuditLogs(filteredLogs = null) {
        const logs = filteredLogs || this.auditLogs;
        const container = document.getElementById('auditLogContainer');
        if (!container) return;

        container.innerHTML = logs.reverse().map(log => `
            <div style="
                padding: 12px;
                border-bottom: 1px solid var(--border-light);
                border-left: 3px solid ${log.level === 'critical' ? '#ef4444' : log.level === 'warning' ? '#f59e0b' : '#10b981'};
                font-size: 13px;
            ">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                    <span style="font-weight: 600;">${log.action.replace(/_/g, ' ').toUpperCase()}</span>
                    <span class="status-badge ${log.level === 'critical' ? 'danger' : log.level === 'warning' ? 'warning' : 'success'}" style="font-size: 10px;">
                        ${log.level.toUpperCase()}
                    </span>
                </div>
                <div style="color: var(--text-secondary); margin-bottom: 4px;">${log.details}</div>
                <div style="font-size: 11px; color: var(--text-muted);">
                    👤 ${log.operator} · 📍 ${log.ip} · 🕐 ${log.timestamp}
                </div>
            </div>
        `).join('');

        if (logs.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 32px; color: var(--text-muted);">暂无匹配的审计记录</div>';
        }
    }

    searchAuditLogs(term) {
        if (!term.trim()) {
            this.renderAuditLogs();
            return;
        }
        const filtered = this.auditLogs.filter(log =>
            log.action.toLowerCase().includes(term.toLowerCase()) ||
            log.details.toLowerCase().includes(term.toLowerCase()) ||
            log.operator.toLowerCase().includes(term.toLowerCase())
        );
        this.renderAuditLogs(filtered);
    }

    filterAuditLogs(level) {
        if (!level) {
            this.renderAuditLogs();
            return;
        }
        const filtered = this.auditLogs.filter(log => log.level === level);
        this.renderAuditLogs(filtered);
    }

    exportAuditLogs() {
        const blob = new Blob([JSON.stringify(this.auditLogs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('审计日志已导出', 'success');
    }

    addAuditLog(action, details, level = 'info') {
        this.auditLogs.unshift({
            timestamp: new Date().toLocaleString(),
            action: action,
            details: details,
            level: level,
            operator: 'current_user',
            ip: '192.168.1.100'
        });

        if (this.auditLogs.length > 1000) {
            this.auditLogs = this.auditLogs.slice(0, 1000);
        }
    }

    showRoleManager() {
        Utils.showToast('角色管理器功能开发中...', 'info');
    }

    showGroupManager() {
        Utils.showToast('组管理器功能开发中...', 'info');
    }

    refreshPermissionGraph() {
        this.renderPermissionGraph();
        Utils.showToast('权限关系图已刷新', 'info');
    }

    destroy() {
        eventBus.off('users:refresh');
    }
}

let usersModule;
