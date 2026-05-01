class ServicesModule {
    constructor() {
        this.services = [];
        this.init();
    }

    init() {
        this.render();
        this.loadServices();
        eventBus.on('services:refresh', () => this.loadServices());
    }

    render() {
        const container = document.getElementById('page-services');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>⚙️ 服务监控</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="servicesModule.showAddServiceModal()">➕ 添加服务</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('services:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalServices">0</div>
                    <div class="stat-label">总服务数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="runningServices">0</div>
                    <div class="stat-label">运行中</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="stoppedServices">0</div>
                    <div class="stat-label">已停止</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="errorServices">0</div>
                    <div class="stat-label">异常状态</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📋 系统服务列表</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <input type="text" placeholder="搜索服务..." class="form-input" style="max-width: 300px;" oninput="servicesModule.searchServices(this.value)">
                        <select class="form-select" style="width: auto;" onchange="servicesModule.filterByStatus(this.value)">
                            <option value="">所有状态</option>
                            <option value="running">运行中</option>
                            <option value="stopped">已停止</option>
                            <option value="error">异常</option>
                        </select>
                    </div>
                </div>
                <div id="servicesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; padding: 16px 0;">
                </div>
            </div>
        `;
    }

    loadServices() {
        this.services = [
            { name: 'nginx', status: 'running', cpu: '0.3%', memory: '45MB', uptime: '15天 8小时', pid: 1234, description: 'Web服务器' },
            { name: 'mysql', status: 'running', cpu: '2.1%', memory: '512MB', uptime: '30天 2小时', pid: 2345, description: '数据库服务' },
            { name: 'redis', status: 'running', cpu: '0.5%', memory: '128MB', uptime: '10天 14小时', pid: 3456, description: '缓存服务' },
            { name: 'ssh', status: 'running', cpu: '0.1%', memory: '12MB', uptime: '45天 6小时', pid: 4567, description: '远程连接服务' },
            { name: 'docker', status: 'running', cpu: '1.2%', memory: '256MB', uptime: '20天 12小时', pid: 5678, description: '容器引擎' },
            { name: 'apache2', status: 'stopped', cpu: '-', memory: '-', uptime: '-', pid: '-', description: '备用Web服务器' },
            { name: 'postgresql', status: 'error', cpu: '-', memory: '-', uptime: '-', pid: '-', description: 'PostgreSQL数据库 (崩溃)' },
            { name: 'cron', status: 'running', cpu: '0.0%', memory: '2MB', uptime: '60天', pid: 6789, description: '定时任务调度' }
        ];

        this.renderServices(this.services);
        this.updateStats();
    }

    renderServices(services) {
        const container = document.getElementById('servicesGrid');
        if (!container) return;

        container.innerHTML = services.map(service => `
            <div class="card" style="margin: 0; padding: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                    <div>
                        <h4 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">${service.name}</h4>
                        <p style="font-size: 13px; color: var(--text-secondary);">${service.description}</p>
                    </div>
                    <span class="status-badge ${service.status === 'running' ? 'success' : service.status === 'stopped' ? 'warning' : 'danger'}">
                        ${service.status === 'running' ? '● 运行中' : service.status === 'stopped' ? '○ 已停止' : '✕ 异常'}
                    </span>
                </div>

                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 12px; font-size: 13px;">
                    <div>
                        <span style="color: var(--text-muted);">CPU:</span>
                        <strong>${service.cpu}</strong>
                    </div>
                    <div>
                        <span style="color: var(--text-muted);">内存:</span>
                        <strong>${service.memory}</strong>
                    </div>
                    <div>
                        <span style="color: var(--text-muted);">PID:</span>
                        <strong>${service.pid || '-'}</strong>
                    </div>
                    <div>
                        <span style="color: var(--text-muted);">运行时间:</span>
                        <strong>${service.uptime || '-'}</strong>
                    </div>
                </div>

                <div style="margin-top: 16px; display: flex; gap: 8px; border-top: 1px solid var(--border-light); padding-top: 12px;">
                    ${service.status === 'running' ? `
                        <button class="btn btn-sm btn-warning" onclick="servicesModule.restartService('${service.name}')">重启</button>
                        <button class="btn btn-sm btn-danger" onclick="servicesModule.stopService('${service.name}')">停止</button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="servicesModule.startService('${service.name}')">启动</button>
                    `}
                    <button class="btn btn-sm btn-outline" onclick="servicesModule.viewLogs('${service.name}')">查看日志</button>
                </div>
            </div>
        `).join('');
    }

    updateStats() {
        document.getElementById('totalServices').textContent = this.services.length;
        document.getElementById('runningServices').textContent = this.services.filter(s => s.status === 'running').length;
        document.getElementById('stoppedServices').textContent = this.services.filter(s => s.status === 'stopped').length;
        document.getElementById('errorServices').textContent = this.services.filter(s => s.status === 'error').length;
    }

    searchServices(term) {
        if (!term) {
            this.renderServices(this.services);
            return;
        }
        const filtered = this.services.filter(s =>
            s.name.toLowerCase().includes(term.toLowerCase()) ||
            s.description.toLowerCase().includes(term.toLowerCase())
        );
        this.renderServices(filtered);
    }

    filterByStatus(status) {
        if (!status) {
            this.renderServices(this.services);
            return;
        }
        const filtered = this.services.filter(s => s.status === status);
        this.renderServices(filtered);
    }

    startService(name) {
        Utils.showToast(`正在启动服务: ${name}...`, 'info');
        setTimeout(() => {
            const service = this.services.find(s => s.name === name);
            if (service) {
                service.status = 'running';
                service.pid = Math.floor(Math.random() * 9000) + 1000;
                service.uptime = '刚刚';
                this.renderServices(this.services);
                this.updateStats();
                Utils.showToast(`服务 ${name} 已启动`, 'success');
            }
        }, 1500);
    }

    stopService(name) {
        if (confirm(`确定要停止服务 ${name} 吗？`)) {
            const service = this.services.find(s => s.name === name);
            if (service) {
                service.status = 'stopped';
                service.pid = null;
                service.uptime = null;
                this.renderServices(this.services);
                this.updateStats();
                Utils.showToast(`服务 ${name} 已停止`, 'warning');
            }
        }
    }

    restartService(name) {
        Utils.showToast(`正在重启服务: ${name}...`, 'info');
        setTimeout(() => {
            Utils.showToast(`服务 ${name} 重启成功`, 'success');
        }, 2000);
    }

    viewLogs(name) {
        showPage('logs');
        Utils.showToast(`查看 ${name} 服务日志`, 'info');
    }

    showAddServiceModal() {
        Utils.showToast('添加新服务功能开发中...', 'info');
    }

    destroy() {
        eventBus.off('services:refresh');
    }
}

let servicesModule;
