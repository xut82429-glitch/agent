class NetworkModule {
    constructor() {
        this.connections = [];
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.loadNetworkData();
        this.startAutoRefresh();
        eventBus.on('network:refresh', () => this.loadNetworkData());
    }

    render() {
        const container = document.getElementById('page-network');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>🌐 网络监控中心</h2>
                <div class="header-actions">
                    <span class="status-badge success pulse">● 网络正常</span>
                    <button class="btn btn-outline" onclick="eventBus.emit('network:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title" style="font-size: 14px;">↑ 上传速度</h3>
                    </div>
                    <div class="stat-value" style="font-size: 24px;" id="uploadSpeed">2.3 MB/s</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="uploadBar" style="width: 23%; background: linear-gradient(90deg, #2563eb, #3b82f6);"></div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title" style="font-size: 14px;">↓ 下载速度</h3>
                    </div>
                    <div class="stat-value" style="font-size: 24px;" id="downloadSpeed">15.8 MB/s</div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="downloadBar" style="width: 63%; background: linear-gradient(90deg, #10b981, #34d399);"></div>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title" style="font-size: 14px;">活跃连接数</h3>
                    </div>
                    <div class="stat-value" style="font-size: 24px;" id="activeConnections">156</div>
                    <div class="stat-label">当前网络连接</div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title" style="font-size: 14px;">带宽使用率</h3>
                    </div>
                    <div class="stat-value" style="font-size: 24px;" id="bandwidthUsage">42%</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 42%; background: linear-gradient(90deg, #f59e0b, #fbbf24);"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🖥️ 网络接口</h3>
                    </div>
                    <div id="interfacesList" style="padding: 10px 0;"></div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📊 流量统计 (今日)</h3>
                    </div>
                    <div style="padding: 20px 0;">
                        <div style="display: flex; flex-direction: column; gap: 16px;">
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                    <span>上传流量</span>
                                    <strong style="color: var(--primary);">12.5 GB</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 35%; background: var(--primary);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                    <span>下载流量</span>
                                    <strong style="color: var(--success);">45.8 GB</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 72%; background: var(--success);"></div>
                                </div>
                            </div>
                            <div>
                                <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px;">
                                    <span>总流量</span>
                                    <strong>58.3 GB / 100 GB</strong>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: 58%; background: linear-gradient(90deg, var(--primary), var(--success));"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🔗 当前网络连接</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <input type="text" placeholder="搜索IP或端口..." class="form-input" style="max-width: 300px;" oninput="networkModule.searchConnections(this.value)">
                        <select class="form-select" style="width: auto;" onchange="networkModule.filterByProtocol(this.value)">
                            <option value="">所有协议</option>
                            <option value="TCP">TCP</option>
                            <option value="UDP">UDP</option>
                        </select>
                        <select class="form-select" style="width: auto;" onchange="networkModule.filterByState(this.value)">
                            <option value="">所有状态</option>
                            <option value="ESTABLISHED">已建立</option>
                            <option value="LISTENING">监听中</option>
                            <option value="TIME_WAIT">等待关闭</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>协议</th>
                                <th>本地地址</th>
                                <th>远程地址</th>
                                <th>状态</th>
                                <th>进程</th>
                                <th>PID</th>
                            </tr>
                        </thead>
                        <tbody id="connectionsTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    loadNetworkData() {
        this.connections = [
            { protocol: 'TCP', local: '0.0.0.0:22', remote: '0.0.0.0:*', state: 'LISTENING', process: 'sshd', pid: 1234 },
            { protocol: 'TCP', local: '0.0.0.0:80', remote: '0.0.0.0:*', state: 'LISTENING', process: 'nginx', pid: 2345 },
            { protocol: 'TCP', local: '0.0.0.0:443', remote: '0.0.0.0:*', state: 'LISTENING', process: 'nginx', pid: 2345 },
            { protocol: 'TCP', local: '192.168.1.100:22', remote: '192.168.1.105:54321', state: 'ESTABLISHED', process: 'sshd', pid: 5678 },
            { protocol: 'TCP', local: '192.168.1.100:443', remote: '203.0.113.50:12345', state: 'ESTABLISHED', process: 'nginx', pid: 2345 },
            { protocol: 'TCP', local: '192.168.1.100:80', remote: '198.51.100.23:54322', state: 'ESTABLISHED', process: 'nginx', pid: 2345 },
            { protocol: 'TCP', local: '127.0.0.1:3306', remote: '0.0.0.0:*', state: 'LISTENING', process: 'mysqld', pid: 3456 },
            { protocol: 'TCP', local: '127.0.0.1:6379', remote: '0.0.0.0:*', state: 'LISTENING', process: 'redis-server', pid: 4567 },
            { protocol: 'TCP', local: '192.168.1.100:22', remote: '192.168.1.110:54323', state: 'TIME_WAIT', process: 'sshd', pid: 5678 },
            { protocol: 'UDP', local: '0.0.0.0:53', remote: '0.0.0.0:*', state: '-', process: 'named', pid: 6789 },
            { protocol: 'TCP', local: '192.168.1.100:443', remote: '185.220.101.0:54324', state: 'SYN_RECV', process: 'nginx', pid: 2345 },
            { protocol: 'TCP', local: '0.0.0.0:8080', remote: '0.0.0.0:*', state: 'LISTENING', process: 'java', pid: 7890 }
        ];

        this.renderConnections();
        this.renderInterfaces();
        this.updateBandwidth();
    }

    renderConnections(filteredConnections = null) {
        const connections = filteredConnections || this.connections;
        const tbody = document.getElementById('connectionsTableBody');
        if (!tbody) return;

        tbody.innerHTML = connections.map(conn => `
            <tr>
                <td><span class="status-badge info">${conn.protocol}</span></td>
                <td><code>${conn.local}</code></td>
                <td><code>${conn.remote}</code></td>
                <td>
                    <span class="status-badge ${
                        conn.state === 'ESTABLISHED' ? 'success' :
                        conn.state === 'LISTENING' ? 'info' :
                        conn.state === 'TIME_WAIT' ? 'warning' : 'default'
                    }">${conn.state}</span>
                </td>
                <td><strong>${conn.process}</strong></td>
                <td><code>${conn.pid}</code></td>
            </tr>
        `).join('');
    }

    renderInterfaces() {
        const interfaces = [
            { name: 'eth0', ip: '192.168.1.100', mask: '255.255.255.0', mac: '00:0C:29:XX:XX:XX', status: 'UP', speed: '1 Gbps', rx: '45.8 GB', tx: '12.5 GB' },
            { name: 'lo', ip: '127.0.0.1', mask: '255.0.0.0', mac: '-', status: 'UP', speed: '-', rx: '2.3 MB', tx: '2.3 MB' }
        ];

        const container = document.getElementById('interfacesList');
        if (!container) return;

        container.innerHTML = interfaces.map(iface => `
            <div style="padding: 16px; border: 1px solid var(--border-light); border-radius: var(--radius-md); margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h4 style="font-size: 16px; font-weight: 600;">${iface.name}</h4>
                    <span class="status-badge ${iface.status === 'UP' ? 'success' : 'danger'}">${iface.status === 'UP' ? '● 运行中' : '● 停止'}</span>
                </div>
                <div class="grid grid-2" style="gap: 10px; font-size: 13px;">
                    <div><span style="color: var(--text-muted);">IPv4:</span> <strong>${iface.ip}</strong></div>
                    <div><span style="color: var(--text-muted);">子网掩码:</span> <strong>${iface.mask}</strong></div>
                    <div><span style="color: var(--text-muted);">MAC:</span> <strong>${iface.mac}</strong></div>
                    <div><span style="color: var(--text-muted);">速率:</span> <strong>${iface.speed}</strong></div>
                    <div><span style="color: var(--text-muted);">接收:</span> <strong style="color: var(--success);">${iface.rx}</strong></div>
                    <div><span style="color: var(--text-muted);">发送:</span> <strong style="color: var(--primary);">${iface.tx}</strong></div>
                </div>
            </div>
        `).join('');
    }

    updateBandwidth() {
        const upload = (Utils.randomInRange(10, 50) / 10).toFixed(1);
        const download = (Utils.randomInRange(100, 200) / 10).toFixed(1);

        document.getElementById('uploadSpeed').textContent = `${upload} MB/s`;
        document.getElementById('downloadSpeed').textContent = `${download} MB/s`;
        document.getElementById('uploadBar').style.width = `${parseFloat(upload) * 10}%`;
        document.getElementById('downloadBar').style.width = `${Math.min(parseFloat(download), 100)}%`;
        document.getElementById('activeConnections').textContent = Utils.randomInRange(140, 180);
        document.getElementById('bandwidthUsage').textContent = `${Utils.randomInRange(35, 55)}%`;
    }

    searchConnections(term) {
        if (!term) {
            this.renderConnections();
            return;
        }
        const filtered = this.connections.filter(c =>
            c.local.includes(term) ||
            c.remote.includes(term) ||
            c.process.toLowerCase().includes(term.toLowerCase())
        );
        this.renderConnections(filtered);
    }

    filterByProtocol(protocol) {
        if (!protocol) {
            this.renderConnections();
            return;
        }
        const filtered = this.connections.filter(c => c.protocol === protocol);
        this.renderConnections(filtered);
    }

    filterByState(state) {
        if (!state) {
            this.renderConnections();
            return;
        }
        const filtered = this.connections.filter(c => c.state === state);
        this.renderConnections(filtered);
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            this.updateBandwidth();
        }, APP_CONFIG.refreshInterval.network);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        eventBus.off('network:refresh');
    }
}

let networkModule;
