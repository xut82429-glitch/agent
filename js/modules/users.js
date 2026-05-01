class UsersModule {
    constructor() {
        this.users = [];
        this.init();
    }

    init() {
        this.render();
        this.loadUsers();
        eventBus.on('users:refresh', () => this.loadUsers());
    }

    render() {
        const container = document.getElementById('page-users');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>👥 用户权限管理</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="usersModule.showAddUserModal()">➕ 添加用户</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('users:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalUsers">0</div>
                    <div class="stat-label">总用户数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="activeUsers">0</div>
                    <div class="stat-label">活跃用户</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="sudoUsers">0</div>
                    <div class="stat-label">Sudo用户</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="lockedUsers">0</div>
                    <div class="stat-label">锁定用户</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="usersModule.switchTab('all', this)">全部用户</button>
                <button class="tab" onclick="usersModule.switchTab('sudo', this)">Sudo用户</button>
                <button class="tab" onclick="usersModule.switchTab('system', this)">系统用户</button>
                <button class="tab" onclick="usersModule.switchTab('locked', this)">已锁定</button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">👤 用户列表</h3>
                    <div class="search-box">
                        <input type="text" placeholder="搜索用户..." oninput="usersModule.searchUsers(this.value)">
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>用户名</th>
                                <th>UID</th>
                                <th>组</th>
                                <th>Shell</th>
                                <th>最后登录</th>
                                <th>Sudo权限</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    loadUsers() {
        this.users = [
            { username: 'root', uid: 0, group: 'root', shell: '/bin/bash', lastLogin: '2026-05-01 14:30', sudo: true, locked: false, system: true },
            { username: 'admin', uid: 1000, group: 'admin', shell: '/bin/bash', lastLogin: '2026-05-01 14:25', sudo: true, locked: false, system: false },
            { username: 'www-data', uid: 33, group: 'www-data', shell: '/usr/sbin/nologin', lastLogin: '-', sudo: false, locked: false, system: true },
            { username: 'mysql', uid: 107, group: 'mysql', shell: '/usr/sbin/nologin', lastLogin: '-', sudo: false, locked: false, system: true },
            { username: 'developer', uid: 1001, group: 'developer', shell: '/bin/zsh', lastLogin: '2026-04-30 18:45', sudo: true, locked: false, system: false },
            { username: 'backup', uid: 1002, group: 'backup', shell: '/bin/bash', lastLogin: '2026-05-01 03:00', sudo: false, locked: false, system: false },
            { username: 'testuser', uid: 1003, group: 'testuser', shell: '/bin/bash', lastLogin: '2026-04-15 09:20', sudo: false, locked: true, system: false },
            { username: 'postgres', uid: 110, group: 'postgres', shell: '/bin/bash', lastLogin: '-', sudo: false, locked: false, system: true }
        ];

        this.renderUsers(this.users);
        this.updateStats();
    }

    renderUsers(users) {
        const tbody = document.getElementById('usersTableBody');
        if (!tbody) return;

        tbody.innerHTML = users.map(user => `
            <tr>
                <td><strong>${user.username}</strong></td>
                <td>${user.uid}</td>
                <td>${user.group}</td>
                <td><code style="background: var(--bg-dark); padding: 2px 6px; border-radius: 4px;">${user.shell}</code></td>
                <td>${user.lastLogin}</td>
                <td>
                    <span class="status-badge ${user.sudo ? 'warning' : 'info'}">${user.sudo ? '✓ 有权限' : '✗ 无权限'}</span>
                </td>
                <td>
                    <span class="status-badge ${user.locked ? 'danger' : user.system ? 'info' : 'success'}">
                        ${user.locked ? '🔒 已锁定' : user.system ? '⚙️ 系统' : '✅ 正常'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="usersModule.editUser('${user.username}')">编辑</button>
                    ${!user.locked ? `<button class="btn btn-sm btn-warning" onclick="usersModule.lockUser('${user.username}')">锁定</button>` : `<button class="btn btn-sm btn-success" onclick="usersModule.unlockUser('${user.username}')">解锁</button>`}
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        document.getElementById('totalUsers').textContent = this.users.length;
        document.getElementById('activeUsers').textContent = this.users.filter(u => u.lastLogin !== '-').length;
        document.getElementById('sudoUsers').textContent = this.users.filter(u => u.sudo).length;
        document.getElementById('lockedUsers').textContent = this.users.filter(u => u.locked).length;
    }

    switchTab(tab, element) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        element.classList.add('active');

        let filteredUsers;
        switch(tab) {
            case 'sudo':
                filteredUsers = this.users.filter(u => u.sudo);
                break;
            case 'system':
                filteredUsers = this.users.filter(u => u.system);
                break;
            case 'locked':
                filteredUsers = this.users.filter(u => u.locked);
                break;
            default:
                filteredUsers = this.users;
        }
        this.renderUsers(filteredUsers);
    }

    searchUsers(term) {
        if (!term) {
            this.renderUsers(this.users);
            return;
        }
        const filtered = this.users.filter(u =>
            u.username.toLowerCase().includes(term.toLowerCase()) ||
            u.group.toLowerCase().includes(term.toLowerCase())
        );
        this.renderUsers(filtered);
    }

    lockUser(username) {
        if (confirm(`确定要锁定用户 ${username} 吗？`)) {
            const user = this.users.find(u => u.username === username);
            if (user) {
                user.locked = true;
                this.renderUsers(this.users);
                this.updateStats();
                Utils.showToast(`用户 ${username} 已锁定`, 'success');
            }
        }
    }

    unlockUser(username) {
        const user = this.users.find(u => u.username === username);
        if (user) {
            user.locked = false;
            this.renderUsers(this.users);
            this.updateStats();
            Utils.showToast(`用户 ${username} 已解锁`, 'success');
        }
    }

    editUser(username) {
        Utils.showToast(`编辑用户: ${username}`, 'info');
    }

    showAddUserModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">➕ 添加新用户</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">用户名 *</label>
                        <input type="text" class="form-input" id="newUsername" placeholder="输入用户名">
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label class="form-label">密码 *</label>
                            <input type="password" class="form-input" id="newPassword" placeholder="输入密码">
                        </div>
                        <div class="form-group">
                            <label class="form-label">确认密码 *</label>
                            <input type="password" class="form-input" id="confirmPassword" placeholder="再次输入密码">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label">主组</label>
                        <input type="text" class="form-input" id="newGroup" placeholder="默认与用户名相同">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Shell</label>
                        <select class="form-select" id="newShell">
                            <option value="/bin/bash">/bin/bash</option>
                            <option value="/bin/zsh">/bin/zsh</option>
                            <option value="/usr/sbin/nologin">/usr/sbin/nologin (禁止登录)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="newSudo" style="width: 18px; height: 18px;">
                            <span>授予 Sudo 权限</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="usersModule.addUser()">创建用户</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    addUser() {
        const username = document.getElementById('newUsername').value;
        const password = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!username || !password) {
            Utils.showToast('请填写必填字段', 'error');
            return;
        }

        if (password !== confirmPassword) {
            Utils.showToast('两次密码不一致', 'error');
            return;
        }

        const newUser = {
            username: username,
            uid: 1000 + this.users.length,
            group: document.getElementById('newGroup').value || username,
            shell: document.getElementById('newShell').value,
            lastLogin: '-',
            sudo: document.getElementById('newSudo').checked,
            locked: false,
            system: false
        };

        this.users.push(newUser);
        document.querySelector('.modal-overlay').remove();
        this.renderUsers(this.users);
        this.updateStats();
        Utils.showToast(`用户 ${username} 创建成功！`, 'success');
    }

    destroy() {
        eventBus.off('users:refresh');
    }
}

let usersModule;
