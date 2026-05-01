class LogsModule {
    constructor() {
        this.logs = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.pageSize = 15;
        this.realtimeEnabled = false;
        this.autoScrollEnabled = true;
        this.logTypes = ['all', 'system', 'auth', 'security', 'application', 'network', 'kernel'];
        this.init();
    }

    init() {
        this.render();
        this.loadLogs();
        this.startRealtimeLogStream();
        eventBus.on('logs:refresh', () => this.loadLogs());
    }

    render() {
        const container = document.getElementById('page-logs');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>📝 日志审计中心 v3.1</h2>
                <div class="header-actions">
                    <button class="btn btn-outline" onclick="logsModule.toggleRealtimeStream()" id="realtimeToggleBtn">
                        ⚡ 实时日志
                    </button>
                    <button class="btn btn-outline" onclick="logsModule.showAdvancedFilterModal()">
                        🔍 高级筛选
                    </button>
                    <div class="dropdown" style="position: relative; display: inline-block;">
                        <button class="btn btn-primary" onclick="logsModule.toggleExportDropdown()">
                            📥 导出 ▼
                        </button>
                        <div id="exportDropdown" class="dropdown-menu" style="display: none;">
                            <a href="#" onclick="logsModule.exportLogs('json')">📄 导出为 JSON</a>
                            <a href="#" onclick="logsModule.exportLogs('csv')">📊 导出为 CSV</a>
                            <a href="#" onclick="logsModule.exportLogs('txt')">📝 导出为 TXT</a>
                            <a href="#" onclick="logsModule.showExportOptionsModal()">⚙️ 自定义导出...</a>
                        </div>
                    </div>
                    <button class="btn btn-outline" onclick="eventBus.emit('logs:refresh')">🔄 刷新</button>
                    <button class="btn btn-danger" onclick="logsModule.clearAllLogs()">🗑️ 清空日志</button>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-6" style="margin-bottom: 24px;">
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px;" id="totalLogs">0</div>
                    <div class="stat-label">总日志数</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--danger);" id="errorLogs">0</div>
                    <div class="stat-label">❌ ERROR</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--warning);" id="warningLogs">0</div>
                    <div class="stat-label">⚠️ WARNING</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--primary);" id="infoLogs">0</div>
                    <div class="stat-label">ℹ️ INFO</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--success);" id="debugLogs">0</div>
                    <div class="stat-label">🐛 DEBUG</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 26px; color: var(--info);" id="todayLogs">0</div>
                    <div class="stat-label">📅 今日新增</div>
                </div>
            </div>

            <!-- 实时状态指示器 -->
            ${this.renderRealtimeIndicator()}

            <!-- 日志类型标签页 -->
            <div class="tabs" style="margin-bottom: 20px;">
                <button class="tab active" onclick="logsModule.switchLogType('all', this)">全部</button>
                <button class="tab" onclick="logsModule.switchLogType('system', this)">💻 系统</button>
                <button class="tab" onclick="logsModule.switchLogType('auth', this)">🔐 认证</button>
                <button class="tab" onclick="logsModule.switchLogType('security', this)">🛡️ 安全</button>
                <button class="tab" onclick="logsModule.switchLogType('application', this)">📦 应用</button>
                <button class="tab" onclick="logsModule.switchLogType('network', this)">🌐 网络</button>
                <button class="tab" onclick="logsModule.switchLogType('kernel', this)">⚙️ 内核</button>
            </div>

            <!-- 主内容区 -->
            <div class="grid grid-3" style="gap: 20px;">
                <!-- 日志列表 -->
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">📋 日志列表</h3>
                        <div class="filter-bar" style="margin: 0; display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                            <input type="text" placeholder="🔍 搜索日志 (支持正则)..." 
                                   class="form-input" 
                                   style="max-width: 300px;" 
                                   id="logSearchInput"
                                   oninput="logsModule.searchLogs(this.value)">
                            <select class="form-select" style="width: auto; font-size: 13px;" onchange="logsModule.filterByLevel(this.value)" id="levelFilter">
                                <option value="">所有级别</option>
                                <option value="ERROR">🔴 ERROR</option>
                                <option value="WARNING">🟠 WARNING</option>
                                <option value="INFO">🔵 INFO</option>
                                <option value="DEBUG">🟢 DEBUG</option>
                            </select>
                            <input type="datetime-local" 
                                   class="form-input" 
                                   style="width: auto; font-size: 13px;" 
                                   id="dateFromFilter"
                                   placeholder="开始时间"
                                   onchange="logsModule.applyAdvancedFilters()">
                            <span style="color: var(--text-secondary);">至</span>
                            <input type="datetime-local" 
                                   class="form-input" 
                                   style="width: auto; font-size: 13px;"
                                   id="dateToFilter"
                                   placeholder="结束时间"
                                   onchange="logsModule.applyAdvancedFilters()">
                            <label class="checkbox-label" style="margin: 0; font-size: 13px;">
                                <input type="checkbox" id="autoScrollCheckbox" ${this.autoScrollEnabled ? 'checked' : ''} onchange="logsModule.toggleAutoScroll()">
                                自动滚动
                            </label>
                        </div>
                    </div>

                    <div class="table-container" id="logsTableContainer" style="max-height: 550px; overflow-y: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th width="170">时间</th>
                                    <th width="90">级别</th>
                                    <th width="100">来源</th>
                                    <th>消息内容</th>
                                    <th width="100">操作</th>
                                </tr>
                            </thead>
                            <tbody id="logsTableBody">
                            </tbody>
                        </table>
                    </div>

                    <!-- 分页 -->
                    <div id="logsPagination" class="pagination" style="padding: 16px; border-top: 1px solid var(--border-color);"></div>
                </div>

                <!-- 右侧面板 -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- 日志级别统计图 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📊 日志分布</h3>
                        </div>
                        <div style="height: 200px;">
                            <canvas id="logLevelChart"></canvas>
                        </div>
                    </div>

                    <!-- 来源统计 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🎯 来源统计 TOP 5</h3>
                        </div>
                        <div id="sourceStats" style="padding: 12px 0;"></div>
                    </div>

                    <!-- 快速操作 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">⚡ 快速操作</h3>
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 10px; padding: 8px 0;">
                            <button class="btn btn-outline btn-sm" onclick="logsModule.showErrorOnly()" style="width: 100%;">
                                🔴 仅显示错误
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="logsModule.showLastHour()" style="width: 100%;">
                                🕐 最近1小时
                            </button>
                            <button class="btn btn-outline btn-sm" onclick="logsModule.showLast24Hours()" style="width: 100%;">
                                📅 最近24小时
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="logsModule.clearErrorLogs()" style="width: 100%;">
                                🗑️ 清除错误日志
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRealtimeIndicator() {
        return `
            <div class="realtime-indicator ${this.realtimeEnabled ? 'active' : ''}" id="realtimeIndicator" style="
                background: ${this.realtimeEnabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)'};
                border: 1px solid ${this.realtimeEnabled ? 'var(--success)' : 'var(--border-color)'};
                padding: 12px 20px;
                border-radius: var(--radius-md);
                margin-bottom: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span class="status-badge ${this.realtimeEnabled ? 'success pulse' : 'default'}">
                        ${this.realtimeEnabled ? '● LIVE' : '○ PAUSED'}
                    </span>
                    <span style="font-size: 14px; color: var(--text-primary);">
                        ${this.realtimeEnabled ? '实时日志流已启用 - 自动接收新日志' : '实时日志流已暂停 - 点击上方按钮启动'}
                    </span>
                </div>
                <div style="font-size: 13px; color: var(--text-secondary);">
                    更新频率: <strong>2秒/次</strong> · 
                    缓冲区大小: <strong id="bufferSize">0</strong> 条
                </div>
            </div>
        `;
    }

    loadLogs() {
        const baseTime = new Date('2026-05-01T14:00:00');
        
        this.logs = [
            { time: '2026-05-01 14:35:22.456', level: 'ERROR', source: 'auth', message: 'Failed login attempt for user root from 192.168.1.105 - Invalid password (Attempt 47/50)', details: { ip: '192.168.1.105', user: 'root', attempts: 47, maxAttempts: 50 } },
            { time: '2026-05-01 14:34:18.123', level: 'WARNING', source: 'security', message: 'Potential brute force attack detected - IP: 203.0.113.50 (15 attempts in 60s)', details: { attackerIP: '203.0.113.50', attempts: 15, window: '60s', action: 'monitoring' } },
            { time: '2026-05-01 14:33:45.789', level: 'INFO', source: 'system', message: 'System update completed successfully - Package: linux-image-5.15.0-generic (5.15.0-106-generic)', details: { package: 'linux-image', version: '5.15.0-106', status: 'success' } },
            { time: '2026-05-01 14:32:11.234', level: 'ERROR', source: 'application', message: 'Database connection timeout - Host: db.internal.local:3306 - Retry attempt 3/5', details: { host: 'db.internal.local', port: 3306, retryCount: 3, maxRetries: 5, timeout: '30s' } },
            { time: '2026-05-01 14:31:08.567', level: 'WARNING', source: 'system', message: 'Disk usage critical - /dev/sda1 at 92% capacity (8.2TB / 9TB used)', details: { device: '/dev/sda1', total: '9TB', used: '8.2TB', percent: 92 } },
            { time: '2026-05-01 14:30:33.890', level: 'INFO', source: 'auth', message: 'User admin logged in from 192.168.1.100 via SSH - Session ID: ssh-abc123xyz', details: { user: 'admin', ip: '192.168.1.100', method: 'SSH', sessionId: 'ssh-abc123xyz' } },
            { time: '2026-05-01 14:29:55.112', level: 'ERROR', source: 'security', message: 'Intrusion detection alert - Port scan detected from 198.51.100.23 (Scanned ports: 22,80,443,3306,8080)', details: { scannerIP: '198.51.100.23', scannedPorts: [22, 80, 443, 3306, 8080], technique: 'SYN Scan' } },
            { time: '2026-05-01 14:28:42.345', level: 'DEBUG', source: 'application', message: 'API request processed - GET /api/users?page=1&limit=20 - Response time: 145ms | Status: 200', details: { method: 'GET', endpoint: '/api/users', params: { page: 1, limit: 20 }, responseTime: '145ms', status: 200 } },
            { time: '2026-05-01 14:27:19.678', level: 'INFO', source: 'system', message: 'Cron job executed successfully - Task: /etc/cron.daily/backup - Duration: 4m32s', details: { task: '/etc/cron.daily/backup', duration: '4m32s', outputSize: '2.3GB' } },
            { time: '2026-05-01 14:26:05.901', level: 'WARNING', source: 'application', message: 'High memory usage detected - Process nginx (PID: 12345) using 512MB / 1GB limit', details: { process: 'nginx', pid: 12345, memoryUsed: '512MB', memoryLimit: '1GB', percent: 51 } },
            { time: '2026-05-01 14:25:38.234', level: 'ERROR', source: 'kernel', message: 'Kernel OOM killer activated - Victim process: java (PID: 6789) - Memory pressure: critical', details: { victimProcess: 'java', pid: 6789, oomScore: 987, memoryRequested: '4GB', availableMemory: '512MB' } },
            { time: '2026-05-01 14:24:21.567', level: 'INFO', source: 'security', message: 'Firewall rule updated - Added rule #156 to block malicious IP: 185.220.101.0/24', details: { ruleId: 156, action: 'BLOCK', targetIP: '185.220.101.0/24', reason: 'malicious_activity' } },
            { time: '2026-05-01 14:23:54.890', level: 'WARNING', source: 'auth', message: 'SSH key authentication failed for user backup - Reason: Invalid key fingerprint', details: { user: 'backup', authMethod: 'SSH Key', reason: 'Invalid key fingerprint', keyType: 'ED25519' } },
            { time: '2026-05-01 14:22:37.123', level: 'ERROR', source: 'application', message: 'Uncaught exception in module payment-service - Error: NullPointerException at PaymentService.processOrder():142', details: { module: 'payment-service', exception: 'NullPointerException', line: 142, stackTrace: '...' } },
            { time: '2026-05-01 14:21:10.456', level: 'INFO', source: 'network', message: 'Network interface eth0 reconnected - Speed: 1Gbps Full-Duplex - Link detected', details: { interface: 'eth0', speed: '1Gbps', duplex: 'Full', status: 'UP' } },
            { time: '2026-05-01 14:20:43.789', level: 'DEBUG', source: 'application', message: 'Cache invalidation triggered - Key: user_session:* - Pattern matched: 1,247 keys removed', details: { pattern: 'user_session:*', keysRemoved: 1247, duration: '23ms', cacheEngine: 'Redis' } }
        ];

        this.filteredLogs = [...this.logs];
        this.renderLogs();
        this.updateStats();
        this.initLevelChart();
        this.updateSourceStats();
    }

    renderLogs(logsToRender = null) {
        const logs = logsToRender || this.filteredLogs;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedLogs = logs.slice(start, end);

        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;

        if (paginatedLogs.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 48px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                        <div>暂无匹配的日志记录</div>
                        <div style="font-size: 14px; margin-top: 8px;">尝试调整筛选条件或清空过滤器</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = paginatedLogs.map(log => {
            const searchTerm = document.getElementById('logSearchInput')?.value || '';
            let highlightedMessage = log.message;
            
            if (searchTerm && searchTerm.length > 1) {
                try {
                    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                    highlightedMessage = log.message.replace(regex, '<mark style="background: #fbbf24; color: #000; padding: 1px 2px; border-radius: 2px;">$1</mark>');
                } catch (e) {
                    highlightedMessage = log.message;
                }
            }

            return `
                <tr class="${log.level === 'ERROR' ? 'log-error-row' : ''}" data-level="${log.level}">
                    <td><code style="font-size: 11px;">${log.time}</code></td>
                    <td>
                        <span class="status-badge ${
                            log.level === 'ERROR' ? 'danger' :
                            log.level === 'WARNING' ? 'warning' :
                            log.level === 'INFO' ? 'info' : 'default'
                        }" style="font-size: 11px;">
                            ${log.level}
                        </span>
                    </td>
                    <td><code style="font-size: 12px;">${log.source}</code></td>
                    <td style="max-width: 450px; font-size: 13px; line-height: 1.5;">
                        <div style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.message}">
                            ${highlightedMessage}
                        </div>
                    </td>
                    <td>
                        <div class="btn-group">
                            <button class="btn btn-xs btn-outline" onclick="logsModule.viewLogDetail('${log.time}')" title="详情">👁️</button>
                            <button class="btn btn-xs btn-primary" onclick="logsModule.copyLog('${log.time}')" title="复制">📋</button>
                            ${log.level === 'ERROR' ? `<button class="btn btn-xs btn-warning" onclick="logsModule.reportIssue('${log.time}')" title="上报问题">🐛</button>` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        this.renderPagination(logs.length);

        if (this.autoScrollEnabled && this.realtimeEnabled) {
            const container = document.getElementById('logsTableContainer');
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }

        const bufferSizeEl = document.getElementById('bufferSize');
        if (bufferSizeEl) {
            bufferSizeEl.textContent = logs.length;
        }
    }

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        const container = document.getElementById('logsPagination');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-secondary);">
                    <span>显示 <strong>${totalItems}</strong> 条日志</span>
                    <span>第 <strong>${this.currentPage}</strong> 页，共 <strong>${totalPages || 1}</strong> 页</span>
                </div>
            `;
            return;
        }

        let html = '<div style="display: flex; justify-content: space-between; align-items: center; gap: 16px;">';
        
        html += `<div style="font-size: 13px; color: var(--text-secondary);">共 <strong>${totalItems}</strong> 条记录</div>`;
        
        html += '<div style="display: flex; gap: 8px; align-items: center;">';
        
        html += `<button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="logsModule.goToPage(${this.currentPage - 1})">« 上一页</button>`;
        
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            html += `<button class="pagination-btn" onclick="logsModule.goToPage(1)">1</button>`;
            if (startPage > 2) html += `<span style="color: var(--text-muted);">...</span>`;
        }
        
        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="logsModule.goToPage(${i})">${i}</button>`;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span style="color: var(--text-muted);">...</span>`;
            html += `<button class="pagination-btn" onclick="logsModule.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        html += `<button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="logsModule.goToPage(${this.currentPage + 1})">下一页 »</button>`;
        
        html += '</div></div>';
        
        container.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredLogs.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderLogs();
        }
    }

    updateStats() {
        document.getElementById('totalLogs').textContent = this.logs.length;
        document.getElementById('errorLogs').textContent = this.logs.filter(l => l.level === 'ERROR').length;
        document.getElementById('warningLogs').textContent = this.logs.filter(l => l.level === 'WARNING').length;
        document.getElementById('infoLogs').textContent = this.logs.filter(l => l.level === 'INFO').length;
        document.getElementById('debugLogs').textContent = this.logs.filter(l => l.level === 'DEBUG').length;
        document.getElementById('todayLogs').textContent = Utils.randomInRange(800, 1200);
    }

    initLevelChart() {
        const ctx = document.getElementById('logLevelChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.levelChart) {
            this.levelChart.destroy();
        }

        const levelCounts = {
            ERROR: this.logs.filter(l => l.level === 'ERROR').length,
            WARNING: this.logs.filter(l => l.level === 'WARNING').length,
            INFO: this.logs.filter(l => l.level === 'INFO').length,
            DEBUG: this.logs.filter(l => l.level === 'DEBUG').length
        };

        this.levelChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['ERROR', 'WARNING', 'INFO', 'DEBUG'],
                datasets: [{
                    data: [levelCounts.ERROR, levelCounts.WARNING, levelCounts.INFO, levelCounts.DEBUG],
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { font: { size: 11 }, padding: 8 }
                    }
                }
            }
        });
    }

    updateSourceStats() {
        const container = document.getElementById('sourceStats');
        if (!container) return;

        const sourceCounts = {};
        this.logs.forEach(log => {
            sourceCounts[log.source] = (sourceCounts[log.source] || 0) + 1;
        });

        const sortedSources = Object.entries(sourceCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);

        const total = this.logs.length;

        container.innerHTML = sortedSources.map(([source, count], index) => {
            const percent = ((count / total) * 100).toFixed(1);
            const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'];
            
            return `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px;">
                        <span><strong>${source}</strong></span>
                        <span style="color: var(--text-secondary);">${count} (${percent}%)</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percent}%; background: ${colors[index]};"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    switchLogType(type, element) {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        element?.classList.add('active');

        if (type === 'all') {
            this.filteredLogs = [...this.logs];
        } else {
            this.filteredLogs = this.logs.filter(l => l.source === type);
        }

        this.currentPage = 1;
        this.renderLogs();
        Utils.showToast(`已切换到: ${type === 'all' ? '全部日志' : type + ' 日志'} (${this.filteredLogs.length}条)`, 'info');
    }

    searchLogs(term) {
        clearTimeout(this.searchTimeout);
        
        this.searchTimeout = setTimeout(() => {
            if (!term || term.trim() === '') {
                this.applyAdvancedFilters();
                return;
            }

            try {
                const regex = new RegExp(term, 'i');
                this.filteredLogs = this.logs.filter(log =>
                    regex.test(log.message) ||
                    regex.test(log.source) ||
                    regex.test(log.level)
                );
            } catch (e) {
                this.filteredLogs = this.logs.filter(log =>
                    log.message.toLowerCase().includes(term.toLowerCase()) ||
                    log.source.toLowerCase().includes(term.toLowerCase())
                );
            }

            this.currentPage = 1;
            this.renderLogs();
        }, 300);
    }

    filterByLevel(level) {
        this.applyAdvancedFilters();
    }

    applyAdvancedFilters() {
        const searchTerm = document.getElementById('logSearchInput')?.value || '';
        const levelFilter = document.getElementById('levelFilter')?.value || '';
        const dateFrom = document.getElementById('dateFromFilter')?.value || '';
        const dateTo = document.getElementById('dateToFilter')?.value || '';

        this.filteredLogs = this.logs.filter(log => {
            let matches = true;

            if (searchTerm.trim()) {
                try {
                    const regex = new RegExp(searchTerm, 'i');
                    matches = matches && (regex.test(log.message) || regex.test(log.source));
                } catch (e) {
                    matches = matches && (
                        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        log.source.toLowerCase().includes(searchTerm.toLowerCase())
                    );
                }
            }

            if (levelFilter) {
                matches = matches && log.level === levelFilter;
            }

            if (dateFrom) {
                matches = matches && log.time >= dateFrom.replace('T', ' ');
            }

            if (dateTo) {
                matches = matches && log.time <= dateTo.replace('T', ' ') + ':59';
            }

            return matches;
        });

        this.currentPage = 1;
        this.renderLogs();
    }

    toggleRealtimeStream() {
        this.realtimeEnabled = !this.realtimeEnabled;
        
        const btn = document.getElementById('realtimeToggleBtn');
        const indicator = document.getElementById('realtimeIndicator');
        
        if (btn) {
            btn.className = `btn ${this.realtimeEnabled ? 'btn-success' : 'btn-outline'}`;
            btn.innerHTML = this.realtimeEnabled ? '⏸️ 暂停实时' : '⚡ 实时日志';
        }

        if (indicator) {
            indicator.outerHTML = this.renderRealtimeIndicator();
        }

        Utils.showToast(
            this.realtimeEnabled ? '✅ 实时日志流已启动' : '⏸️ 实时日志流已暂停',
            this.realtimeEnabled ? 'success' : 'info'
        );
    }

    toggleAutoScroll() {
        this.autoScrollEnabled = !this.autoScrollEnabled;
        Utils.showToast(
            this.autoScrollEnabled ? '自动滚动已启用' : '自动滚动已禁用',
            'info'
        );
    }

    startRealtimeLogStream() {
        setInterval(() => {
            if (!this.realtimeEnabled) return;

            const levels = ['INFO', 'WARNING', 'ERROR', 'DEBUG'];
            const sources = ['system', 'auth', 'security', 'application', 'network', 'kernel'];
            
            const messages = [
                'Connection established from {ip}',
                'Request processed in {time}ms',
                'Cache hit ratio: {percent}%',
                'Memory usage: {memory}MB',
                'Disk I/O: {ops} ops/sec',
                'Active connections: {count}'
            ];

            const newLog = {
                time: new Date().toISOString().replace('T', ' ').substring(0, 23),
                level: levels[Math.floor(Math.random() * levels.length)],
                source: sources[Math.floor(Math.random() * sources.length)],
                message: messages[Math.floor(Math.random() * messages.length)]
                    .replace('{ip}', `${Utils.randomInRange(1, 255)}.${Utils.randomInRange(1, 255)}.${Utils.randomInRange(1, 255)}.${Utils.randomInRange(1, 255)}`)
                    .replace('{time}', Utils.randomInRange(10, 500))
                    .replace('{percent}', Utils.randomInRange(70, 99))
                    .replace('{memory}', Utils.randomInRange(100, 800))
                    .replace('{ops}', Utils.randomInRange(100, 5000))
                    .replace('{count}', Utils.randomInRange(50, 500))
            };

            this.logs.unshift(newLog);
            
            if (this.logs.length > 1000) {
                this.logs = this.logs.slice(0, 1000);
            }

            this.applyAdvancedFilters();
            this.updateStats();

        }, 2000);
    }

    viewLogDetail(time) {
        const log = this.logs.find(l => l.time.startsWith(time));
        if (!log) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">📋 日志详细信息</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-2" style="gap: 20px; margin-bottom: 24px;">
                        <div class="info-item">
                            <label>时间戳</label>
                            <value><code>${log.time}</code></value>
                        </div>
                        <div class="info-item">
                            <label>日志级别</label>
                            <value><span class="status-badge ${log.level === 'ERROR' ? 'danger' : log.level === 'WARNING' ? 'warning' : 'info'}">${log.level}</span></value>
                        </div>
                        <div class="info-item">
                            <label>来源模块</label>
                            <value><strong>${log.source}</strong></value>
                        </div>
                        <div class="info-item">
                            <label>严重程度</label>
                            <value>${log.level === 'ERROR' ? '🔴 高' : log.level === 'WARNING' ? '🟠 中' : '🔵 低'}</value>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 12px; color: var(--primary);">消息内容</h4>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 13px; line-height: 1.6; margin-bottom: 24px; word-break: break-all;">
                        ${log.message}
                    </div>

                    ${log.details ? `
                        <h4 style="margin-bottom: 12px; color: var(--primary);">详细数据</h4>
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 12px; overflow-x: auto;">
                            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">${JSON.stringify(log.details, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="navigator.clipboard.writeText(\`${log.time} [${log.level}] ${log.source}: ${log.message}\`); Utils.showToast('已复制到剪贴板', 'success')">
                        📋 复制完整日志
                    </button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    copyLog(time) {
        const log = this.logs.find(l => l.time.startsWith(time));
        if (log) {
            navigator.clipboard.writeText(`${log.time} [${log.level}] ${log.source}: ${log.message}`);
            Utils.showToast('日志已复制到剪贴板', 'success');
        }
    }

    reportIssue(time) {
        const log = this.logs.find(l => l.time.startsWith(time));
        if (log) {
            Utils.showToast(`错误日志已上报到工单系统: ${log.time}`, 'info');
        }
    }

    showErrorOnly() {
        document.getElementById('levelFilter').value = 'ERROR';
        this.applyAdvancedFilters();
        Utils.showToast('仅显示错误级别的日志', 'info');
    }

    showLastHour() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        document.getElementById('dateFromFilter').value = oneHourAgo.toISOString().slice(0, 16);
        this.applyAdvancedFilters();
        Utils.showToast('显示最近1小时的日志', 'info');
    }

    showLast24Hours() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        document.getElementById('dateFromFilter').value = oneDayAgo.toISOString().slice(0, 16);
        this.applyAdvancedFilters();
        Utils.showToast('显示最近24小时的日志', 'info');
    }

    clearErrorLogs() {
        if (confirm('确定要清除所有错误级别的日志吗？此操作不可恢复！')) {
            const errorCount = this.logs.filter(l => l.level === 'ERROR').length;
            this.logs = this.logs.filter(l => l.level !== 'ERROR');
            this.applyAdvancedFilters();
            this.updateStats();
            this.initLevelChart();
            this.updateSourceStats();
            Utils.showToast(`已清除 ${errorCount} 条错误日志`, 'warning');
        }
    }

    clearAllLogs() {
        if (confirm('⚠️ 确定要清空所有日志吗？\n\n这将删除所有日志记录且无法恢复！')) {
            this.logs = [];
            this.filteredLogs = [];
            this.currentPage = 1;
            this.renderLogs();
            this.updateStats();
            this.initLevelChart();
            this.updateSourceStats();
            Utils.showToast('所有日志已被清除', 'warning');
        }
    }

    showAdvancedFilterModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">🔍 高级筛选器</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">关键词搜索 (支持正则表达式)</label>
                        <input type="text" class="form-input" id="advSearchKeyword" placeholder='例如: error|timeout|failed 或使用正则: /(error|warning)/gi'>
                    </div>
                    
                    <div class="grid grid-2" style="gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">日志级别 (可多选)</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label class="checkbox-label"><input type="checkbox" name="advLevel" value="ERROR" checked> 🔴 ERROR</label>
                                <label class="checkbox-label"><input type="checkbox" name="advLevel" value="WARNING" checked> 🟠 WARNING</label>
                                <label class="checkbox-label"><input type="checkbox" name="advLevel" value="INFO" checked> 🔵 INFO</label>
                                <label class="checkbox-label"><input type="checkbox" name="advLevel" value="DEBUG"> 🟢 DEBUG</label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">来源模块 (可多选)</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                <label class="checkbox-label"><input type="checkbox" name="advSource" value="system" checked> 💻 系统</label>
                                <label class="checkbox-label"><input type="checkbox" name="advSource" value="auth" checked> 🔐 认证</label>
                                <label class="checkbox-label"><input type="checkbox" name="advSource" value="security" checked> 🛡️ 安全</label>
                                <label class="checkbox-label"><input type="checkbox" name="advSource" value="application" checked> 📦 应用</label>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">时间范围</label>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <input type="datetime-local" class="form-input" id="advDateFrom" style="flex: 1;">
                            <span>至</span>
                            <input type="datetime-local" class="form-input" id="advDateTo" style="flex: 1;">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">快速预设</label>
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button class="btn btn-sm btn-outline" onclick="document.getElementById('advDateFrom').value = ''; document.getElementById('advDateTo').value = '';">全部时间</button>
                            <button class="btn btn-sm btn-outline" onclick="logsModule.setPresetTime('1h')">最近1小时</button>
                            <button class="btn btn-sm btn-outline" onclick="logsModule.setPresetTime('6h')">最近6小时</button>
                            <button class="btn btn-sm btn-outline" onclick="logsModule.setPresetTime('24h')">最近24小时</button>
                            <button class="btn btn-sm btn-outline" onclick="logsModule.setPresetTime('7d')">最近7天</button>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="logsModule.resetAdvancedFilters()">重置</button>
                    <button class="btn btn-primary" onclick="logsModule.applyAdvancedFilterModal()">应用筛选</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    setPresetTime(preset) {
        const now = new Date();
        let from;

        switch (preset) {
            case '1h': from = new Date(now.getTime() - 60 * 60 * 1000); break;
            case '6h': from = new Date(now.getTime() - 6 * 60 * 60 * 1000); break;
            case '24h': from = new Date(now.getTime() - 24 * 60 * 60 * 1000); break;
            case '7d': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        }

        const fromInput = document.getElementById('advDateFrom');
        if (fromInput && from) {
            fromInput.value = from.toISOString().slice(0, 16);
        }
    }

    resetAdvancedFilters() {
        document.getElementById('advSearchKeyword').value = '';
        document.querySelectorAll('input[name="advLevel"]').forEach(cb => cb.checked = true);
        document.querySelectorAll('input[name="advSource"]').forEach(cb => cb.checked = true);
        document.getElementById('advDateFrom').value = '';
        document.getElementById('advDateTo').value = '';
        Utils.showToast('筛选条件已重置', 'info');
    }

    applyAdvancedFilterModal() {
        const keyword = document.getElementById('advSearchKeyword')?.value || '';
        const levels = Array.from(document.querySelectorAll('input[name="advLevel"]:checked')).map(cb => cb.value);
        const sources = Array.from(document.querySelectorAll('input[name="advSource"]:checked')).map(cb => cb.value);
        const dateFrom = document.getElementById('advDateFrom')?.value || '';
        const dateTo = document.getElementById('advDateTo')?.value || '';

        this.filteredLogs = this.logs.filter(log => {
            let matches = true;

            if (keyword.trim()) {
                try {
                    const regex = new RegExp(keyword, 'i');
                    matches = matches && regex.test(log.message);
                } catch (e) {
                    matches = matches && log.message.toLowerCase().includes(keyword.toLowerCase());
                }
            }

            if (levels.length > 0) {
                matches = matches && levels.includes(log.level);
            }

            if (sources.length > 0) {
                matches = matches && sources.includes(log.source);
            }

            if (dateFrom) {
                matches = matches && log.time >= dateFrom.replace('T', ' ');
            }

            if (dateTo) {
                matches = matches && log.time <= dateTo.replace('T', ' ') + ':59';
            }

            return matches;
        });

        document.querySelector('.modal-overlay').remove();

        document.getElementById('logSearchInput').value = keyword;
        document.getElementById('levelFilter').value = levels.length === 1 ? levels[0] : '';
        document.getElementById('dateFromFilter').value = dateFrom;
        document.getElementById('dateToFilter').value = dateTo;

        this.currentPage = 1;
        this.renderLogs();
        Utils.showToast(`筛选完成：找到 ${this.filteredLogs.length} 条匹配日志`, 'success');
    }

    toggleExportDropdown() {
        const dropdown = document.getElementById('exportDropdown');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    }

    showExportOptionsModal() {
        this.toggleExportDropdown();

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📥 自定义导出选项</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">导出格式</label>
                        <select class="form-select" id="exportFormat">
                            <option value="json">JSON (.json)</option>
                            <option value="csv">CSV (.csv)</option>
                            <option value="txt">纯文本 (.txt)</option>
                            <option value="html">HTML报告 (.html)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">导出范围</label>
                        <select class="form-select" id="exportRange">
                            <option value="filtered">当前筛选结果 (${this.filteredLogs.length} 条)</option>
                            <option value="all">全部日志 (${this.logs.length} 条)</option>
                            <option value="errors">仅错误日志 (${this.logs.filter(l => l.level === 'ERROR').length} 条)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">包含字段</label>
                        <div style="display: flex; flex-direction: column; gap: 8px;">
                            <label class="checkbox-label"><input type="checkbox" checked name="exportFields" value="time"> 时间戳</label>
                            <label class="checkbox-label"><input type="checkbox" checked name="exportFields" value="level"> 日志级别</label>
                            <label class="checkbox-label"><input type="checkbox" checked name="exportFields" value="source"> 来源模块</label>
                            <label class="checkbox-label"><input type="checkbox" checked name="exportFields" value="message"> 消息内容</label>
                            <label class="checkbox-label"><input type="checkbox" name="exportFields" value="details"> 详细数据</label>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="includeHeader"> 包含文件头信息（时间、统计等）
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="logsModule.executeCustomExport()">开始导出</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    executeCustomExport() {
        const format = document.getElementById('exportFormat').value;
        const range = document.getElementById('exportRange').value;
        const includeHeader = document.getElementById('includeHeader').checked;
        const fields = Array.from(document.querySelectorAll('input[name="exportFields"]:checked')).map(cb => cb.value);

        let exportData;
        
        switch (range) {
            case 'filtered':
                exportData = this.filteredLogs;
                break;
            case 'errors':
                exportData = this.logs.filter(l => l.level === 'ERROR');
                break;
            default:
                exportData = this.logs;
        }

        const processedData = exportData.map(log => {
            const item = {};
            fields.forEach(field => {
                if (log[field] !== undefined) {
                    item[field] = log[field];
                }
            });
            return item;
        });

        let content;
        let filename;
        let mimeType;

        switch (format) {
            case 'json':
                content = includeHeader ? JSON.stringify({
                    exportedAt: new Date().toISOString(),
                    totalRecords: processedData.length,
                    records: processedData
                }, null, 2) : JSON.stringify(processedData, null, 2);
                filename = `logs-export-${new Date().toISOString().split('T')[0]}.json`;
                mimeType = 'application/json';
                break;

            case 'csv':
                const headers = fields.join(',');
                const rows = processedData.map(log => 
                    fields.map(field => `"${(log[field] || '').toString().replace(/"/g, '""')}"`).join(',')
                );
                content = [headers, ...rows].join('\n');
                filename = `logs-export-${new Date().toISOString().split('T')[0]}.csv`;
                mimeType = 'text/csv';
                break;

            case 'txt':
                content = processedData.map(log => 
                    `${log.time || ''} [${log.level || ''}] ${log.source || ''}: ${log.message || ''}`
                ).join('\n');
                filename = `logs-export-${new Date().toISOString().split('T')[0]}.txt`;
                mimeType = 'text/plain';
                break;

            case 'html':
                content = this.generateHTMLReport(processedData, includeHeader);
                filename = `logs-report-${new Date().toISOString().split('T')[0]}.html`;
                mimeType = 'text/html';
                break;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);

        document.querySelector('.modal-overlay').remove();
        Utils.showToast(`成功导出 ${processedData.length} 条日志到 ${filename}`, 'success');
    }

    generateHTMLReport(data, includeHeader) {
        const stats = {
            total: data.length,
            errors: data.filter(l => l.level === 'ERROR').length,
            warnings: data.filter(l => l.level === 'WARNING').length,
            info: data.filter(l => l.level === 'INFO').length,
            debug: data.filter(l => l.level === 'DEBUG').length
        };

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <title>日志导出报告</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
        .warning { color: #ffc107; }
        .info { color: #17a2b8; }
        .debug { color: #28a745; }
        .stats { display: flex; gap: 20px; margin: 20px 0; }
        .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <h1>📝 日志审计报告</h1>
    ${includeHeader ? `
    <p>生成时间: ${new Date().toLocaleString()}</p>
    <div class="stats">
        <div class="stat-card"><strong>总计:</strong> ${stats.total}</div>
        <div class="stat-card"><strong class="error">ERROR:</strong> ${stats.errors}</div>
        <div class="stat-card"><strong class="warning">WARNING:</strong> ${stats.warnings}</div>
        <div class="stat-card"><strong class="info">INFO:</strong> ${stats.info}</div>
        <div class="stat-card"><strong class="debug">DEBUG:</strong> ${stats.debug}</div>
    </div>
    ` : ''}
    <table>
        <thead>
            <tr>
                <th>时间</th>
                <th>级别</th>
                <th>来源</th>
                <th>消息</th>
            </tr>
        </thead>
        <tbody>
            ${data.map(log => `
                <tr>
                    <td>${log.time || '-'}</td>
                    <td class="${log.level?.toLowerCase()}">${log.level || '-'}</td>
                    <td>${log.source || '-'}</td>
                    <td>${log.message || '-'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
    }

    exportLogs(format) {
        this.toggleExportDropdown();
        
        const formats = {
            json: { ext: '.json', mime: 'application/json' },
            csv: { ext: '.csv', mime: 'text/csv' },
            txt: { ext: '.txt', mime: 'text/plain' }
        };

        const config = formats[format];

        let content;
        
        if (format === 'json') {
            content = JSON.stringify(this.filteredLogs.length > 0 ? this.filteredLogs : this.logs, null, 2);
        } else if (format === 'csv') {
            const headers = '时间,级别,来源,消息\n';
            const rows = (this.filteredLogs.length > 0 ? this.filteredLogs : this.logs)
                .map(log => `${log.time},${log.level},${log.source},"${log.message.replace(/"/g, '""')}"`)
                .join('\n');
            content = headers + rows;
        } else {
            content = (this.filteredLogs.length > 0 ? this.filteredLogs : this.logs)
                .map(log => `[${log.time}] [${log.level}] [${log.source}] ${log.message}`)
                .join('\n');
        }

        const blob = new Blob([content], { type: config.mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `system-logs-${new Date().toISOString().split('T')[0]}${config.ext}`;
        a.click();
        URL.revokeObjectURL(url);

        const count = this.filteredLogs.length > 0 ? this.filteredLogs.length : this.logs.length;
        Utils.showToast(`成功导出 ${count} 条日志`, 'success');
    }

    destroy() {
        eventBus.off('logs:refresh');
        if (this.levelChart) {
            this.levelChart.destroy();
        }
    }
}

let logsModule;
