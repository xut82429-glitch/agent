class IntrusionModule {
    constructor() {
        this.alerts = [];
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.loadAlerts();
        this.startRealTimeMonitoring();
        eventBus.on('intrusion:refresh', () => this.loadAlerts());
    }

    render() {
        const container = document.getElementById('page-intrusion');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>🚨 入侵检测系统 (IDS)</h2>
                <div class="header-actions">
                    <span class="status-badge success pulse" id="idsStatus">● IDS 运行中</span>
                    <button class="btn btn-primary" onclick="intrusionModule.runFullScan()">🔍 全面扫描</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('intrusion:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="criticalAlerts">0</div>
                    <div class="stat-label">严重威胁</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="highAlerts">0</div>
                    <div class="stat-label">高危告警</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="mediumAlerts">0</div>
                    <div class="stat-label">中等风险</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="blockedAttacks">0</div>
                    <div class="stat-label">已拦截攻击</div>
                </div>
            </div>

            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🎯 实时威胁监控</h3>
                        <span class="status-badge danger pulse">LIVE</span>
                    </div>
                    <div id="realtimeThreats" style="max-height: 300px; overflow-y: auto;"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📊 攻击类型分布</h3>
                    </div>
                    <div id="attackTypesChart" style="padding: 20px 0;">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                    <span>暴力破解</span>
                                    <strong style="color: var(--danger);">45%</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 45%; background: var(--danger);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                    <span>端口扫描</span>
                                    <strong style="color: var(--warning);">28%</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 28%; background: var(--warning);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                    <span>DDoS攻击</span>
                                    <strong style="color: var(--primary);">15%</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 15%; background: var(--primary);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                    <span>SQL注入</span>
                                    <strong style="color: var(--success);">8%</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 8%; background: var(--success);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                                    <span>XSS攻击</span>
                                    <strong style="color: var(--text-muted);">4%</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 4%; background: var(--text-muted);"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">⚠️ 安全告警列表</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <select class="form-select" style="width: auto;" onchange="intrusionModule.filterBySeverity(this.value)">
                            <option value="">所有级别</option>
                            <option value="critical">严重</option>
                            <option value="high">高危</option>
                            <option value="medium">中等</option>
                            <option value="low">低危</option>
                        </select>
                        <select class="form-select" style="width: auto;" onchange="intrusionModule.filterByStatus(this.value)">
                            <option value="">所有状态</option>
                            <option value="active">活跃</option>
                            <option value="resolved">已处理</option>
                            <option value="ignored">已忽略</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>级别</th>
                                <th>攻击类型</th>
                                <th>源IP</th>
                                <th>目标</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="alertsTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    loadAlerts() {
        this.alerts = [
            { time: '2026-05-01 14:35:18', severity: 'critical', type: '暴力破解', sourceIP: '203.0.113.50', target: 'SSH (Port 22)', status: 'active' },
            { time: '2026-05-01 14:32:45', severity: 'high', type: '端口扫描', sourceIP: '198.51.100.23', target: '全端口范围', status: 'active' },
            { time: '2026-05-01 14:28:12', severity: 'medium', type: 'DDoS攻击', sourceIP: '192.0.2.100', target: 'HTTP (Port 80)', status: 'resolved' },
            { time: '2026-05-01 14:25:33', severity: 'high', type: 'SQL注入尝试', sourceIP: '203.0.113.77', target: '/api/login', status: 'active' },
            { time: '2026-05-01 14:20:08', severity: 'low', type: 'XSS攻击', sourceIP: '198.51.100.45', target: '/search?q=', status: 'ignored' },
            { time: '2026-05-01 14:15:22', severity: 'critical', type: '暴力破解', sourceIP: '192.0.2.150', target: 'WordPress登录', status: 'resolved' },
            { time: '2026-05-01 14:10:45', severity: 'medium', type: '目录遍历', sourceIP: '203.0.113.99', target: '/etc/passwd', status: 'resolved' },
            { time: '2026-05-01 14:05:18', severity: 'high', type: '恶意User-Agent', sourceIP: '198.51.100.88', target: 'Web服务器', status: 'active' }
        ];

        this.renderAlerts();
        this.updateStats();
        this.loadRealtimeThreats();
    }

    renderAlerts(filteredAlerts = null) {
        const alerts = filteredAlerts || this.alerts;
        const tbody = document.getElementById('alertsTableBody');
        if (!tbody) return;

        tbody.innerHTML = alerts.map(alert => `
            <tr>
                <td><code>${alert.time}</code></td>
                <td>
                    <span class="status-badge ${
                        alert.severity === 'critical' ? 'danger' :
                        alert.severity === 'high' ? 'warning' :
                        alert.severity === 'medium' ? 'info' : 'default'
                    }">${alert.severity.toUpperCase()}</span>
                </td>
                <td><strong>${alert.type}</strong></td>
                <td><code>${alert.sourceIP}</code></td>
                <td>${alert.target}</td>
                <td>
                    <span class="status-badge ${
                        alert.status === 'active' ? 'danger' :
                        alert.status === 'resolved' ? 'success' : 'warning'
                    }">${
                        alert.status === 'active' ? '● 活跃' :
                        alert.status === 'resolved' ? '✓ 已处理' : '⊘ 已忽略'
                    }</span>
                </td>
                <td>
                    ${alert.status === 'active' ? `
                        <button class="btn btn-sm btn-success" onclick="intrusionModule.resolveAlert('${alert.time}')">处理</button>
                        <button class="btn btn-sm btn-danger" onclick="intrusionModule.blockIP('${alert.sourceIP}')">封禁IP</button>
                    ` : ''}
                    <button class="btn btn-sm btn-outline" onclick="intrusionModule.viewAlertDetail('${alert.time}')">详情</button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        document.getElementById('criticalAlerts').textContent = this.alerts.filter(a => a.severity === 'critical').length;
        document.getElementById('highAlerts').textContent = this.alerts.filter(a => a.severity === 'high').length;
        document.getElementById('mediumAlerts').textContent = this.alerts.filter(a => a.severity === 'medium').length;
        document.getElementById('blockedAttacks').textContent = Utils.randomInRange(250, 400);
    }

    loadRealtimeThreats() {
        const threats = [
            { time: '刚刚', ip: '185.220.101.0', action: 'SSH暴力破解尝试被拦截', blocked: true },
            { time: '2分钟前', ip: '91.121.87.25', action: '可疑的HTTP请求模式检测到', blocked: false },
            { time: '5分钟前', ip: '194.163.128.45', action: 'SQL注入特征匹配', blocked: true },
            { time: '8分钟前', ip: '89.248.167.131', action: '异常用户代理访问', blocked: false }
        ];

        const container = document.getElementById('realtimeThreats');
        if (!container) return;

        container.innerHTML = threats.map(threat => `
            <div style="padding: 12px; border-bottom: 1px solid var(--border-light); display: flex; align-items: center; gap: 12px;">
                <span class="status-badge ${threat.blocked ? 'success' : 'warning'}" style="flex-shrink: 0;">
                    ${threat.blocked ? '✓ 已拦截' : '⚠ 监控中'}
                </span>
                <div style="flex: 1;">
                    <div style="font-size: 13px; color: var(--text-primary);">${threat.action}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">
                        IP: <code>${threat.ip}</code> · ${threat.time}
                    </div>
                </div>
            </div>
        `).join('');
    }

    filterBySeverity(severity) {
        if (!severity) {
            this.renderAlerts();
            return;
        }
        const filtered = this.alerts.filter(a => a.severity === severity);
        this.renderAlerts(filtered);
    }

    filterByStatus(status) {
        if (!status) {
            this.renderAlerts();
            return;
        }
        const filtered = this.alerts.filter(a => a.status === status);
        this.renderAlerts(filtered);
    }

    resolveAlert(time) {
        const alert = this.alerts.find(a => a.time === time);
        if (alert) {
            alert.status = 'resolved';
            this.renderAlerts();
            this.updateStats();
            Utils.showToast('威胁已处理并记录', 'success');
        }
    }

    blockIP(ip) {
        if (confirm(`确定要封禁IP地址 ${ip} 吗？\n\n此操作将在防火墙中添加规则阻止该IP的所有连接。`)) {
            Utils.showToast(`IP ${ip} 已加入黑名单`, 'success');
            setTimeout(() => {
                showPage('firewall');
            }, 1000);
        }
    }

    viewAlertDetail(time) {
        const alert = this.alerts.find(a => a.time === time);
        if (alert) {
            Utils.showToast(`查看告警详情: ${alert.type}`, 'info');
        }
    }

    runFullScan() {
        Utils.showToast('正在执行全面安全扫描...', 'info');
        Utils.simulateLoading(() => {
            Utils.showToast('扫描完成！发现 3 个新的潜在威胁', 'warning');
            this.loadAlerts();
        }, 3000);
    }

    startRealTimeMonitoring() {
        this.refreshInterval = setInterval(() => {
            this.loadRealtimeThreats();
        }, APP_CONFIG.refreshInterval.intrusion);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        eventBus.off('intrusion:refresh');
    }
}

let intrusionModule;
