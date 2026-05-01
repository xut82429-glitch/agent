class FirewallModule {
    constructor() {
        this.rules = [];
        this.selectedRules = new Set();
        this.templates = this.initTemplates();
        this.init();
    }

    init() {
        this.render();
        this.loadRules();
        eventBus.on('firewall:refresh', () => this.loadRules());
    }

    initTemplates() {
        return [
            {
                id: 'web-server',
                name: '🌐 Web服务器模板',
                description: '适用于Apache/Nginx等Web服务器',
                icon: '🌐',
                rules: [
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '80', action: 'ACCEPT', enabled: true, description: '允许HTTP访问' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '443', action: 'ACCEPT', enabled: true, description: '允许HTTPS访问' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '8080', action: 'DROP', enabled: true, description: '禁止备用HTTP端口' }
                ]
            },
            {
                id: 'database-server',
                name: '🗄️ 数据库服务器模板',
                description: '适用于MySQL/PostgreSQL/MongoDB',
                icon: '🗄️',
                rules: [
                    { protocol: 'TCP', source: '192.168.1.0/24', port: '3306', action: 'ACCEPT', enabled: true, description: '允许内网MySQL' },
                    { protocol: 'TCP', source: '127.0.0.1', port: '3306', action: 'ACCEPT', enabled: true, description: '允许本地MySQL' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '3306', action: 'DROP', enabled: true, description: '禁止外部MySQL' },
                    { protocol: 'TCP', source: '192.168.1.0/24', port: '5432', action: 'ACCEPT', enabled: true, description: '允许内网PostgreSQL' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '27017', action: 'DROP', enabled: true, description: '禁止外部MongoDB' }
                ]
            },
            {
                id: 'secure-ssh',
                name: '🔐 安全SSH访问模板',
                description: '限制SSH访问仅限特定IP段',
                icon: '🔐',
                rules: [
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '22', action: 'DROP', enabled: true, description: '默认禁止所有SSH' },
                    { protocol: 'TCP', source: '192.168.1.0/24', port: '22', action: 'ACCEPT', enabled: true, description: '允许内网SSH' },
                    { protocol: 'TCP', source: '10.0.0.0/8', port: '22', action: 'ACCEPT', enabled: true, description: '允许办公网SSH' }
                ]
            },
            {
                id: 'dns-server',
                name: '📡 DNS服务器模板',
                description: '适用于BIND/PowerDNS等DNS服务',
                icon: '📡',
                rules: [
                    { protocol: 'UDP', source: '0.0.0.0/0', port: '53', action: 'ACCEPT', enabled: true, description: '允许UDP DNS查询' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '53', action: 'ACCEPT', enabled: true, description: '允许TCP DNS区域传输' },
                    { protocol: 'TCP', source: '192.168.1.0/24', port: '953', action: 'ACCEPT', enabled: true, description: '允许内网RNDC管理' }
                ]
            },
            {
                id: 'mail-server',
                name: '📧 邮件服务器模板',
                description: '适用于Postfix/Sendmail邮件系统',
                icon: '📧',
                rules: [
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '25', action: 'ACCEPT', enabled: true, description: '允许SMTP' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '587', action: 'ACCEPT', enabled: true, description: '允许SMTPS提交' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '465', action: 'ACCEPT', enabled: true, description: '允许SMTPS' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '110', action: 'ACCEPT', enabled: true, description: '允许POP3' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '995', action: 'ACCEPT', enabled: true, description: '允许POP3S' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '143', action: 'ACCEPT', enabled: true, description: '允许IMAP' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '993', action: 'ACCEPT', enabled: true, description: '允许IMAPS' }
                ]
            },
            {
                id: 'high-security',
                name: '🛡️ 高安全级别模板',
                description: '最小权限原则，仅开放必要端口',
                icon: '🛡️',
                rules: [
                    { protocol: 'TCP', source: '192.168.1.100', port: '22', action: 'ACCEPT', enabled: true, description: '仅允许管理IP SSH' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '80', action: 'ACCEPT', enabled: true, description: '允许HTTP' },
                    { protocol: 'TCP', source: '0.0.0.0/0', port: '443', action: 'ACCEPT', enabled: true, description: '允许HTTPS' },
                    { protocol: 'ICMP', source: '0.0.0.0/0', port: '-', action: 'DROP', enabled: true, description: '禁止Ping' },
                    { protocol: 'ALL', source: '0.0.0.0/0', port: '-', action: 'DROP', enabled: true, description: '拒绝其他所有流量' }
                ]
            }
        ];
    }

    render() {
        const container = document.getElementById('page-firewall');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>🔥 防火墙管理</h2>
                <div class="header-actions">
                    <button class="btn btn-outline" onclick="firewallModule.showTemplatesModal()">📋 规则模板</button>
                    <button class="btn btn-outline" onclick="firewallModule.showImportModal()">📥 导入</button>
                    <button class="btn btn-outline" onclick="firewallModule.exportRules()">📤 导出</button>
                    <button class="btn btn-primary" onclick="firewallModule.showAddRuleModal()">➕ 添加规则</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('firewall:refresh')">🔄 刷新</button>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-5" style="margin-bottom: 24px;">
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px;" id="totalRules">0</div>
                    <div class="stat-label">总规则数</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="activeRules">0</div>
                    <div class="stat-label">启用规则</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="blockedConnections">0</div>
                    <div class="stat-label">已阻止连接</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="todayAttacks">0</div>
                    <div class="stat-label">今日攻击数</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="selectedCount">0</div>
                    <div class="stat-label">已选择</div>
                </div>
            </div>

            <!-- 批量操作栏 -->
            <div class="batch-actions-bar" id="batchActionsBar" style="display: none;">
                <span>已选择 <strong id="selectedCountBadge">0</strong> 条规则</span>
                <div class="batch-buttons">
                    <button class="btn btn-sm btn-success" onclick="firewallModule.batchEnable()">
                        ✓ 批量启用
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="firewallModule.batchDisable()">
                        ✗ 批量禁用
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="firewallModule.batchDelete()">
                        🗑️ 批量删除
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="firewallModule.clearSelection()">
                        取消选择
                    </button>
                </div>
            </div>

            <!-- 主内容区 -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📋 防火墙规则列表</h3>
                    <div class="filter-bar" style="margin: 0; display: flex; gap: 12px; align-items: center;">
                        <input type="text" placeholder="搜索规则..." class="form-input" style="max-width: 250px;" oninput="firewallModule.filterRules(this.value)">
                        <select class="form-select" style="width: auto;" onchange="firewallModule.filterByAction(this.value)">
                            <option value="">所有动作</option>
                            <option value="ACCEPT">允许</option>
                            <option value="DROP">丢弃</option>
                            <option value="REJECT">拒绝</option>
                        </select>
                        <select class="form-select" style="width: auto;" onchange="firewallModule.filterByProtocol(this.value)">
                            <option value="">所有协议</option>
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                            <option value="ICMP">ICMP</option>
                            <option value="ALL">ALL</option>
                        </select>
                        <label class="checkbox-label" style="margin: 0;">
                            <input type="checkbox" onchange="firewallModule.toggleSelectAll(this.checked)">
                            全选
                        </label>
                    </div>
                </div>
                
                <!-- 规则表格 -->
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th width="40"><input type="checkbox" onchange="firewallModule.toggleSelectAll(this.checked)"></th>
                                <th>序号</th>
                                <th>协议</th>
                                <th>源地址</th>
                                <th>目标端口</th>
                                <th>动作</th>
                                <th>状态</th>
                                <th>描述</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="rulesTableBody">
                        </tbody>
                    </table>
                </div>

                <!-- 分页信息 -->
                <div class="table-footer" style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <span id="rulePaginationInfo">显示 0 条规则，共 0 条</span>
                    <div class="pagination-controls">
                        <button class="btn btn-sm btn-outline" disabled>上一页</button>
                        <span style="padding: 0 12px;">第 1 页</span>
                        <button class="btn btn-sm btn-outline" disabled>下一页</button>
                    </div>
                </div>
            </div>

            <!-- 快速操作面板 -->
            <div class="grid grid-3" style="margin-top: 24px;">
                <div class="card hover-lift">
                    <div class="card-body" style="text-align: center; padding: 32px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">⚡</div>
                        <h4 style="margin-bottom: 8px;">快速封锁IP</h4>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">立即阻止恶意IP地址</p>
                        <input type="text" class="form-input" id="quickBlockIp" placeholder="输入IP地址" style="margin-bottom: 12px;">
                        <button class="btn btn-danger" onclick="firewallModule.quickBlockIP()" style="width: 100%;">
                            🚫 立即封锁
                        </button>
                    </div>
                </div>
                <div class="card hover-lift">
                    <div class="card-body" style="text-align: center; padding: 32px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">🔄</div>
                        <h4 style="margin-bottom: 8px;">重置防火墙</h4>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">清空所有自定义规则</p>
                        <button class="btn btn-warning" onclick="firewallModule.resetFirewall()" style="width: 100%;">
                            ⚠️ 重置规则
                        </button>
                    </div>
                </div>
                <div class="card hover-lift">
                    <div class="card-body" style="text-align: center; padding: 32px;">
                        <div style="font-size: 48px; margin-bottom: 16px;">💾</div>
                        <h4 style="margin-bottom: 8px;">备份配置</h4>
                        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: 16px;">导出完整防火墙配置</p>
                        <button class="btn btn-primary" onclick="firewallModule.exportFullConfig()" style="width: 100%;">
                            📦 备份配置
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    loadRules() {
        this.rules = [
            { id: 1, protocol: 'TCP', source: '0.0.0.0/0', port: '22', action: 'DROP', enabled: true, description: '禁止外部SSH访问', priority: 100 },
            { id: 2, protocol: 'TCP', source: '192.168.1.0/24', port: '22', action: 'ACCEPT', enabled: true, description: '允许内网SSH访问', priority: 90 },
            { id: 3, protocol: 'TCP', source: '0.0.0.0/0', port: '80', action: 'ACCEPT', enabled: true, description: '允许HTTP访问', priority: 80 },
            { id: 4, protocol: 'TCP', source: '0.0.0.0/0', port: '443', action: 'ACCEPT', enabled: true, description: '允许HTTPS访问', priority: 80 },
            { id: 5, protocol: 'ICMP', source: '0.0.0.0/0', port: '-', action: 'DROP', enabled: false, description: '禁止ICMP ping', priority: 70 },
            { id: 6, protocol: 'TCP', source: '10.0.0.0/8', port: '3306', action: 'ACCEPT', enabled: true, description: '允许内网MySQL访问', priority: 60 },
            { id: 7, protocol: 'UDP', source: '0.0.0.0/0', port: '53', action: 'ACCEPT', enabled: true, description: '允许DNS查询', priority: 50 },
            { id: 8, protocol: 'TCP', source: '0.0.0.0/0', port: '8080', action: 'REJECT', enabled: true, description: '拒绝备用HTTP端口', priority: 40 },
            { id: 9, protocol: 'TCP', source: '203.0.113.50', port: '22', action: 'DROP', enabled: true, description: '封禁恶意IP', priority: 110 },
            { id: 10, protocol: 'TCP', source: '198.51.100.23', port: '443', action: 'DROP', enabled: true, description: '封禁扫描器IP', priority: 105 }
        ];

        this.renderRules();
        this.updateStats();
    }

    renderRules(filteredRules = null) {
        const rules = filteredRules || this.rules;
        const tbody = document.getElementById('rulesTableBody');
        if (!tbody) return;

        if (rules.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 48px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                        <div>暂无防火墙规则</div>
                        <div style="font-size: 14px; margin-top: 8px;">点击"添加规则"或使用"规则模板"快速创建</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = rules.map((rule, index) => `
            <tr class="${this.selectedRules.has(rule.id) ? 'selected-row' : ''}" data-id="${rule.id}">
                <td>
                    <input type="checkbox" 
                           ${this.selectedRules.has(rule.id) ? 'checked' : ''} 
                           onclick="event.stopPropagation(); firewallModule.toggleRuleSelection(${rule.id})">
                </td>
                <td>${index + 1}</td>
                <td><span class="status-badge info">${rule.protocol}</span></td>
                <td><code>${rule.source}</code></td>
                <td><strong>${rule.port}</strong></td>
                <td>
                    <span class="status-badge ${rule.action === 'ACCEPT' ? 'success' : rule.action === 'DROP' ? 'danger' : 'warning'}">
                        ${rule.action}
                    </span>
                </td>
                <td>
                    <label class="toggle-switch" onclick="event.stopPropagation()">
                        <input type="checkbox" ${rule.enabled ? 'checked' : ''} onchange="firewallModule.toggleRule(${rule.id})">
                        <span class="toggle-slider"></span>
                    </label>
                </td>
                <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${rule.description}">
                    ${rule.description || '-'}
                </td>
                <td>
                    <div class="btn-group">
                        <button class="btn btn-sm btn-outline" onclick="firewallModule.editRule(${rule.id})" title="编辑">✏️</button>
                        <button class="btn btn-sm btn-${rule.enabled ? 'warning' : 'success'}" onclick="firewallModule.toggleRule(${rule.id})" title="${rule.enabled ? '禁用' : '启用'}">
                            ${rule.enabled ? '⏸️' : '▶️'}
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="firewallModule.deleteRule(${rule.id})" title="删除">🗑️</button>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('rulePaginationInfo').textContent = `显示 ${rules.length} 条规则，共 ${this.rules.length} 条`;
    }

    updateStats() {
        const total = this.rules.length;
        const active = this.rules.filter(r => r.enabled).length;
        const selected = this.selectedRules.size;

        document.getElementById('totalRules').textContent = total;
        document.getElementById('activeRules').textContent = active;
        document.getElementById('blockedConnections').textContent = Utils.randomInRange(150, 300);
        document.getElementById('todayAttacks').textContent = Utils.randomInRange(50, 120);
        document.getElementById('selectedCount').textContent = selected;

        const batchBar = document.getElementById('batchActionsBar');
        if (batchBar) {
            batchBar.style.display = selected > 0 ? 'flex' : 'none';
            document.getElementById('selectedCountBadge').textContent = selected;
        }
    }

    toggleRuleSelection(id) {
        if (this.selectedRules.has(id)) {
            this.selectedRules.delete(id);
        } else {
            this.selectedRules.add(id);
        }
        this.renderRules();
        this.updateStats();
    }

    toggleSelectAll(checked) {
        if (checked) {
            this.rules.forEach(rule => this.selectedRules.add(rule.id));
        } else {
            this.selectedRules.clear();
        }
        this.renderRules();
        this.updateStats();
    }

    clearSelection() {
        this.selectedRules.clear();
        this.renderRules();
        this.updateStats();
    }

    batchEnable() {
        if (this.selectedRules.size === 0) return;

        this.rules.forEach(rule => {
            if (this.selectedRules.has(rule.id)) {
                rule.enabled = true;
            }
        });

        Utils.showToast(`已成功启用 ${this.selectedRules.size} 条规则`, 'success');
        this.clearSelection();
    }

    batchDisable() {
        if (this.selectedRules.size === 0) return;

        this.rules.forEach(rule => {
            if (this.selectedRules.has(rule.id)) {
                rule.enabled = false;
            }
        });

        Utils.showToast(`已成功禁用 ${this.selectedRules.size} 条规则`, 'warning');
        this.clearSelection();
    }

    batchDelete() {
        if (this.selectedRules.size === 0) return;

        if (confirm(`确定要删除选中的 ${this.selectedRules.size} 条规则吗？此操作不可恢复！`)) {
            this.rules = this.rules.filter(rule => !this.selectedRules.has(rule.id));
            Utils.showToast(`已成功删除 ${this.selectedRules.size} 条规则`, 'success');
            this.clearSelection();
        }
    }

    filterRules(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderRules();
            return;
        }

        const filtered = this.rules.filter(rule =>
            rule.source.includes(searchTerm) ||
            rule.port.toString().includes(searchTerm) ||
            rule.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rule.protocol.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderRules(filtered);
    }

    filterByAction(action) {
        if (!action) {
            this.renderRules();
            return;
        }
        const filtered = this.rules.filter(rule => rule.action === action);
        this.renderRules(filtered);
    }

    filterByProtocol(protocol) {
        if (!protocol) {
            this.renderRules();
            return;
        }
        const filtered = this.rules.filter(rule => rule.protocol === protocol);
        this.renderRules(filtered);
    }

    toggleRule(id) {
        const rule = this.rules.find(r => r.id === id);
        if (rule) {
            rule.enabled = !rule.enabled;
            this.renderRules();
            this.updateStats();
            Utils.showToast(`规则已${rule.enabled ? '启用' : '禁用'}`, 'success');
        }
    }

    deleteRule(id) {
        if (confirm('确定要删除这条规则吗？')) {
            this.rules = this.rules.filter(r => r.id !== id);
            this.selectedRules.delete(id);
            this.renderRules();
            this.updateStats();
            Utils.showToast('规则已删除', 'success');
        }
    }

    editRule(id) {
        const rule = this.rules.find(r => r.id === id);
        if (!rule) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">✏️ 编辑防火墙规则</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">协议 *</label>
                        <select class="form-select" id="editRuleProtocol">
                            <option value="TCP" ${rule.protocol === 'TCP' ? 'selected' : ''}>TCP</option>
                            <option value="UDP" ${rule.protocol === 'UDP' ? 'selected' : ''}>UDP</option>
                            <option value="ICMP" ${rule.protocol === 'ICMP' ? 'selected' : ''}>ICMP</option>
                            <option value="ALL" ${rule.protocol === 'ALL' ? 'selected' : ''}>ALL</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">源地址 *</label>
                        <input type="text" class="form-input" id="editRuleSource" value="${rule.source}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">目标端口</label>
                        <input type="text" class="form-input" id="editRulePort" value="${rule.port}">
                    </div>
                    <div class="form-group">
                        <label class="form-label">动作 *</label>
                        <select class="form-select" id="editRuleAction">
                            <option value="ACCEPT" ${rule.action === 'ACCEPT' ? 'selected' : ''}>ACCEPT - 允许</option>
                            <option value="DROP" ${rule.action === 'DROP' ? 'selected' : ''}>DROP - 丢弃</option>
                            <option value="REJECT" ${rule.action === 'REJECT' ? 'selected' : ''}>REJECT - 拒绝</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">优先级 (数字越小优先级越高)</label>
                        <input type="number" class="form-input" id="editRulePriority" value="${rule.priority || 50}" min="1" max="255">
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <textarea class="form-textarea" id="editRuleDescription">${rule.description}</textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="firewallModule.saveEditedRule(${id})">保存修改</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveEditedRule(id) {
        const rule = this.rules.find(r => r.id === id);
        if (!rule) return;

        rule.protocol = document.getElementById('editRuleProtocol').value;
        rule.source = document.getElementById('editRuleSource').value;
        rule.port = document.getElementById('editRulePort').value || '-';
        rule.action = document.getElementById('editRuleAction').value;
        rule.priority = parseInt(document.getElementById('editRulePriority').value) || 50;
        rule.description = document.getElementById('editRuleDescription').value;

        if (!rule.source) {
            Utils.showToast('请填写源地址', 'error');
            return;
        }

        document.querySelector('.modal-overlay').remove();
        this.renderRules();
        this.updateStats();
        Utils.showToast('规则更新成功！', 'success');
    }

    showAddRuleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">➕ 添加防火墙规则</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">协议 *</label>
                        <select class="form-select" id="ruleProtocol">
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                            <option value="ICMP">ICMP</option>
                            <option value="ALL">ALL</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">源地址 *</label>
                        <input type="text" class="form-input" id="ruleSource" placeholder="例如: 0.0.0.0/0 或 192.168.1.0/24">
                        <small style="color: var(--text-secondary);">支持IP地址、CIDR格式</small>
                    </div>
                    <div class="form-group">
                        <label class="form-label">目标端口</label>
                        <input type="text" class="form-input" id="rulePort" placeholder="例如: 22, 80, 443 或 - (所有端口)">
                    </div>
                    <div class="form-group">
                        <label class="form-label">动作 *</label>
                        <select class="form-select" id="ruleAction">
                            <option value="ACCEPT">ACCEPT - 允许</option>
                            <option value="DROP">DROP - 丢弃</option>
                            <option value="REJECT">REJECT - 拒绝</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">优先级 (1-255)</label>
                        <input type="number" class="form-input" id="rulePriority" value="50" min="1" max="255">
                    </div>
                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <textarea class="form-textarea" id="ruleDescription" placeholder="规则描述..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="firewallModule.addRule()">添加规则</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    addRule() {
        const newRule = {
            id: Date.now(),
            protocol: document.getElementById('ruleProtocol').value,
            source: document.getElementById('ruleSource').value,
            port: document.getElementById('rulePort').value || '-',
            action: document.getElementById('ruleAction').value,
            enabled: true,
            description: document.getElementById('ruleDescription').value,
            priority: parseInt(document.getElementById('rulePriority').value) || 50
        };

        if (!newRule.source) {
            Utils.showToast('请填写源地址', 'error');
            return;
        }

        this.rules.push(newRule);
        document.querySelector('.modal-overlay').remove();
        this.renderRules();
        this.updateStats();
        Utils.showToast('规则添加成功！', 'success');
    }

    showTemplatesModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">📋 防火墙规则模板</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p style="color: var(--text-secondary); margin-bottom: 24px;">
                        选择预设的安全模板快速配置防火墙规则。每个模板都经过专业安全审计。
                    </p>
                    <div class="grid grid-2" style="gap: 16px;">
                        ${this.templates.map(template => `
                            <div class="template-card hover-lift" onclick="firewallModule.applyTemplate('${template.id}')">
                                <div class="template-icon">${template.icon}</div>
                                <div class="template-info">
                                    <h4>${template.name}</h4>
                                    <p>${template.description}</p>
                                    <span class="status-badge info">${template.rules.length} 条规则</span>
                                </div>
                                <button class="btn btn-primary btn-sm">应用模板</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    applyTemplate(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        const confirmModal = document.createElement('div');
        confirmModal.className = 'modal-overlay';
        confirmModal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">⚠️ 确认应用模板</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <p>您即将应用模板：<strong>${template.name}</strong></p>
                    <p style="margin-top: 12px;">该模板包含以下 <strong>${template.rules.length}</strong> 条规则：</p>
                    <ul style="margin-top: 12px; max-height: 200px; overflow-y: auto;">
                        ${template.rules.map(rule => `
                            <li style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                <code>${rule.protocol}</code> from <code>${rule.source}</code>:<code>${rule.port}</code> → 
                                <span class="status-badge ${rule.action === 'ACCEPT' ? 'success' : 'danger'}" style="font-size: 12px;">${rule.action}</span>
                                - ${rule.description}
                            </li>
                        `).join('')}
                    </ul>
                    <p style="margin-top: 16px; color: var(--warning);">⚠️ 这些规则将被添加到现有规则列表中。</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="firewallModule.confirmApplyTemplate('${templateId}', this)">确认应用</button>
                </div>
            </div>
        `;
        
        document.querySelector('.modal-overlay').remove();
        document.body.appendChild(confirmModal);
    }

    confirmApplyTemplate(templateId, button) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) return;

        button.disabled = true;
        button.textContent = '应用中...';

        setTimeout(() => {
            template.rules.forEach(rule => {
                this.rules.push({
                    ...rule,
                    id: Date.now() + Math.random()
                });
            });

            document.querySelector('.modal-overlay').remove();
            this.renderRules();
            this.updateStats();
            Utils.showToast(`成功应用"${template.name}"模板，添加了 ${template.rules.length} 条规则`, 'success');
        }, 500);
    }

    showImportModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📥 导入防火墙规则</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">选择导入方式</label>
                        <div class="import-options">
                            <button class="btn btn-outline import-option-btn active" onclick="firewallModule.switchImportMode('file', this)">
                                📁 从文件导入 (JSON)
                            </button>
                            <button class="btn btn-outline import-option-btn" onclick="firewallModule.switchImportMode('text', this)">
                                📝 从文本导入 (JSON)
                            </button>
                            <button class="btn btn-outline import-option-btn" onclick="firewallModule.switchImportMode('iptables', this)">
                                🔥 从Iptables导入
                            </button>
                        </div>
                    </div>

                    <div id="importFileMode">
                        <div class="form-group">
                            <label class="form-label">选择JSON文件</label>
                            <input type="file" accept=".json" id="importFileInput" onchange="firewallModule.handleFileImport(event)">
                            <small style="color: var(--text-secondary);">支持之前导出的防火墙规则JSON文件</small>
                        </div>
                    </div>

                    <div id="importTextMode" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">粘贴JSON数据</label>
                            <textarea class="form-textarea" id="importTextArea" rows="10" placeholder='[{"protocol":"TCP","source":"0.0.0.0/0","port":"80","action":"ACCEPT"}]'></textarea>
                        </div>
                        <button class="btn btn-primary" onclick="firewallModule.handleTextImport()">导入规则</button>
                    </div>

                    <div id="importIptablesMode" style="display: none;">
                        <div class="form-group">
                            <label class="form-label">粘贴Iptables规则</label>
                            <textarea class="form-textarea" id="iptablesTextArea" rows="10" placeholder="-A INPUT -p tcp --dport 80 -j ACCEPT&#10;-A INPUT -p tcp --dport 22 -s 192.168.1.0/24 -j ACCEPT"></textarea>
                        </div>
                        <button class="btn btn-primary" onclick="firewallModule.handleIptablesImport()">转换并导入</button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    switchImportMode(mode, button) {
        document.querySelectorAll('.import-option-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        document.getElementById('importFileMode').style.display = mode === 'file' ? 'block' : 'none';
        document.getElementById('importTextMode').style.display = mode === 'text' ? 'block' : 'none';
        document.getElementById('importIptablesMode').style.display = mode === 'iptables' ? 'block' : 'none';
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (Array.isArray(data)) {
                    data.forEach(rule => {
                        this.rules.push({
                            ...rule,
                            id: Date.now() + Math.random(),
                            enabled: rule.enabled !== undefined ? rule.enabled : true
                        });
                    });
                    document.querySelector('.modal-overlay').remove();
                    this.renderRules();
                    this.updateStats();
                    Utils.showToast(`成功从文件导入了 ${data.length} 条规则`, 'success');
                } else {
                    Utils.showToast('无效的JSON格式', 'error');
                }
            } catch (err) {
                Utils.showToast('JSON解析失败: ' + err.message, 'error');
            }
        };
        reader.readAsText(file);
    }

    handleTextImport() {
        const text = document.getElementById('importTextArea').value;
        try {
            const data = JSON.parse(text);
            if (Array.isArray(data)) {
                data.forEach(rule => {
                    this.rules.push({
                        ...rule,
                        id: Date.now() + Math.random(),
                        enabled: rule.enabled !== undefined ? rule.enabled : true
                    });
                });
                document.querySelector('.modal-overlay').remove();
                this.renderRules();
                this.updateStats();
                Utils.showToast(`成功导入了 ${data.length} 条规则`, 'success');
            } else {
                Utils.showToast('无效的JSON格式，需要数组', 'error');
            }
        } catch (err) {
            Utils.showToast('JSON解析失败: ' + err.message, 'error');
        }
    }

    handleIptablesImport() {
        const text = document.getElementById('iptablesTextArea').value;
        const lines = text.split('\n').filter(line => line.trim());
        let importedCount = 0;

        lines.forEach(line => {
            const match = line.match(/-A\s+\w+\s+-p\s+(\w+)(?:\s+--dport\s+(\w+))?(?:\s+-s\s+([\d./]+))?\s+-j\s+(\w+)/i);
            if (match) {
                this.rules.push({
                    id: Date.now() + Math.random() + importedCount,
                    protocol: match[1].toUpperCase(),
                    source: match[3] || '0.0.0.0/0',
                    port: match[2] || '-',
                    action: match[4].toUpperCase(),
                    enabled: true,
                    description: `从Iptables导入`,
                    priority: 50
                });
                importedCount++;
            }
        });

        if (importedCount > 0) {
            document.querySelector('.modal-overlay').remove();
            this.renderRules();
            this.updateStats();
            Utils.showToast(`成功从Iptables转换导入了 ${importedCount} 条规则`, 'success');
        } else {
            Utils.showToast('未能解析任何有效的Iptables规则', 'error');
        }
    }

    exportRules() {
        const exportData = JSON.stringify(this.rules, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firewall-rules-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast(`已导出 ${this.rules.length} 条规则到JSON文件`, 'success');
    }

    exportFullConfig() {
        const config = {
            exportTime: new Date().toISOString(),
            version: '3.1',
            totalRules: this.rules.length,
            statistics: {
                total: this.rules.length,
                enabled: this.rules.filter(r => r.enabled).length,
                byAction: {
                    ACCEPT: this.rules.filter(r => r.action === 'ACCEPT').length,
                    DROP: this.rules.filter(r => r.action === 'DROP').length,
                    REJECT: this.rules.filter(r => r.action === 'REJECT').length
                },
                byProtocol: {
                    TCP: this.rules.filter(r => r.protocol === 'TCP').length,
                    UDP: this.rules.filter(r => r.protocol === 'UDP').length,
                    ICMP: this.rules.filter(r => r.protocol === 'ICMP').length,
                    ALL: this.rules.filter(r => r.protocol === 'ALL').length
                }
            },
            rules: this.rules
        };

        const exportData = JSON.stringify(config, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `firewall-full-config-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('完整配置已备份！包含规则和统计信息', 'success');
    }

    quickBlockIP() {
        const ipInput = document.getElementById('quickBlockIp');
        const ip = ipInput.value.trim();

        if (!ip) {
            Utils.showToast('请输入IP地址', 'error');
            return;
        }

        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(ip)) {
            Utils.showToast('IP地址格式不正确', 'error');
            return;
        }

        const existingRule = this.rules.find(r => r.source === ip && r.action === 'DROP');
        if (existingRule) {
            Utils.showToast('该IP已被封锁', 'warning');
            return;
        }

        this.rules.unshift({
            id: Date.now(),
            protocol: 'ALL',
            source: ip,
            port: '-',
            action: 'DROP',
            enabled: true,
            description: `快速封锁IP - ${new Date().toLocaleString()}`,
            priority: 200
        });

        ipInput.value = '';
        this.renderRules();
        this.updateStats();
        Utils.showToast(`IP ${ip} 已被成功封锁！`, 'success');

        eventBus.emit('security:alert', {
            type: 'ip_blocked',
            message: `快速封锁IP: ${ip}`,
            severity: 'high'
        });
    }

    resetFirewall() {
        const confirmReset = confirm('⚠️ 警告：这将清空所有自定义防火墙规则！\n\n确定要继续吗？');
        if (confirmReset) {
            this.rules = [];
            this.selectedRules.clear();
            this.renderRules();
            this.updateStats();
            Utils.showToast('防火墙规则已全部清除', 'warning');
        }
    }

    destroy() {
        eventBus.off('firewall:refresh');
    }
}

let firewallModule;
