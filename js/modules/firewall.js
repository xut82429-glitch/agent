class FirewallModule {
    constructor() {
        this.rules = [];
        this.init();
    }

    init() {
        this.render();
        this.loadRules();
        eventBus.on('firewall:refresh', () => this.loadRules());
    }

    render() {
        const container = document.getElementById('page-firewall');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>🔥 防火墙管理</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="firewallModule.showAddRuleModal()">➕ 添加规则</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('firewall:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalRules">0</div>
                    <div class="stat-label">总规则数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="activeRules">0</div>
                    <div class="stat-label">启用规则</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="blockedConnections">0</div>
                    <div class="stat-label">已阻止连接</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="todayAttacks">0</div>
                    <div class="stat-label">今日攻击数</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📋 防火墙规则列表</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <input type="text" placeholder="搜索规则..." class="form-input" style="max-width: 300px;" oninput="firewallModule.filterRules(this.value)">
                        <select class="form-select" style="width: auto;" onchange="firewallModule.filterByAction(this.value)">
                            <option value="">所有动作</option>
                            <option value="ACCEPT">允许</option>
                            <option value="DROP">丢弃</option>
                            <option value="REJECT">拒绝</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>序号</th>
                                <th>协议</th>
                                <th>源地址</th>
                                <th>目标端口</th>
                                <th>动作</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="rulesTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    loadRules() {
        this.rules = [
            { id: 1, protocol: 'TCP', source: '0.0.0.0/0', port: 22, action: 'DROP', enabled: true, description: '禁止外部SSH访问' },
            { id: 2, protocol: 'TCP', source: '192.168.1.0/24', port: 22, action: 'ACCEPT', enabled: true, description: '允许内网SSH访问' },
            { id: 3, protocol: 'TCP', source: '0.0.0.0/0', port: 80, action: 'ACCEPT', enabled: true, description: '允许HTTP访问' },
            { id: 4, protocol: 'TCP', source: '0.0.0.0/0', port: 443, action: 'ACCEPT', enabled: true, description: '允许HTTPS访问' },
            { id: 5, protocol: 'ICMP', source: '0.0.0.0/0', port: '-', action: 'DROP', enabled: false, description: '禁止ICMP ping' },
            { id: 6, protocol: 'TCP', source: '10.0.0.0/8', port: 3306, action: 'ACCEPT', enabled: true, description: '允许内网MySQL访问' },
            { id: 7, protocol: 'UDP', source: '0.0.0.0/0', port: 53, action: 'ACCEPT', enabled: true, description: '允许DNS查询' },
            { id: 8, protocol: 'TCP', source: '0.0.0.0/0', port: 8080, action: 'REJECT', enabled: true, description: '拒绝备用HTTP端口' }
        ];

        this.renderRules();
        this.updateStats();
    }

    renderRules(filteredRules = null) {
        const rules = filteredRules || this.rules;
        const tbody = document.getElementById('rulesTableBody');
        if (!tbody) return;

        tbody.innerHTML = rules.map((rule, index) => `
            <tr>
                <td>${index + 1}</td>
                <td><span class="status-badge info">${rule.protocol}</span></td>
                <td>${rule.source}</td>
                <td>${rule.port}</td>
                <td>
                    <span class="status-badge ${rule.action === 'ACCEPT' ? 'success' : rule.action === 'DROP' ? 'danger' : 'warning'}">
                        ${rule.action}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${rule.enabled ? 'success' : 'warning'}">
                        ${rule.enabled ? '● 启用' : '○ 禁用'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="firewallModule.toggleRule(${rule.id})">
                        ${rule.enabled ? '禁用' : '启用'}
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="firewallModule.deleteRule(${rule.id})">删除</button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const total = this.rules.length;
        const active = this.rules.filter(r => r.enabled).length;
        
        document.getElementById('totalRules').textContent = total;
        document.getElementById('activeRules').textContent = active;
        document.getElementById('blockedConnections').textContent = Utils.randomInRange(150, 300);
        document.getElementById('todayAttacks').textContent = Utils.randomInRange(50, 120);
    }

    filterRules(searchTerm) {
        const filtered = this.rules.filter(rule =>
            rule.source.includes(searchTerm) ||
            rule.port.toString().includes(searchTerm) ||
            rule.description.toLowerCase().includes(searchTerm.toLowerCase())
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
            this.renderRules();
            this.updateStats();
            Utils.showToast('规则已删除', 'success');
        }
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
            description: document.getElementById('ruleDescription').value
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

    destroy() {
        eventBus.off('firewall:refresh');
    }
}

let firewallModule;
