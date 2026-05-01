class DashboardModule {
    constructor() {
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.startAutoRefresh();
        eventBus.on('dashboard:refresh', () => this.refreshData());
    }

    render() {
        const container = document.getElementById('page-dashboard');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>📊 安全仪表盘</h2>
                <div class="header-actions">
                    <span class="status-badge success pulse">● 系统状态：正常</span>
                    <button class="btn btn-outline" onclick="eventBus.emit('dashboard:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🛡️ 安全评分</h3>
                        <span class="stat-icon">📈</span>
                    </div>
                    <div class="stat-value" id="securityScore">85</div>
                    <div class="stat-label">综合安全评分 / 100</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="securityProgress" style="width: 85%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🖥️ CPU使用率</h3>
                        <span class="stat-icon">💻</span>
                    </div>
                    <div class="stat-value" id="cpuUsage">23%</div>
                    <div class="stat-label">处理器负载</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 23%; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">💾 内存使用</h3>
                        <span class="stat-icon">🧠</span>
                    </div>
                    <div class="stat-value" id="memoryUsage">4.2/16 GB</div>
                    <div class="stat-label">已使用 / 总内存</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 26%; background: linear-gradient(90deg, #8b5cf6, #a78bfa);"></div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">💿 磁盘使用</h3>
                        <span class="stat-icon">📀</span>
                    </div>
                    <div class="stat-value" id="diskUsage">128/500 GB</div>
                    <div class="stat-label">已使用 / 总容量</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 25.6%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🌐 网络流量</h3>
                        <button class="btn btn-sm btn-outline">详情</button>
                    </div>
                    <div class="grid grid-2">
                        <div>
                            <div class="stat-label">↑ 上传速度</div>
                            <div class="stat-value" style="font-size: 24px;" id="networkUpload">2.3 MB/s</div>
                        </div>
                        <div>
                            <div class="stat-label">↓ 下载速度</div>
                            <div class="stat-value" style="font-size: 24px;" id="networkDownload">15.8 MB/s</div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">⚠️ 威胁统计</h3>
                        <button class="btn btn-sm btn-outline">查看全部</button>
                    </div>
                    <div class="grid grid-4" style="margin-top: 10px;">
                        <div style="text-align: center;">
                            <div class="stat-value" style="font-size: 24px; color: var(--danger);">12</div>
                            <div class="stat-label">严重</div>
                        </div>
                        <div style="text-align: center;">
                            <div class="stat-value" style="font-size: 24px; color: var(--warning);">28</div>
                            <div class="stat-label">警告</div>
                        </div>
                        <div style="text-align: center;">
                            <div class="stat-value" style="font-size: 24px; color: var(--primary);">45</div>
                            <div class="stat-label">信息</div>
                        </div>
                        <div style="text-align: center;">
                            <div class="stat-value" style="font-size: 24px; color: var(--success);">156</div>
                            <div class="stat-label">已处理</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-2">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🕐 最近安全事件</h3>
                        <a href="#" onclick="showPage('logs')">查看日志 →</a>
                    </div>
                    <div id="recentEvents" style="max-height: 300px; overflow-y: auto;"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🔒 快速操作</h3>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">
                        <button class="btn btn-outline" onclick="showPage('firewall')">
                            🔥 管理防火墙
                        </button>
                        <button class="btn btn-outline" onclick="showPage('vulnerability')">
                            🔍 扫描漏洞
                        </button>
                        <button class="btn btn-outline" onclick="showPage('users')">
                            👥 用户管理
                        </button>
                        <button class="btn btn-outline" onclick="showPage('backup')">
                            💾 创建备份
                        </button>
                        <button class="btn btn-outline" onclick="showPage('logs')">
                            📝 查看日志
                        </button>
                        <button class="btn btn-outline" onclick="showPage('settings')">
                            ⚙️ 安全设置
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.loadRecentEvents();
    }

    loadRecentEvents() {
        const events = [
            { time: '2026-05-01 14:32:18', type: 'warning', message: '检测到异常登录尝试 (IP: 192.168.1.105)' },
            { time: '2026-05-01 14:28:45', type: 'success', message: '防火墙规则更新成功' },
            { time: '2026-05-01 14:25:12', type: 'danger', message: '发现高危漏洞 CVE-2024-1234' },
            { time: '2026-05-01 14:20:33', type: 'info', message: '系统备份已完成' },
            { time: '2026-05-01 14:15:08', type: 'warning', message: 'SSH暴力破解攻击已拦截' }
        ];

        const container = document.getElementById('recentEvents');
        if (!container) return;

        container.innerHTML = events.map(event => `
            <div style="padding: 12px; border-bottom: 1px solid var(--border-light); display: flex; align-items: flex-start; gap: 10px;">
                <span class="status-badge ${event.type}" style="flex-shrink: 0;">●</span>
                <div style="flex: 1;">
                    <div style="font-size: 13px; color: var(--text-primary);">${event.message}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">${event.time}</div>
                </div>
            </div>
        `).join('');
    }

    refreshData() {
        const score = Utils.randomInRange(80, 95);
        const cpu = Utils.randomInRange(15, 35);
        const memory = (Utils.randomInRange(35, 55) / 10).toFixed(1);
        const disk = Utils.randomInRange(120, 150);
        const upload = (Utils.randomInRange(10, 50) / 10).toFixed(1);
        const download = (Utils.randomInRange(100, 200) / 10).toFixed(1);

        document.getElementById('securityScore').textContent = score;
        document.getElementById('securityProgress').style.width = `${score}%`;
        document.getElementById('cpuUsage').textContent = `${cpu}%`;
        document.getElementById('memoryUsage').textContent = `${memory}/16 GB`;
        document.getElementById('diskUsage').textContent = `${disk}/500 GB`;
        document.getElementById('networkUpload').textContent = `${upload} MB/s`;
        document.getElementById('networkDownload').textContent = `${download} MB/s`;

        Utils.showToast('仪表盘数据已刷新', 'success');
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.refreshData();
        }, APP_CONFIG.refreshInterval.dashboard);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        eventBus.off('dashboard:refresh');
    }
}
