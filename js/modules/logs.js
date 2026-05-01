class LogsModule {
    constructor() {
        this.logs = [];
        this.currentPage = 1;
        this.pageSize = 10;
        this.init();
    }

    init() {
        this.render();
        this.loadLogs();
        eventBus.on('logs:refresh', () => this.loadLogs());
    }

    render() {
        const container = document.getElementById('page-logs');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>📝 日志审计</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="logsModule.exportLogs()">📥 导出日志</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('logs:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalLogs">0</div>
                    <div class="stat-label">总日志条数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="errorLogs">0</div>
                    <div class="stat-label">错误日志</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="warningLogs">0</div>
                    <div class="stat-label">警告日志</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="todayLogs">0</div>
                    <div class="stat-label">今日新增</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="logsModule.switchLogType('all', this)">全部日志</button>
                <button class="tab" onclick="logsModule.switchLogType('system', this)">系统日志</button>
                <button class="tab" onclick="logsModule.switchLogType('auth', this)">认证日志</button>
                <button class="tab" onclick="logsModule.switchLogType('security', this)">安全日志</button>
                <button class="tab" onclick="logsModule.switchLogType('application', this)">应用日志</button>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📋 日志列表</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <input type="text" placeholder="搜索日志内容..." class="form-input" style="max-width: 350px;" oninput="logsModule.searchLogs(this.value)">
                        <select class="form-select" style="width: auto;" onchange="logsModule.filterByLevel(this.value)">
                            <option value="">所有级别</option>
                            <option value="ERROR">ERROR</option>
                            <option value="WARNING">WARNING</option>
                            <option value="INFO">INFO</option>
                            <option value="DEBUG">DEBUG</option>
                        </select>
                        <input type="datetime-local" class="form-input" style="width: auto;" onchange="logsModule.filterByDate(this.value)">
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>级别</th>
                                <th>来源</th>
                                <th>消息内容</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="logsTableBody">
                        </tbody>
                    </table>
                </div>
                <div id="logsPagination" class="pagination"></div>
            </div>
        `;
    }

    loadLogs() {
        this.logs = [
            { time: '2026-05-01 14:35:22', level: 'ERROR', source: 'auth', message: 'Failed login attempt for user root from 192.168.1.105 - Invalid password' },
            { time: '2026-05-01 14:34:18', level: 'WARNING', source: 'security', message: 'Potential brute force attack detected - IP: 203.0.113.50 (15 attempts in 60s)' },
            { time: '2026-05-01 14:33:45', level: 'INFO', source: 'system', message: 'System update completed successfully - Package: linux-image-5.15.0' },
            { time: '2026-05-01 14:32:11', level: 'ERROR', source: 'application', message: 'Database connection timeout - Retry attempt 3/5' },
            { time: '2026-05-01 14:31:08', level: 'WARNING', source: 'system', message: 'Disk usage critical - /dev/sda1 at 92% capacity' },
            { time: '2026-05-01 14:30:33', level: 'INFO', source: 'auth', message: 'User admin logged in from 192.168.1.100 via SSH' },
            { time: '2026-05-01 14:29:55', level: 'ERROR', source: 'security', message: 'Intrusion detection alert - Port scan detected from 198.51.100.23' },
            { time: '2026-05-01 14:28:42', level: 'DEBUG', source: 'application', message: 'API request processed - GET /api/users - Response time: 145ms' },
            { time: '2026-05-01 14:27:19', level: 'INFO', source: 'system', message: 'Cron job executed - Backup task completed successfully' },
            { time: '2026-05-01 14:26:05', level: 'WARNING', source: 'application', message: 'High memory usage detected - Process nginx using 512MB' },
            { time: '2026-05-01 14:25:38', level: 'ERROR', source: 'system', message: 'Kernel panic avoided - OOM killer activated for process java' },
            { time: '2026-05-01 14:24:21', level: 'INFO', source: 'security', message: 'Firewall rule updated - Added rule #156 to block malicious IP' },
            { time: '2026-05-01 14:23:54', level: 'WARNING', source: 'auth', message: 'SSH key authentication failed for user backup' },
            { time: '2026-05-01 14:22:37', level: 'ERROR', source: 'application', message: 'Uncaught exception in module payment-service - NullPointerException' },
            { time: '2026-05-01 14:21:10', level: 'INFO', source: 'system', message: 'Network interface eth0 reconnected - Speed: 1Gbps' }
        ];

        this.renderLogs();
        this.updateStats();
    }

    renderLogs(filteredLogs = null) {
        const logs = filteredLogs || this.logs;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const paginatedLogs = logs.slice(start, end);

        const tbody = document.getElementById('logsTableBody');
        if (!tbody) return;

        tbody.innerHTML = paginatedLogs.map(log => `
            <tr>
                <td><code style="font-size: 12px;">${log.time}</code></td>
                <td>
                    <span class="status-badge ${
                        log.level === 'ERROR' ? 'danger' :
                        log.level === 'WARNING' ? 'warning' :
                        log.level === 'INFO' ? 'info' : 'default'
                    }">${log.level}</span>
                </td>
                <td><strong>${log.source}</strong></td>
                <td style="max-width: 500px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${log.message}">
                    ${log.message}
                </td>
                <td>
                    <button class="btn btn-sm btn-outline" onclick="logsModule.viewLogDetail('${log.time}')">详情</button>
                </td>
            </tr>
        `).join('');

        this.renderPagination(logs.length);
    }

    renderPagination(totalItems) {
        const totalPages = Math.ceil(totalItems / this.pageSize);
        const container = document.getElementById('logsPagination');
        if (!container) return;

        let html = '';
        
        html += `<button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} onclick="logsModule.goToPage(${this.currentPage - 1})">上一页</button>`;
        
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 1 && i <= this.currentPage + 1)) {
                html += `<button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" onclick="logsModule.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 2 || i === this.currentPage + 2) {
                html += `<span style="color: var(--text-muted);">...</span>`;
            }
        }
        
        html += `<button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} onclick="logsModule.goToPage(${this.currentPage + 1})">下一页</button>`;
        
        container.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.logs.length / this.pageSize);
        if (page >= 1 && page <= totalPages) {
            this.currentPage = page;
            this.renderLogs();
        }
    }

    updateStats() {
        document.getElementById('totalLogs').textContent = this.logs.length;
        document.getElementById('errorLogs').textContent = this.logs.filter(l => l.level === 'ERROR').length;
        document.getElementById('warningLogs').textContent = this.logs.filter(l => l.level === 'WARNING').length;
        document.getElementById('todayLogs').textContent = Utils.randomInRange(800, 1200);
    }

    switchLogType(type, element) {
        document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('active'));
        element.classList.add('active');
        this.currentPage = 1;
        Utils.showToast(`切换到: ${type} 日志`, 'info');
    }

    searchLogs(term) {
        if (!term) {
            this.renderLogs();
            return;
        }
        const filtered = this.logs.filter(log =>
            log.message.toLowerCase().includes(term.toLowerCase()) ||
            log.source.toLowerCase().includes(term.toLowerCase())
        );
        this.currentPage = 1;
        this.renderLogs(filtered);
    }

    filterByLevel(level) {
        if (!level) {
            this.renderLogs();
            return;
        }
        const filtered = this.logs.filter(log => log.level === level);
        this.currentPage = 1;
        this.renderLogs(filtered);
    }

    filterByDate(date) {
        Utils.showToast(`按日期筛选: ${date || '全部'}`, 'info');
    }

    viewLogDetail(time) {
        const log = this.logs.find(l => l.time === time);
        if (log) {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal" style="max-width: 700px;">
                    <div class="modal-header">
                        <h3 class="modal-title">📋 日志详情</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label class="form-label">时间</label>
                            <input type="text" class="form-input" value="${log.time}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">级别</label>
                            <input type="text" class="form-input" value="${log.level}" readonly style="color: ${log.level === 'ERROR' ? 'var(--danger)' : log.level === 'WARNING' ? 'var(--warning)' : 'var(--primary)'}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">来源</label>
                            <input type="text" class="form-input" value="${log.source}" readonly>
                        </div>
                        <div class="form-group">
                            <label class="form-label">完整消息</label>
                            <textarea class="form-textarea" rows="4" readonly>${log.message}</textarea>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    }

    exportLogs() {
        Utils.showToast('正在导出日志文件...', 'info');
        setTimeout(() => {
            Utils.showToast('日志导出成功！文件: system_logs_20260501.log', 'success');
        }, 1500);
    }

    destroy() {
        eventBus.off('logs:refresh');
    }
}

let logsModule;
