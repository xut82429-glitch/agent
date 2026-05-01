class DashboardModule {
    constructor() {
        this.refreshInterval = null;
        this.charts = {};
        this.init();
    }

    init() {
        this.render();
        this.initCharts();
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
                    <select id="timeRange" class="form-select" style="width: auto; font-size: 13px;" onchange="dashboardModule.changeTimeRange(this.value)">
                        <option value="1h">最近1小时</option>
                        <option value="6h" selected>最近6小时</option>
                        <option value="24h">最近24小时</option>
                        <option value="7d">最近7天</option>
                        <option value="30d">最近30天</option>
                    </select>
                    <button class="btn btn-outline" onclick="eventBus.emit('dashboard:refresh')">🔄 刷新</button>
                </div>
            </div>

            <!-- 顶部统计卡片 -->
            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="stat-card-chart hover-lift">
                    <div class="stat-header">
                        <span class="stat-label">🛡️ 安全评分</span>
                        <span style="font-size: 24px;">📈</span>
                    </div>
                    <div class="stat-value" id="securityScore">85</div>
                    <div class="stat-change positive">+2 较昨日</div>
                    <div class="progress-bar" style="margin-top: 12px;">
                        <div class="progress-fill" id="securityProgress" style="width: 85%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="securityScoreChart"></canvas>
                    </div>
                </div>

                <div class="stat-card-chart hover-lift">
                    <div class="stat-header">
                        <span class="stat-label">🖥️ CPU使用率</span>
                        <span style="font-size: 24px;">💻</span>
                    </div>
                    <div class="stat-value" id="cpuUsage">23%</div>
                    <div class="stat-change neutral">稳定</div>
                    <div class="progress-bar" style="margin-top: 12px;">
                        <div class="progress-fill" style="width: 23%; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="cpuChart"></canvas>
                    </div>
                </div>

                <div class="stat-card-chart hover-lift">
                    <div class="stat-header">
                        <span class="stat-label">💾 内存使用</span>
                        <span style="font-size: 24px;">🧠</span>
                    </div>
                    <div class="stat-value" id="memoryUsage">4.2/16 GB</div>
                    <div class="stat-change negative">↑ 5% 较昨日</div>
                    <div class="progress-bar" style="margin-top: 12px;">
                        <div class="progress-fill" style="width: 26%; background: linear-gradient(90deg, #8b5cf6, #a78bfa);"></div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="memoryChart"></canvas>
                    </div>
                </div>

                <div class="stat-card-chart hover-lift">
                    <div class="stat-header">
                        <span class="stat-label">💿 磁盘使用</span>
                        <span style="font-size: 24px;">📀</span>
                    </div>
                    <div class="stat-value" id="diskUsage">128/500 GB</div>
                    <div class="stat-change positive">正常</div>
                    <div class="progress-bar" style="margin-top: 12px;">
                        <div class="progress-fill" style="width: 25.6%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                    </div>
                    <div class="mini-chart">
                        <canvas id="diskChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- 图表区域 -->
            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="chart-container">
                    <div class="chart-title">🌐 网络流量趋势 (MB/s)</div>
                    <div class="chart-subtitle">上传/下载速度实时监控</div>
                    <div class="canvas-wrapper" style="height: 280px;">
                        <canvas id="networkTrafficChart"></canvas>
                    </div>
                </div>

                <div class="chart-container">
                    <div class="chart-title">⚠️ 安全事件分布</div>
                    <div class="chart-subtitle">按类型和严重程度分类统计</div>
                    <div class="canvas-wrapper" style="height: 280px;">
                        <canvas id="securityEventsChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- 详细信息区域 -->
            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🕐 最近安全事件时间线</h3>
                        <a href="#" onclick="showPage('logs')">查看全部日志 →</a>
                    </div>
                    <div id="recentEvents" style="max-height: 350px; overflow-y: auto;"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🔒 快速操作面板</h3>
                        <span class="status-badge info">一键操作</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px;">
                        <button class="btn btn-outline" onclick="showPage('firewall')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">🔥</span>
                            <span>管理防火墙规则</span>
                            <span style="font-size: 11px; color: var(--text-muted);">8条活跃规则</span>
                        </button>
                        <button class="btn btn-outline" onclick="showPage('vulnerability')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">🔍</span>
                            <span>扫描系统漏洞</span>
                            <span style="font-size: 11px; color: var(--text-muted);">上次: 2小时前</span>
                        </button>
                        <button class="btn btn-outline" onclick="showPage('users')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">👥</span>
                            <span>用户权限管理</span>
                            <span style="font-size: 11px; color: var(--text-muted);">8个活跃账户</span>
                        </button>
                        <button class="btn btn-outline" onclick="showPage('backup')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">💾</span>
                            <span>创建数据备份</span>
                            <span style="font-size: 11px; color: var(--text-muted);">下次: 03:00自动</span>
                        </button>
                        <button class="btn btn-outline" onclick="showPage('intrusion')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">🚨</span>
                            <span>入侵检测中心</span>
                            <span style="font-size: 11px; color: var(--text-muted);">5个活跃告警</span>
                        </button>
                        <button class="btn btn-outline" onclick="showPage('network')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">🌐</span>
                            <span>网络连接监控</span>
                            <span style="font-size: 11px; color: var(--text-muted);">156个活跃连接</span>
                        </button>
                        <button class="btn btn-outline" onclick="dashboardModule.runSystemHealthCheck()" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">✅</span>
                            <span>系统健康检查</span>
                            <span style="font-size: 11px; color: var(--text-muted);">全面诊断</span>
                        </button>
                        <button class="btn btn-outline" onclick="showPage('settings')" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
                            <span style="font-size: 28px;">⚙️</span>
                            <span>安全设置配置</span>
                            <span style="font-size: 11px; color: var(--text-muted);">密码/SSH策略</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- 系统信息概览 -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🖥️ 系统信息总览</h3>
                    <button class="btn btn-sm btn-outline" onclick="dashboardModule.showSystemInfoModal()">详细信息 →</button>
                </div>
                <div class="grid grid-4" style="gap: 16px; margin-top: 16px;" id="systemInfoGrid">
                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">操作系统</div>
                        <div style="font-weight: 600;" id="osInfo">Ubuntu 22.04 LTS</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">内核版本</div>
                        <div style="font-weight: 600;" id="kernelInfo">Linux 5.15.0-generic</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">运行时间</div>
                        <div style="font-weight: 600;" id="uptimeInfo">45天 12小时 30分</div>
                    </div>
                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: var(--radius-md);">
                        <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">主机名/IP</div>
                        <div style="font-weight: 600;" id="hostInfo">sec-server / 192.168.1.100</div>
                    </div>
                </div>
            </div>
        `;

        this.loadRecentEvents();
    }

    initCharts() {
        setTimeout(() => {
            this.createMiniCharts();
            this.createNetworkTrafficChart();
            this.createSecurityEventsChart();
        }, 100);
    }

    createMiniCharts() {
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            elements: {
                point: { radius: 0 },
                line: { tension: 0.4 }
            }
        };

        // Security Score Chart
        if (document.getElementById('securityScoreChart')) {
            this.charts.securityScore = new Chart(document.getElementById('securityScoreChart'), {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', ''],
                    datasets: [{
                        data: [82, 84, 83, 85, 84, 85],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartOptions
            });
        }

        // CPU Chart
        if (document.getElementById('cpuChart')) {
            this.charts.cpu = new Chart(document.getElementById('cpuChart'), {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', ''],
                    datasets: [{
                        data: [25, 22, 28, 23, 21, 23],
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartOptions
            });
        }

        // Memory Chart
        if (document.getElementById('memoryChart')) {
            this.charts.memory = new Chart(document.getElementById('memoryChart'), {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', ''],
                    datasets: [{
                        data: [4.0, 4.1, 4.2, 4.1, 4.0, 4.2],
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartOptions
            });
        }

        // Disk Chart
        if (document.getElementById('diskChart')) {
            this.charts.disk = new Chart(document.getElementById('diskChart'), {
                type: 'line',
                data: {
                    labels: ['', '', '', '', '', ''],
                    datasets: [{
                        data: [125, 126, 127, 128, 128, 128],
                        borderColor: '#f59e0b',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        fill: true,
                        borderWidth: 2
                    }]
                },
                options: chartOptions
            });
        }
    }

    createNetworkTrafficChart() {
        const ctx = document.getElementById('networkTrafficChart');
        if (!ctx) return;

        const hours = [];
        for (let i = 23; i >= 0; i--) {
            hours.push(`${i}:00`);
        }

        this.charts.networkTraffic = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [
                    {
                        label: '下载速度',
                        data: Array.from({length: 24}, () => Utils.randomInRange(10, 25)),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '上传速度',
                        data: Array.from({length: 24}, () => Utils.randomInRange(1, 8)),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, boxWidth: 8 }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} MB/s`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '速度 (MB/s)' }
                    },
                    x: {
                        ticks: { maxTicksLimit: 8 }
                    }
                }
            }
        });
    }

    createSecurityEventsChart() {
        const ctx = document.getElementById('securityEventsChart');
        if (!ctx) return;

        this.charts.securityEvents = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['暴力破解', '端口扫描', 'SQL注入', 'XSS攻击', 'DDoS', '恶意文件'],
                datasets: [
                    {
                        label: '严重',
                        data: [45, 28, 12, 8, 5, 15],
                        backgroundColor: '#ef4444'
                    },
                    {
                        label: '高危',
                        data: [32, 18, 8, 5, 3, 10],
                        backgroundColor: '#f59e0b'
                    },
                    {
                        label: '中危',
                        data: [18, 12, 5, 3, 2, 7],
                        backgroundColor: '#2563eb'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { usePointStyle: true, boxWidth: 8 }
                    }
                },
                scales: {
                    x: {
                        stacked: true
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: { display: true, text: '事件数量' }
                    }
                }
            }
        });
    }

    loadRecentEvents() {
        const events = [
            { time: '刚刚', type: 'danger', icon: '🚨', message: '检测到异常登录尝试 (IP: 203.0.113.50)', source: 'SSH认证' },
            { time: '2分钟前', type: 'warning', icon: '⚠️', message: '暴力破解攻击被拦截 (15次失败尝试)', source: 'IDS' },
            { time: '5分钟前', type: 'success', icon: '✅', message: '防火墙规则更新成功 (新增3条规则)', source: 'Firewall' },
            { time: '12分钟前', type: 'danger', icon: '🔴', message: '发现高危漏洞 CVE-2024-1234 (OpenSSL)', source: '漏洞扫描' },
            { time: '18分钟前', type: 'info', icon: 'ℹ️', message: '系统备份已完成 (大小: 45.2GB)', source: '备份服务' },
            { time: '25分钟前', type: 'warning', icon: '⚡', message: 'CPU使用率超过80%持续5分钟', source: '监控' },
            { time: '32分钟前', type: 'success', icon: '🔒', message: 'SSH密钥轮换完成 (有效期: 90天)', source: '安全策略' },
            { time: '45分钟前', type: 'danger', icon: '🎯', message: '端口扫描检测到可疑活动 (198.51.100.23)', source: '入侵检测' },
            { time: '1小时前', type: 'info', icon: '📦', message: 'Docker容器 web-server 重启成功', source: '容器管理' },
            { time: '1.5小时前', type: 'success', icon: '✅', message: '安全评分提升至 85 分 (+2分)', source: '仪表盘' }
        ];

        const container = document.getElementById('recentEvents');
        if (!container) return;

        container.innerHTML = events.map(event => `
            <div style="padding: 14px 16px; border-bottom: 1px solid var(--border-light); display: flex; align-items: flex-start; gap: 12px; transition: all 0.2s;" 
                 onmouseover="this.style.background='var(--bg-hover)'"
                 onmouseout="this.style.background='transparent'">
                <span style="font-size: 20px; flex-shrink: 0;">${event.icon}</span>
                <div style="flex: 1; min-width: 0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 13px; color: var(--text-primary); font-weight: 500;">${event.message}</span>
                        <span class="status-badge ${event.type}" style="flex-shrink: 0; margin-left: 8px;">●</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--text-muted);">
                        <span>${event.time}</span>
                        <span>来源: ${event.source}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    refreshData() {
        const score = Utils.randomInRange(82, 95);
        const cpu = Utils.randomInRange(15, 35);
        const memory = (Utils.randomInRange(35, 55) / 10).toFixed(1);
        const upload = (Utils.randomInRange(10, 40) / 10).toFixed(1);
        const download = (Utils.randomInRange(120, 200) / 10).toFixed(1);

        document.getElementById('securityScore').textContent = score;
        document.getElementById('securityProgress').style.width = `${score}%`;
        
        document.getElementById('cpuUsage').textContent = `${cpu}%`;
        document.querySelector('.grid-4 .stat-card-chart:nth-child(2) .progress-fill').style.width = `${cpu}%`;
        
        document.getElementById('memoryUsage').textContent = `${memory}/16 GB`;
        document.querySelector('.grid-4 .stat-card-chart:nth-child(3) .progress-fill').style.width = `${(memory / 16 * 100)}%`;

        document.getElementById('networkUpload').textContent = `${upload} MB/s`;
        document.getElementById('networkDownload').textContent = `${download} MB/s`;

        this.updateCharts();
        Utils.showToast('仪表盘数据已刷新', 'success');
    }

    updateCharts() {
        if (this.charts.securityScore) {
            const newData = Array.from({length: 6}, () => Utils.randomInRange(80, 95));
            this.charts.securityScore.data.datasets[0].data = newData;
            this.charts.securityScore.update('none');
        }

        if (this.charts.cpu) {
            const newData = Array.from({length: 6}, () => Utils.randomInRange(15, 35));
            this.charts.cpu.data.datasets[0].data = newData;
            this.charts.cpu.update('none');
        }

        if (this.charts.memory) {
            const newData = Array.from({length: 6}, () => +(Utils.randomInRange(35, 55) / 10).toFixed(1));
            this.charts.memory.data.datasets[0].data = newData;
            this.charts.memory.update('none');
        }
    }

    changeTimeRange(range) {
        Utils.showToast(`切换到: ${range} 时间范围`, 'info');
        this.refreshData();
    }

    runSystemHealthCheck() {
        Utils.showToast('正在执行系统健康检查...', 'info');

        setTimeout(() => {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 class="modal-title">✅ 系统健康检查报告</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 24px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                                <h4 style="font-size: 18px;">总体健康度</h4>
                                <span class="status-badge success" style="font-size: 16px; padding: 8px 16px;">92% 优秀</span>
                            </div>
                            <div class="progress-bar" style="height: 12px;">
                                <div class="progress-fill" style="width: 92%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                            </div>
                        </div>

                        <div class="grid grid-2" style="gap: 16px;">
                            <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); border-left: 4px solid #10b981;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong>防火墙状态</strong>
                                    <span class="status-badge success">正常</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">8条规则已启用，今日拦截156次攻击</p>
                            </div>
                            
                            <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); border-left: 4px solid #10b981;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong>入侵检测</strong>
                                    <span class="status-badge success">运行中</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">IDS守护进程正常，5个活跃告警</p>
                            </div>
                            
                            <div style="padding: 16px; background: rgba(245, 158, 11, 0.1); border-radius: var(--radius-md); border-left: 4px solid #f59e0b;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong>系统资源</strong>
                                    <span class="status-badge warning">注意</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">内存使用26%，建议关注长期趋势</p>
                            </div>
                            
                            <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); border-left: 4px solid #10b981;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong>备份状态</strong>
                                    <span class="status-badge success">最新</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">上次备份: 2小时前，下次: 明日03:00</p>
                            </div>
                            
                            <div style="padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: var(--radius-md); border-left: 4px solid #10b981;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong>SSL证书</strong>
                                    <span class="status-badge success">有效</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">剩余89天过期，无需立即更新</p>
                            </div>
                            
                            <div style="padding: 16px; background: rgba(239, 68, 68, 0.1); border-radius: var(--radius-md); border-left: 4px solid #ef4444;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <strong>待处理漏洞</strong>
                                    <span class="status-badge danger">3个</span>
                                </div>
                                <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">发现3个高危漏洞，建议尽快修复</p>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                        <button class="btn btn-primary" onclick="showPage('vulnerability'); this.closest('.modal-overlay').remove();">查看详情并修复</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }, 2000);
    }

    showSystemInfoModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 800px;">
                <div class="modal-header">
                    <h3 class="modal-title">🖥️ 详细系统信息</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="tabs" style="margin-bottom: 20px;">
                        <button class="tab active" onclick="this.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.getElementById('sysInfoBasic').classList.remove('hidden'); document.getElementById('sysInfoHardware').classList.add('hidden'); document.getElementById('sysInfoNetwork').classList.add('hidden');">基本信息</button>
                        <button class="tab" onclick="this.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.getElementById('sysInfoBasic').classList.add('hidden'); document.getElementById('sysInfoHardware').classList.remove('hidden'); document.getElementById('sysInfoNetwork').classList.add('hidden');">硬件信息</button>
                        <button class="tab" onclick="this.parentElement.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); this.classList.add('active'); document.getElementById('sysInfoBasic').classList.add('hidden'); document.getElementById('sysInfoHardware').classList.add('hidden'); document.getElementById('sysInfoNetwork').classList.remove('hidden');">网络信息</button>
                    </div>

                    <div id="sysInfoBasic">
                        <table class="data-table">
                            <tbody>
                                <tr><td><strong>主机名</strong></td><td>sec-server</td></tr>
                                <tr><td><strong>操作系统</strong></td><td>Ubuntu 22.04 LTS (Jammy Jellyfish)</td></tr>
                                <tr><td><strong>内核版本</strong></td><td>Linux 5.15.0-105-generic x86_64</td></tr>
                                <tr><td><strong>架构</strong></td><td>x86_64 (64-bit)</td></tr>
                                <tr><td><strong>运行时间</strong></td><td>45天 12小时 30分钟 15秒</td></tr>
                                <tr><td><strong>时区</strong></td><td>Asia/Shanghai (UTC+8)</td></tr>
                                <tr><td><strong>语言环境</strong></td><td>zh_CN.UTF-8</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div id="sysInfoHardware" class="hidden">
                        <table class="data-table">
                            <tbody>
                                <tr><td><strong>CPU型号</strong></td><td>Intel Xeon E5-2680 v4 @ 2.40GHz</td></tr>
                                <tr><td><strong>CPU核心数</strong></td><td>8核 / 16线程</td></tr>
                                <tr><td><strong>总内存</strong></td><td>16 GiB DDR4 ECC</td></tr>
                                <tr><td><strong>可用内存</strong></td><td>11.8 GiB</td></tr>
                                <tr><td><strong>磁盘容量</strong></td><td>512 GB SSD NVMe</td></tr>
                                <tr><td><strong>磁盘使用</strong></td><td>128 GB (25%)</td></tr>
                                <tr><td><strong>I/O调度器</strong></td><td>mq-deadline</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div id="sysInfoNetwork" class="hidden">
                        <table class="data-table">
                            <tbody>
                                <tr><td><strong>主IP地址</strong></td><td>192.168.1.100</td></tr>
                                <tr><td><strong>子网掩码</strong></td><td>255.255.255.0</td></tr>
                                <tr><td><strong>网关</strong></td><td>192.168.1.1</td></tr>
                                <tr><td><strong>DNS服务器</strong></td><td>8.8.8.8, 8.8.4.4</td></tr>
                                <tr><td><strong>MAC地址</strong></td><td>00:0C:29:XX:XX:XX</td></tr>
                                <tr><td><strong>网络接口</strong></td><td>eth0 (1 Gbps, 全双工)</td></tr>
                                <tr><td><strong>IPv6支持</strong></td><td>启用 (fe80::xxxx)</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
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
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        eventBus.off('dashboard:refresh');
    }
}

let dashboardModule;
