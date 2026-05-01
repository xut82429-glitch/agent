class ServicesModule {
    constructor() {
        this.services = [];
        this.processes = [];
        this.serviceDependencies = [];
        this.performanceData = {};
        this.selectedServices = new Set();
        this.currentView = 'services';
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.loadServices();
        this.loadProcesses();
        this.loadServiceDependencies();
        this.initPerformanceMonitoring();
        eventBus.on('services:refresh', () => {
            this.loadServices();
            this.loadProcesses();
        });
        this.startAutoRefresh();
    }

    render() {
        const container = document.getElementById('page-services');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>⚙️ 服务与进程监控</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="servicesModule.showAddServiceModal()">➕ 添加服务</button>
                    <button class="btn btn-outline" onclick="servicesModule.showBatchOperationsModal()">📦 批量操作</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('services:refresh')">🔄 刷新</button>
                    <button class="btn btn-outline" onclick="servicesModule.showDependencyGraph()">🔗 依赖图</button>
                </div>
            </div>

            <div class="tabs" style="margin-bottom: 20px;">
                <button class="tab active" onclick="servicesModule.switchView('services', this)">🖥️ 服务列表</button>
                <button class="tab" onclick="servicesModule.switchView('processes', this)">📊 进程管理</button>
                <button class="tab" onclick="servicesModule.switchView('performance', this)">📈 性能分析</button>
                <button class="tab" onclick="servicesModule.switchView('dependencies', this)">🔗 服务依赖</button>
            </div>

            <!-- 视图容器 -->
            <div id="servicesViewContainer"></div>
        `;

        this.switchView('services');
    }

    switchView(view, element) {
        this.currentView = view;

        document.querySelectorAll('.tabs .tab').forEach(tab => tab.classList.remove('active'));
        if (element) element.classList.add('active');

        const container = document.getElementById('servicesViewContainer');
        if (!container) return;

        switch(view) {
            case 'services':
                this.renderServicesView(container);
                break;
            case 'processes':
                this.renderProcessesView(container);
                break;
            case 'performance':
                this.renderPerformanceView(container);
                break;
            case 'dependencies':
                this.renderDependenciesView(container);
                break;
        }
    }

    loadServices() {
        this.services = [
            { 
                id: 'svc-001',
                name: 'nginx', 
                status: 'running', 
                cpu: 0.3, 
                memory: 45, 
                memoryMB: 45,
                uptime: '15天 8小时', 
                pid: 1234, 
                description: 'Web服务器',
                version: '1.18.0',
                port: 80,
                autoStart: true,
                restartCount: 0,
                lastRestart: null,
                dependencies: ['network.target'],
                healthCheck: 'healthy',
                responseTime: 12,
                connections: 156
            },
            { 
                id: 'svc-002',
                name: 'mysql', 
                status: 'running', 
                cpu: 2.1, 
                memory: 512, 
                memoryMB: 512,
                uptime: '30天 2小时', 
                pid: 2345, 
                description: '数据库服务',
                version: '8.0.25',
                port: 3306,
                autoStart: true,
                restartCount: 1,
                lastRestart: '2024-01-15 03:22:11',
                dependencies: ['network.target', 'filesystem.target'],
                healthCheck: 'healthy',
                responseTime: 3,
                connections: 89
            },
            { 
                id: 'svc-003',
                name: 'redis', 
                status: 'running', 
                cpu: 0.5, 
                memory: 128, 
                memoryMB: 128,
                uptime: '10天 14小时', 
                pid: 3456, 
                description: '缓存服务',
                version: '6.2.6',
                port: 6379,
                autoStart: true,
                restartCount: 0,
                lastRestart: null,
                dependencies: ['network.target'],
                healthCheck: 'healthy',
                responseTime: 0,
                connections: 234
            },
            { 
                id: 'svc-004',
                name: 'ssh', 
                status: 'running', 
                cpu: 0.1, 
                memory: 12, 
                memoryMB: 12,
                uptime: '45天 6小时', 
                pid: 4567, 
                description: '远程连接服务',
                version: '8.2p1',
                port: 22,
                autoStart: true,
                restartCount: 0,
                lastRestart: null,
                dependencies: ['network.target'],
                healthCheck: 'healthy',
                responseTime: 1,
                connections: 5
            },
            { 
                id: 'svc-005',
                name: 'docker', 
                status: 'running', 
                cpu: 1.2, 
                memory: 256, 
                memoryMB: 256,
                uptime: '20天 12小时', 
                pid: 5678, 
                description: '容器引擎',
                version: '20.10.12',
                port: null,
                autoStart: true,
                restartCount: 2,
                lastRestart: '2024-01-18 09:15:33',
                dependencies: ['containerd.service'],
                healthCheck: 'healthy',
                responseTime: 0,
                connections: 0
            },
            { 
                id: 'svc-006',
                name: 'apache2', 
                status: 'stopped', 
                cpu: 0, 
                memory: 0, 
                memoryMB: 0,
                uptime: '-', 
                pid: null, 
                description: '备用Web服务器',
                version: '2.4.48',
                port: 8080,
                autoStart: false,
                restartCount: 0,
                lastRestart: null,
                dependencies: ['network.target'],
                healthCheck: 'unknown',
                responseTime: null,
                connections: 0
            },
            { 
                id: 'svc-007',
                name: 'postgresql', 
                status: 'error', 
                cpu: 0, 
                memory: 0, 
                memoryMB: 0,
                uptime: '-', 
                pid: null, 
                description: 'PostgreSQL数据库 (崩溃)',
                version: '13.3',
                port: 5432,
                autoStart: true,
                restartCount: 5,
                lastRestart: '2024-01-20 14:32:05',
                dependencies: ['network.target', 'filesystem.target'],
                healthCheck: 'critical',
                responseTime: null,
                connections: 0
            },
            { 
                id: 'svc-008',
                name: 'cron', 
                status: 'running', 
                cpu: 0.0, 
                memory: 2, 
                memoryMB: 2,
                uptime: '60天', 
                pid: 6789, 
                description: '定时任务调度',
                version: '3.0pl1',
                port: null,
                autoStart: true,
                restartCount: 0,
                lastRestart: null,
                dependencies: ['time-sync.target'],
                healthCheck: 'healthy',
                responseTime: 0,
                connections: 0
            },
            { 
                id: 'svc-009',
                name: 'elasticsearch', 
                status: 'running', 
                cpu: 8.5, 
                memory: 2048, 
                memoryMB: 2048,
                uptime: '5天 3小时', 
                pid: 7890, 
                description: '搜索引擎',
                version: '7.15.0',
                port: 9200,
                autoStart: true,
                restartCount: 1,
                lastRestart: '2024-01-19 08:42:17',
                dependencies: ['java.target', 'network.target'],
                healthCheck: 'warning',
                responseTime: 145,
                connections: 67
            },
            { 
                id: 'svc-010',
                name: 'rabbitmq', 
                status: 'running', 
                cpu: 3.2, 
                memory: 384, 
                memoryMB: 384,
                uptime: '8天 16小时', 
                pid: 8901, 
                description: '消息队列',
                version: '3.9.7',
                port: 5672,
                autoStart: true,
                restartCount: 0,
                lastRestart: null,
                dependencies: ['erlang.target', 'network.target'],
                healthCheck: 'healthy',
                responseTime: 8,
                connections: 123
            }
        ];

        if (this.currentView === 'services') {
            this.renderServicesView(document.getElementById('servicesViewContainer'));
        }
        this.updatePerformanceData();
    }

    renderServicesView(container) {
        if (!container) return;

        const runningCount = this.services.filter(s => s.status === 'running').length;
        const stoppedCount = this.services.filter(s => s.status === 'stopped').length;
        const errorCount = this.services.filter(s => s.status === 'error').length;

        container.innerHTML = `
            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalServices">${this.services.length}</div>
                    <div class="stat-label">总服务数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="runningServices">${runningCount}</div>
                    <div class="stat-label">运行中</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="stoppedServices">${stoppedCount}</div>
                    <div class="stat-label">已停止</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="errorServices">${errorCount}</div>
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
                        <select class="form-select" style="width: auto;" onchange="servicesModule.sortServices(this.value)">
                            <option value="name">按名称排序</option>
                            <option value="cpu-desc">CPU使用率 (高→低)</option>
                            <option value="cpu-asc">CPU使用率 (低→高)</option>
                            <option value="memory-desc">内存使用 (高→低)</option>
                            <option value="memory-asc">内存使用 (低→高)</option>
                            <option value="uptime">运行时间</option>
                        </select>
                    </div>
                </div>
                
                <div style="padding: 16px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" onchange="servicesModule.toggleAllSelection(this.checked)"></th>
                                <th>服务名称</th>
                                <th>状态</th>
                                <th>CPU</th>
                                <th>内存</th>
                                <th>PID</th>
                                <th>端口</th>
                                <th>健康检查</th>
                                <th>响应时间</th>
                                <th>连接数</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="servicesTableBody">
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">📈 资源使用概览</h3>
                </div>
                <div style="padding: 16px;">
                    <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                        <div>
                            <h4 style="margin-bottom: 12px;">CPU 使用率分布</h4>
                            <canvas id="serviceCpuChart" height="250"></canvas>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 12px;">内存使用分布</h4>
                            <canvas id="serviceMemoryChart" height="250"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.renderServicesTable(this.services);
        this.renderResourceCharts();
    }

    renderServicesTable(services) {
        const tbody = document.getElementById('servicesTableBody');
        if (!tbody) return;

        tbody.innerHTML = services.map(service => `
            <tr class="${this.selectedServices.has(service.id) ? 'selected' : ''}">
                <td><input type="checkbox" ${this.selectedServices.has(service.id) ? 'checked' : ''} onchange="servicesModule.toggleSelection('${service.id}', this.checked)"></td>
                <td>
                    <div style="font-weight: 600; color: var(--text-primary);">${service.name}</div>
                    <div style="font-size: 11px; color: var(--text-muted);">${service.description} v${service.version}</div>
                </td>
                <td>
                    <span class="status-badge ${service.status === 'running' ? 'success' : service.status === 'stopped' ? 'warning' : 'danger'}">
                        ${service.status === 'running' ? '● 运行中' : service.status === 'stopped' ? '○ 已停止' : '✕ 异常'}
                    </span>
                    ${service.restartCount > 0 ? `<br><small style="color: var(--warning);">重启 ${service.restartCount} 次</small>` : ''}
                </td>
                <td>
                    <div class="progress-bar" style="width: 80px; margin: 4px 0;">
                        <div class="progress-fill ${service.cpu > 5 ? 'danger' : service.cpu > 2 ? 'warning' : 'success'}" 
                             style="width: ${Math.min(service.cpu * 10, 100)}%;"></div>
                    </div>
                    <small>${service.cpu}%</small>
                </td>
                <td>
                    <strong>${service.memory > 1024 ? (service.memory / 1024).toFixed(1) + ' GB' : service.memory + ' MB'}</strong>
                </td>
                <td><code>${service.pid || '-'}</code></td>
                <td>${service.port ? `<code>${service.port}</code>` : '-'}</td>
                <td>
                    <span class="status-badge ${
                        service.healthCheck === 'healthy' ? 'success' :
                        service.healthCheck === 'warning' ? 'warning' :
                        service.healthCheck === 'critical' ? 'danger' : 'default'
                    }">
                        ${service.healthCheck === 'healthy' ? '✅ 健康' :
                          service.healthCheck === 'warning' ? '⚠️ 警告' :
                          service.healthCheck === 'critical' ? '🔴 危险' : '❓ 未知'}
                    </span>
                </td>
                <td>${service.responseTime !== null ? service.responseTime + 'ms' : '-'}</td>
                <td><strong>${service.connections}</strong></td>
                <td>
                    <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                        ${service.status === 'running' ? `
                            <button class="btn btn-sm btn-warning" onclick="servicesModule.restartService('${service.id}')" title="重启">🔄</button>
                            <button class="btn btn-sm btn-danger" onclick="servicesModule.stopService('${service.id}')" title="停止">⏹</button>
                        ` : `
                            <button class="btn btn-sm btn-success" onclick="servicesModule.startService('${service.id}')" title="启动">▶</button>
                        `}
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.viewServiceDetails('${service.id}')" title="详情">ℹ️</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderResourceCharts() {
        this.renderCpuChart();
        this.renderMemoryChart();
    }

    renderCpuChart() {
        const canvas = document.getElementById('serviceCpuChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const runningServices = this.services.filter(s => s.status === 'running');

        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: runningServices.map(s => s.name),
                datasets: [{
                    data: runningServices.map(s => s.cpu),
                    backgroundColor: [
                        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
                        '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
                    ],
                    borderWidth: 2,
                    borderColor: 'var(--bg-card)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: 'var(--text-secondary)',
                            font: { size: 11 },
                            padding: 8,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.label}: ${context.raw}% CPU`;
                            }
                        }
                    }
                }
            }
        });
    }

    renderMemoryChart() {
        const canvas = document.getElementById('serviceMemoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const runningServices = this.services.filter(s => s.status === 'running');

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: runningServices.map(s => s.name),
                datasets: [{
                    label: '内存使用 (MB)',
                    data: runningServices.map(s => s.memoryMB),
                    backgroundColor: runningServices.map(s => 
                        s.memoryMB > 1000 ? '#ef4444' :
                        s.memoryMB > 500 ? '#f59e0b' : '#10b981'
                    ),
                    borderRadius: 4,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `内存: ${context.raw} MB`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'var(--text-muted)',
                            callback: function(value) {
                                return value >= 1024 ? (value / 1024) + 'GB' : value + 'MB';
                            }
                        },
                        grid: { color: 'var(--border-light)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-muted)' },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    loadProcesses() {
        this.processes = [
            { pid: 1, user: 'root', cpu: 0.0, memory: 4.2, command: '/sbin/init', state: 'S', threads: 1, startTime: 'Jan01', parentPid: 0 },
            { pid: 1234, user: 'www-data', cpu: 0.3, memory: 45.0, command: 'nginx: master process', state: 'S', threads: 1, startTime: 'Jan16', parentPid: 1 },
            { pid: 1245, user: 'www-data', cpu: 0.1, memory: 12.3, command: 'nginx: worker process', state: 'R', threads: 4, startTime: 'Jan16', parentPid: 1234 },
            { pid: 2345, user: 'mysql', cpu: 2.1, memory: 512.0, command: '/usr/sbin/mysqld', state: 'S', threads: 32, startTime: 'Jan01', parentPid: 1 },
            { pid: 3456, user: 'redis', cpu: 0.5, memory: 128.0, command: '/usr/bin/redis-server', state: 'R', threads: 4, startTime: 'Jan21', parentPid: 1 },
            { pid: 4567, user: 'root', cpu: 0.1, memory: 12.0, command: '/usr/sbin/sshd', state: 'S', threads: 1, startTime: 'Dec17', parentPid: 1 },
            { pid: 5678, user: 'root', cpu: 1.2, memory: 256.0, command: '/usr/bin/dockerd', state: 'S', threads: 18, startTime: 'Jan11', parentPid: 1 },
            { pid: 6789, user: 'root', cpu: 0.0, memory: 2.0, command: '/usr/sbin/cron', state: 'S', threads: 1, startTime: 'Dec02', parentPid: 1 },
            { pid: 7890, user: 'elastic', cpu: 8.5, memory: 2048.0, command: '/usr/share/elasticsearch/bin/elasticsearch', state: 'R', threads: 64, startTime: 'Jan26', parentPid: 1 },
            { pid: 8901, user: 'rabbitmq', cpu: 3.2, memory: 384.0, command: '/usr/lib/rabbitmq/bin/rabbitmq-server', state: 'S', threads: 256, startTime: 'Jan23', parentPid: 1 },
            { pid: 9012, user: 'root', cpu: 0.2, memory: 24.0, command: '/usr/lib/systemd/systemd-journald', state: 'S', threads: 1, startTime: 'Jan01', parentPid: 1 },
            { pid: 9013, user: 'root', cpu: 0.1, memory: 18.0, command: '/usr/lib/systemd/systemd-logind', state: 'S', threads: 1, startTime: 'Jan01', parentPid: 1 },
            { pid: 9014, user: 'syslog', cpu: 0.0, memory: 8.0, command: '/usr/sbin/rsyslogd', state: 'S', threads: 1, startTime: 'Jan01', parentPid: 1 },
            { pid: 9015, user: 'root', cpu: 0.4, memory: 64.0, command: '/usr/sbin/NetworkManager', state: 'S', threads: 3, startTime: 'Jan01', parentPid: 1 },
            { pid: 9016, user: 'daemon', cpu: 0.0, memory: 3.2, command: '/usr/sbin/atd', state: 'S', threads: 1, startTime: 'Jan01', parentPid: 1 },
            { pid: 10001, user: 'xutao', cpu: 15.2, memory: 512.0, command: 'node app.js', state: 'R', threads: 12, startTime: '10:30', parentPid: 9000 },
            { pid: 10002, user: 'xutao', cpu: 5.8, memory: 128.0, command: 'npm start', state: 'S', threads: 4, startTime: '10:30', parentPid: 10001 },
            { pid: 11001, user: 'www-data', cpu: 0.2, memory: 32.0, command: 'php-fpm: pool www', state: 'R', threads: 8, startTime: 'Jan20', parentPid: 1234 },
            { pid: 12001, user: 'root', cpu: 0.0, memory: 16.0, command: '/usr/sbin/sshd: root@pts/0', state: 'S', threads: 1, startTime: '11:15', parentPid: 4567 }
        ];
    }

    renderProcessesView(container) {
        if (!container) return;

        const totalProcesses = this.processes.length;
        const totalMemory = this.processes.reduce((sum, p) => sum + p.memory, 0);
        const totalCpu = this.processes.reduce((sum, p) => sum + p.cpu, 0);
        const zombieProcesses = this.processes.filter(p => p.state === 'Z').length;

        container.innerHTML = `
            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalProcesses">${totalProcesses}</div>
                    <div class="stat-label">总进程数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="totalCpuUsage">${totalCpu.toFixed(1)}%</div>
                    <div class="stat-label">总CPU使用</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="totalMemoryUsage">${(totalMemory / 1024).toFixed(1)}GB</div>
                    <div class="stat-label">总内存使用</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: ${zombieProcesses > 0 ? 'var(--danger)' : 'var(--success)'};" id="zombieProcesses">${zombieProcesses}</div>
                    <div class="stat-label">僵尸进程</div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📋 进程列表</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <input type="text" placeholder="搜索进程..." class="form-input" style="max-width: 300px;" oninput="servicesModule.searchProcesses(this.value)">
                        <select class="form-select" style="width: auto;" onchange="servicesModule.filterByUser(this.value)">
                            <option value="">所有用户</option>
                            ${[...new Set(this.processes.map(p => p.user))].map(user => 
                                `<option value="${user}">${user}</option>`
                            ).join('')}
                        </select>
                        <select class="form-select" style="width: auto;" onchange="servicesModule.filterByState(this.value)">
                            <option value="">所有状态</option>
                            <option value="R">运行中 (R)</option>
                            <option value="S">睡眠 (S)</option>
                            <option value="D">不可中断睡眠 (D)</option>
                            <option value="Z">僵尸 (Z)</option>
                            <option value="T">停止 (T)</option>
                        </select>
                        <button class="btn btn-sm btn-danger" onclick="servicesModule.killSelectedProcesses()" title="终止选中进程">⛔ 终止选中</button>
                    </div>
                </div>
                
                <div style="padding: 16px; overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th><input type="checkbox" onchange="servicesModule.toggleAllProcessSelection(this.checked)"></th>
                                <th onclick="servicesModule.sortProcesses('pid')" style="cursor: pointer;">PID ↕</th>
                                <th onclick="servicesModule.sortProcesses('user')" style="cursor: pointer;">用户 ↕</th>
                                <th onclick="servicesModule.sortProcesses('cpu')" style="cursor: pointer;">CPU% ↕</th>
                                <th onclick="servicesModule.sortProcesses('memory')" style="cursor: pointer;">内存(MB) ↕</th>
                                <th>命令</th>
                                <th>状态</th>
                                <th>线程</th>
                                <th>启动时间</th>
                                <th>PPID</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="processesTableBody">
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">🔥 Top 10 资源消耗进程</h3>
                </div>
                <div style="padding: 16px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
                    <div>
                        <h4 style="margin-bottom: 12px;">CPU 消耗排行</h4>
                        <div id="topCpuProcesses"></div>
                    </div>
                    <div>
                        <h4 style="margin-bottom: 12px;">内存消耗排行</h4>
                        <div id="topMemoryProcesses"></div>
                    </div>
                </div>
            </div>
        `;

        this.renderProcessesTable(this.processes);
        this.renderTopProcesses();
    }

    renderProcessesTable(processes) {
        const tbody = document.getElementById('processesTableBody');
        if (!tbody) return;

        tbody.innerHTML = processes.map(process => `
            <tr>
                <td><input type="checkbox" data-pid="${process.pid}" class="process-checkbox"></td>
                <td><code>${process.pid}</code></td>
                <td>${process.user}</td>
                <td>
                    <div class="progress-bar" style="width: 60px; margin: 4px 0;">
                        <div class="progress-fill ${process.cpu > 10 ? 'danger' : process.cpu > 5 ? 'warning' : 'success'}" 
                             style="width: ${Math.min(process.cpu * 5, 100)}%;"></div>
                    </div>
                    <small>${process.cpu.toFixed(1)}%</small>
                </td>
                <td><strong>${process.memory.toFixed(1)}</strong></td>
                <td style="max-width: 280px;"><code style="font-size: 12px;">${process.command.length > 50 ? process.command.substring(0, 50) + '...' : process.command}</code></td>
                <td>
                    <span class="status-badge ${
                        process.state === 'R' ? 'success' :
                        process.state === 'S' ? 'default' :
                        process.state === 'Z' ? 'danger' : 'warning'
                    }">${process.state}</span>
                </td>
                <td>${process.threads}</td>
                <td style="white-space: nowrap;">${process.startTime}</td>
                <td><code>${process.parentPid}</code></td>
                <td>
                    <div style="display: flex; gap: 4px;">
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.showProcessDetails(${process.pid})" title="详情">ℹ️</button>
                        <button class="btn btn-sm btn-danger" onclick="servicesModule.killProcess(${process.pid})" title="终止" ${process.pid <= 100 ? 'disabled' : ''}>⛔</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderTopProcesses() {
        const topCpuContainer = document.getElementById('topCpuProcesses');
        const topMemContainer = document.getElementById('topMemoryProcesses');

        if (topCpuContainer) {
            const topCpu = [...this.processes].sort((a, b) => b.cpu - a.cpu).slice(0, 10);
            topCpuContainer.innerHTML = topCpu.map((p, index) => `
                <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px;">
                    <span style="font-weight: bold; width: 24px; color: index < 3 ? 'var(--warning)' : 'var(--text-muted)';">#${index + 1}</span>
                    <div style="flex: 1; margin-left: 8px;">
                        <div style="font-weight: 500; font-size: 13px;">${p.command.split('/').pop()}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">PID: ${p.pid} | 用户: ${p.user}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: ${p.cpu > 10 ? 'var(--danger)' : 'var(--text-primary)'};">${p.cpu.toFixed(1)}%</div>
                    </div>
                </div>
            `).join('');
        }

        if (topMemContainer) {
            const topMem = [...this.processes].sort((a, b) => b.memory - a.memory).slice(0, 10);
            topMemContainer.innerHTML = topMem.map((p, index) => `
                <div style="display: flex; align-items: center; margin-bottom: 8px; padding: 8px; background: var(--bg-secondary); border-radius: 4px;">
                    <span style="font-weight: bold; width: 24px; color: index < 3 ? 'var(--warning)' : 'var(--text-muted)';">#${index + 1}</span>
                    <div style="flex: 1; margin-left: 8px;">
                        <div style="font-weight: 500; font-size: 13px;">${p.command.split('/').pop()}</div>
                        <div style="font-size: 11px; color: var(--text-muted);">PID: ${p.pid} | 用户: ${p.user}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: ${p.memory > 500 ? 'var(--danger)' : 'var(--text-primary)'};">${p.memory.toFixed(1)} MB</div>
                    </div>
                </div>
            `).join('');
        }
    }

    initPerformanceMonitoring() {
        this.performanceData = {
            cpu: [],
            memory: [],
            timestamps: []
        };

        for (let i = 29; i >= 0; i--) {
            const time = new Date(Date.now() - i * 60000);
            this.performanceData.timestamps.push(time.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }));
            this.performanceData.cpu.push(Math.random() * 30 + 20);
            this.performanceData.memory.push(Math.random() * 20 + 55);
        }
    }

    updatePerformanceData() {
        const now = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        
        this.performanceData.timestamps.push(now);
        this.performanceData.cpu.push(Math.random() * 30 + 20);
        this.performanceData.memory.push(Math.random() * 20 + 55);

        if (this.performanceData.timestamps.length > 30) {
            this.performanceData.timestamps.shift();
            this.performanceData.cpu.shift();
            this.performanceData.memory.shift();
        }
    }

    renderPerformanceView(container) {
        if (!container) return;

        container.innerHTML = `
            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📈 实时性能趋势 (最近30分钟)</h3>
                    </div>
                    <div style="padding: 16px;">
                        <canvas id="realtimePerfChart" height="300"></canvas>
                    </div>
                </div>
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">⚡ 性能指标仪表盘</h3>
                    </div>
                    <div style="padding: 16px;">
                        <div id="perfGauges" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;"></div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🎯 服务性能对比</h3>
                </div>
                <div style="padding: 16px;">
                    <canvas id="serviceComparisonChart" height="350"></canvas>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">📊 资源使用历史</h3>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.setPerfTimeRange('1h')">1小时</button>
                        <button class="btn btn-sm btn-outline active" onclick="servicesModule.setPerfTimeRange('6h')">6小时</button>
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.setPerfTimeRange('24h')">24小时</button>
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.setPerfTimeRange('7d')">7天</button>
                    </div>
                </div>
                <div style="padding: 16px;">
                    <canvas id="historyPerfChart" height="300"></canvas>
                </div>
            </div>
        `;

        this.renderRealtimeChart();
        this.renderPerformanceGauges();
        this.renderServiceComparisonChart();
        this.renderHistoryChart();
    }

    renderRealtimeChart() {
        const canvas = document.getElementById('realtimePerfChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.performanceData.timestamps,
                datasets: [
                    {
                        label: 'CPU 使用率 (%)',
                        data: this.performanceData.cpu,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2
                    },
                    {
                        label: '内存使用率 (%)',
                        data: this.performanceData.memory,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        borderWidth: 2
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
                        labels: { color: 'var(--text-secondary)', usePointStyle: true }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: 'var(--text-muted)',
                            callback: value => value + '%'
                        },
                        grid: { color: 'var(--border-light)' }
                    },
                    x: {
                        ticks: { color: 'var(--text-muted)', maxTicksLimit: 10 },
                        grid: { display: false }
                    }
                },
                animation: { duration: 300 }
            }
        });
    }

    renderPerformanceGauges() {
        const container = document.getElementById('perfGauges');
        if (!container) return;

        const metrics = [
            { label: 'CPU 平均负载', value: 2.34, max: 16, unit: '', color: '#3b82f6', optimal: 8 },
            { label: '内存使用率', value: 68.5, max: 100, unit: '%', color: '#10b981', optimal: 70 },
            { label: '磁盘 I/O', value: 245, max: 1000, unit: 'MB/s', color: '#f59e0b', optimal: 500 },
            { label: '网络吞吐', value: 850, max: 1000, unit: 'Mbps', color: '#8b5cf6', optimal: 800 },
            { label: '进程切换率', value: 1250, max: 5000, unit: '/s', color: '#ec4899', optimal: 2000 },
            { label: '上下文切换', value: 45000, max: 100000, unit: '/s', color: '#06b6d4', optimal: 50000 }
        ];

        container.innerHTML = metrics.map(metric => {
            const percentage = (metric.value / metric.max) * 100;
            const isGood = metric.value <= metric.optimal;
            
            return `
                <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-size: 13px; font-weight: 600;">${metric.label}</span>
                        <span style="font-size: 18px; font-weight: bold; color: ${isGood ? 'var(--success)' : 'var(--danger)'};">
                            ${metric.value}${metric.unit}
                        </span>
                    </div>
                    <div class="progress-bar" style="height: 8px; border-radius: 4px;">
                        <div class="progress-fill ${isGood ? 'success' : 'danger'}" 
                             style="width: ${percentage}%; background: ${metric.color};"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                        <small style="color: var(--text-muted);">0</small>
                        <small style="color: var(--text-muted);">最佳值: ${metric.optimal}${metric.unit}</small>
                        <small style="color: var(--text-muted);">${metric.max}${metric.unit}</small>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderServiceComparisonChart() {
        const canvas = document.getElementById('serviceComparisonChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const runningServices = this.services.filter(s => s.status === 'running');

        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['CPU使用率', '内存占用', '响应时间', '连接数', '稳定性', '资源效率'],
                datasets: runningServices.slice(0, 5).map((service, index) => ({
                    label: service.name,
                    data: [
                        Math.min(service.cpu * 10, 100),
                        Math.min(service.memory / 20, 100),
                        Math.min(service.responseTime || 0, 100),
                        Math.min(service.connections * 2, 100),
                        Math.max(100 - service.restartCount * 20, 0),
                        Math.min(100 - service.cpu * 5, 100)
                    ],
                    backgroundColor: [
                        'rgba(59, 130, 246, 0.2)',
                        'rgba(239, 68, 68, 0.2)',
                        'rgba(16, 185, 129, 0.2)',
                        'rgba(245, 158, 11, 0.2)',
                        'rgba(139, 92, 246, 0.2)'
                    ][index],
                    borderColor: [
                        '#3b82f6',
                        '#ef4444',
                        '#10b981',
                        '#f59e0b',
                        '#8b5cf6'
                    ][index],
                    borderWidth: 2,
                    pointBackgroundColor: [
                        '#3b82f6',
                        '#ef4444',
                        '#10b981',
                        '#f59e0b',
                        '#8b5cf6'
                    ][index]
                }))
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: 'var(--text-secondary)', usePointStyle: true }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            color: 'var(--text-muted)',
                            stepSize: 20,
                            backdropColor: 'transparent'
                        },
                        grid: { color: 'var(--border-light)' },
                        pointLabels: { color: 'var(--text-secondary)', font: { size: 11 } }
                    }
                }
            }
        });
    }

    renderHistoryChart() {
        const canvas = document.getElementById('historyPerfChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const hours = Array.from({length: 24}, (_, i) => `${i.toString().padStart(2, '0')}:00`);
        
        new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [
                    {
                        label: 'CPU 使用率',
                        data: Array.from({length: 24}, () => Math.random() * 40 + 20),
                        borderColor: '#3b82f6',
                        tension: 0.3,
                        pointRadius: 2,
                        borderWidth: 2
                    },
                    {
                        label: '内存使用率',
                        data: Array.from({length: 24}, () => Math.random() * 25 + 55),
                        borderColor: '#10b981',
                        tension: 0.3,
                        pointRadius: 2,
                        borderWidth: 2
                    },
                    {
                        label: '磁盘 I/O',
                        data: Array.from({length: 24}, () => Math.random() * 300 + 100),
                        borderColor: '#f59e0b',
                        tension: 0.3,
                        pointRadius: 2,
                        borderWidth: 2,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: { color: 'var(--text-secondary)', usePointStyle: true }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        position: 'left',
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: 'var(--text-muted)', callback: v => v + '%' },
                        grid: { color: 'var(--border-light)' }
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        beginAtZero: true,
                        ticks: { color: 'var(--text-muted)', callback: v => v + 'MB/s' },
                        grid: { display: false }
                    },
                    x: {
                        ticks: { color: 'var(--text-muted)', maxTicksLimit: 12 },
                        grid: { display: false }
                    }
                }
            }
        });
    }

    loadServiceDependencies() {
        this.serviceDependencies = [
            { source: 'nginx', target: 'network.target', type: 'requires' },
            { source: 'mysql', target: 'network.target', type: 'requires' },
            { source: 'mysql', target: 'filesystem.target', type: 'after' },
            { source: 'redis', target: 'network.target', type: 'requires' },
            { source: 'ssh', target: 'network.target', type: 'requires' },
            { source: 'docker', target: 'containerd.service', type: 'requires' },
            { source: 'elasticsearch', target: 'java.target', type: 'requires' },
            { source: 'elasticsearch', target: 'network.target', type: 'after' },
            { source: 'rabbitmq', target: 'erlang.target', type: 'requires' },
            { source: 'rabbitmq', target: 'network.target', type: 'after' },
            { source: 'postgresql', target: 'network.target', type: 'requires' },
            { source: 'postgresql', target: 'filesystem.target', type: 'after' },
            { source: 'cron', target: 'time-sync.target', type: 'requires' }
        ];
    }

    renderDependenciesView(container) {
        if (!container) return;

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">🔗 服务依赖关系图</h3>
                    <div class="header-actions">
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.exportDependencyGraph()">📥 导出</button>
                        <button class="btn btn-sm btn-outline" onclick="servicesModule.checkCircularDependencies()">🔄 检测循环依赖</button>
                    </div>
                </div>
                <div style="padding: 16px;">
                    <div id="dependencyGraphContainer" style="height: 500px; position: relative; background: var(--bg-secondary); border-radius: var(--radius-md); overflow: hidden;">
                        <canvas id="dependencyGraphCanvas" style="position: absolute; top: 0; left: 0;"></canvas>
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <h4 style="margin-bottom: 12px;">📋 依赖关系列表</h4>
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>源服务</th>
                                    <th>依赖类型</th>
                                    <th>目标服务/目标</th>
                                    <th>状态</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.serviceDependencies.map(dep => {
                                    const sourceService = this.services.find(s => s.name === dep.source);
                                    const targetIsService = this.services.some(s => s.name === dep.target);
                                    
                                    return `
                                        <tr>
                                            <td>
                                                <span class="status-badge ${sourceService?.status === 'running' ? 'success' : sourceService?.status === 'stopped' ? 'warning' : 'danger'}">
                                                    ${dep.source}
                                                </span>
                                            </td>
                                            <td>
                                                <span style="
                                                    padding: 2px 8px;
                                                    border-radius: 4px;
                                                    font-size: 11px;
                                                    background: ${dep.type === 'requires' ? '#ef444420' : '#3b82f620'};
                                                    color: ${dep.type === 'requires' ? '#ef4444' : '#3b82f6'};
                                                ">${dep.type === 'requires' ? '必须依赖' : '顺序依赖'}</span>
                                            </td>
                                            <td>
                                                ${targetIsService ? 
                                                    `<span class="status-badge default">${dep.target}</span>` :
                                                    `<code>${dep.target}</code>`
                                                }
                                            </td>
                                            <td>
                                                ${(() => {
                                                    if (!sourceService || sourceService.status !== 'running') {
                                                        return '<span class="status-badge danger">❌ 未满足</span>';
                                                    }
                                                    if (targetIsService) {
                                                        const targetService = this.services.find(s => s.name === dep.target);
                                                        if (targetService && targetService.status === 'running') {
                                                            return '<span class="status-badge success">✅ 正常</span>';
                                                        }
                                                        return '<span class="status-badge warning">⚠️ 目标未运行</span>';
                                                    }
                                                    return '<span class="status-badge success">✅ 正常</span>';
                                                })()}
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">⚠️ 启动顺序建议</h3>
                </div>
                <div style="padding: 16px;">
                    <div id="startupOrder"></div>
                </div>
            </div>
        `;

        setTimeout(() => this.renderDependencyGraph(), 100);
        this.renderStartupOrder();
    }

    renderDependencyGraph() {
        const canvas = document.getElementById('dependencyGraphCanvas');
        const container = document.getElementById('dependencyGraphContainer');
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        const services = [...new Set(this.serviceDependencies.flatMap(d => [d.source, d.target]))];
        const nodePositions = {};

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 80;

        services.forEach((service, index) => {
            const angle = (index / services.length) * 2 * Math.PI - Math.PI / 2;
            nodePositions[service] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        this.serviceDependencies.forEach(dep => {
            const from = nodePositions[dep.source];
            const to = nodePositions[dep.target];

            if (from && to) {
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);

                const midX = (from.x + to.x) / 2;
                const midY = (from.y + to.y) / 2;
                const offset = 20;
                const perpX = -(to.y - from.y) / Math.sqrt((to.x - from.x)**2 + (to.y - from.y)**2) * offset;
                const perpY = (to.x - from.x) / Math.sqrt((to.x - from.x)**2 + (to.y - from.y)**2) * offset;

                ctx.quadraticCurveTo(midX + perpX, midY + perpY, to.x, to.y);
                ctx.strokeStyle = dep.type === 'requires' ? '#ef444480' : '#3b82f680';
                ctx.lineWidth = 2;
                ctx.stroke();

                const arrowSize = 8;
                const angle = Math.atan2(to.y - midY - perpY, to.x - midX - perpX);
                ctx.beginPath();
                ctx.moveTo(to.x, to.y);
                ctx.lineTo(
                    to.x - arrowSize * Math.cos(angle - Math.PI / 6),
                    to.y - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    to.x - arrowSize * Math.cos(angle + Math.PI / 6),
                    to.y - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = dep.type === 'requires' ? '#ef4444' : '#3b82f6';
                ctx.fill();
            }
        });

        Object.entries(nodePositions).forEach(([name, pos]) => {
            const service = this.services.find(s => s.name === name);
            const isRunning = service?.status === 'running';
            const isTarget = this.services.every(s => s.name !== name);

            ctx.beginPath();
            ctx.arc(pos.x, pos.y, isTarget ? 20 : 28, 0, 2 * Math.PI);
            ctx.fillStyle = isTarget ? '#6b7280' : (isRunning ? '#10b981' : '#ef4444');
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 11px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            const displayName = name.replace('.target', '').replace('.service', '');
            if (displayName.length > 8) {
                ctx.fillText(displayName.substring(0, 8), pos.x, pos.y - 6);
                ctx.fillText(displayName.substring(8), pos.x, pos.y + 6);
            } else {
                ctx.fillText(displayName, pos.x, pos.y);
            }
        });
    }

    renderStartupOrder() {
        const container = document.getElementById('startupOrder');
        if (!container) return;

        const levels = [
            { level: 1, services: ['network.target', 'filesystem.target', 'time-sync.target'], description: '基础系统服务' },
            { level: 2, services: ['containerd.service', 'java.target', 'erlang.target'], description: '运行时环境' },
            { level: 3, services: ['mysql', 'redis', 'postgresql', 'ssh'], description: '核心数据服务' },
            { level: 4, services: ['nginx', 'docker', 'elasticsearch', 'rabbitmq'], description: '应用层服务' },
            { level: 5, services: ['cron', 'apache2'], description: '辅助服务' }
        ];

        container.innerHTML = levels.map(level => `
            <div style="display: flex; align-items: center; margin-bottom: 16px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 4px solid var(--primary);">
                <div style="
                    width: 40px; height: 40px; border-radius: 50%;
                    background: var(--primary); color: white;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 18px; margin-right: 16px;
                ">${level.level}</div>
                <div style="flex: 1;">
                    <div style="font-weight: 600; margin-bottom: 4px;">第 ${level.level} 阶段 - ${level.description}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;">
                        ${level.services.map(svc => {
                            const service = this.services.find(s => s.name === svc);
                            const isSystemTarget = svc.includes('.target') || svc.includes('.service');
                            
                            return isSystemTarget ?
                                `<code style="font-size: 12px; padding: 4px 8px; background: var(--bg-tertiary); border-radius: 4px;">⚙️ ${svc}</code>` :
                                `<span class="status-badge ${service?.status === 'running' ? 'success' : 'warning'}" style="font-size: 12px;">
                                    ${service?.status === 'running' ? '✓' : '○'} ${svc}
                                </span>`;
                        }).join('')}
                    </div>
                </div>
            </div>
        `).join('');
    }

    toggleSelection(id, selected) {
        if (selected) {
            this.selectedServices.add(id);
        } else {
            this.selectedServices.delete(id);
        }
        this.renderServicesTable(this.services.filter(s => 
            this.shouldShowService(s)
        ));
    }

    toggleAllSelection(selected) {
        if (selected) {
            this.services.forEach(s => this.selectedServices.add(s.id));
        } else {
            this.selectedServices.clear();
        }
        this.renderServicesTable(this.services.filter(s => this.shouldShowService(s)));
    }

    shouldShowService(service) {
        const searchInput = document.querySelector('input[placeholder="搜索服务..."]');
        const statusSelect = document.querySelector('select[onchange*="filterByStatus"]');
        
        let matchesSearch = true;
        let matchesStatus = true;

        if (searchInput?.value) {
            const term = searchInput.value.toLowerCase();
            matchesSearch = service.name.toLowerCase().includes(term) ||
                           service.description.toLowerCase().includes(term);
        }

        if (statusSelect?.value) {
            matchesStatus = service.status === statusSelect.value;
        }

        return matchesSearch && matchesStatus;
    }

    searchServices(term) {
        this.renderServicesTable(this.services.filter(s => this.shouldShowService(s)));
    }

    filterByStatus(status) {
        this.renderServicesTable(this.services.filter(s => this.shouldShowService(s)));
    }

    sortServices(sortBy) {
        let sorted = [...this.services];
        
        switch(sortBy) {
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'cpu-desc':
                sorted.sort((a, b) => b.cpu - a.cpu);
                break;
            case 'cpu-asc':
                sorted.sort((a, b) => a.cpu - b.cpu);
                break;
            case 'memory-desc':
                sorted.sort((a, b) => b.memory - a.memory);
                break;
            case 'memory-asc':
                sorted.sort((a, b) => a.memory - b.memory);
                break;
            case 'uptime':
                sorted.sort((a, b) => {
                    if (a.uptime === '-') return 1;
                    if (b.uptime === '-') return -1;
                    return 0;
                });
                break;
        }
        
        this.renderServicesTable(sorted);
    }

    searchProcesses(term) {
        if (!term.trim()) {
            this.renderProcessesTable(this.processes);
            return;
        }
        
        const filtered = this.processes.filter(p =>
            p.command.toLowerCase().includes(term.toLowerCase()) ||
            p.user.toLowerCase().includes(term.toLowerCase()) ||
            p.pid.toString().includes(term)
        );
        
        this.renderProcessesTable(filtered);
    }

    filterByUser(user) {
        if (!user) {
            this.renderProcessesTable(this.processes);
            return;
        }
        
        this.renderProcessesTable(this.processes.filter(p => p.user === user));
    }

    filterByState(state) {
        if (!state) {
            this.renderProcessesTable(this.processes);
            return;
        }
        
        this.renderProcessesTable(this.processes.filter(p => p.state === state));
    }

    sortProcesses(field) {
        const sorted = [...this.processes].sort((a, b) => {
            if (field === 'pid') return a.pid - b.pid;
            if (field === 'user') return a.user.localeCompare(b.user);
            if (field === 'cpu') return b.cpu - a.cpu;
            if (field === 'memory') return b.memory - a.memory;
            return 0;
        });
        
        this.renderProcessesTable(sorted);
    }

    startService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        Utils.showToast(`正在启动服务: ${service.name}...`, 'info');
        
        setTimeout(() => {
            service.status = 'running';
            service.pid = Math.floor(Math.random() * 9000) + 1000;
            service.cpu = Math.random() * 3;
            service.memory = Math.random() * 200 + 10;
            service.memoryMB = service.memory;
            service.uptime = '刚刚';
            service.healthCheck = 'healthy';
            
            this.renderServicesView(document.getElementById('servicesViewContainer'));
            Utils.showToast(`服务 ${service.name} 已成功启动`, 'success');
            
            eventBus.emit('notification:alert', {
                type: 'success',
                title: '服务启动成功',
                message: `服务 ${service.name} (PID: ${service.pid}) 已正常运行`,
                timestamp: new Date()
            });
        }, 1500);
    }

    stopService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        if (confirm(`确定要停止服务 ${service.name} 吗？\n\n这可能会影响依赖该服务的其他应用。`)) {
            Utils.showToast(`正在停止服务: ${service.name}...`, 'warning');
            
            setTimeout(() => {
                service.status = 'stopped';
                service.pid = null;
                service.cpu = 0;
                service.memory = 0;
                service.memoryMB = 0;
                service.uptime = '-';
                service.healthCheck = 'unknown';
                
                this.renderServicesView(document.getElementById('servicesViewContainer'));
                Utils.showToast(`服务 ${service.name} 已停止`, 'warning');
                
                eventBus.emit('notification:alert', {
                    type: 'warning',
                    title: '服务已停止',
                    message: `服务 ${service.name} 已手动停止`,
                    timestamp: new Date()
                });
            }, 1000);
        }
    }

    restartService(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        Utils.showToast(`正在重启服务: ${service.name}...`, 'info');
        
        setTimeout(() => {
            service.restartCount++;
            service.lastRestart = new Date().toISOString().replace('T', ' ').substring(0, 19);
            service.pid = Math.floor(Math.random() * 9000) + 1000;
            service.uptime = '刚刚';
            service.healthCheck = 'healthy';
            
            this.renderServicesView(document.getElementById('servicesViewContainer'));
            Utils.showToast(`服务 ${service.name} 重启成功`, 'success');
            
            eventBus.emit('notification:alert', {
                type: 'info',
                title: '服务重启完成',
                message: `服务 ${service.name} 已成功重启 (第 ${service.restartCount} 次)`,
                timestamp: new Date()
            });
        }, 2000);
    }

    killProcess(pid) {
        if (pid <= 100) {
            Utils.showToast('无法终止系统关键进程！', 'error');
            return;
        }

        const process = this.processes.find(p => p.pid === pid);
        if (!process) return;

        if (confirm(`确定要终止进程 PID: ${pid} (${process.command}) 吗？`)) {
            Utils.showToast(`正在终止进程 PID: ${pid}...`, 'warning');
            
            setTimeout(() => {
                this.processes = this.processes.filter(p => p.pid !== pid);
                this.renderProcessesView(document.getElementById('servicesViewContainer'));
                Utils.showToast(`进程 ${pid} 已终止`, 'success');
            }, 800);
        }
    }

    showProcessDetails(pid) {
        const process = this.processes.find(p => p.pid === pid);
        if (!process) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📋 进程详情 - PID: ${pid}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-2" style="gap: 16px;">
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">基本信息</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">PID:</td><td style="padding: 4px;"><code>${process.pid}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">用户:</td><td style="padding: 4px;">${process.user}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">状态:</td><td style="padding: 4px;"><span class="status-badge success">${process.state}</span></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">线程数:</td><td style="padding: 4px;">${process.threads}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">父进程:</td><td style="padding: 4px;"><code>${process.parentPid}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">启动时间:</td><td style="padding: 4px;">${process.startTime}</td></tr>
                            </table>
                        </div>
                        
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">资源使用</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">CPU:</td><td style="padding: 4px;"><strong style="color: ${process.cpu > 10 ? 'var(--danger)' : 'var(--text-primary)'};">${process.cpu.toFixed(1)}%</strong></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">内存:</td><td style="padding: 4px;"><strong>${process.memory.toFixed(1)} MB</strong></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">虚拟内存:</td><td style="padding: 4px;">${(process.memory * 2.5).toFixed(1)} MB</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">共享内存:</td><td style="padding: 4px;">${(process.memory * 0.3).toFixed(1)} MB</td></tr>
                            </table>
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-top: 16px;">
                        <h4 style="margin-bottom: 12px; font-size: 14px;">完整命令</h4>
                        <pre style="background: var(--bg-tertiary); padding: 12px; border-radius: 4px; font-size: 12px; overflow-x: auto; margin: 0;">${process.command}</pre>
                    </div>
                    
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-top: 16px;">
                        <h4 style="margin-bottom: 12px; font-size: 14px;">文件描述符</h4>
                        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px;">
                            <div><strong>打开的文件:</strong> ${Math.floor(process.threads * 3)}</div>
                            <div><strong>网络连接:</strong> ${Math.floor(Math.random() * 10)}</div>
                            <div><strong>管道:</strong> ${Math.floor(Math.random() * 5)}</div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" onclick="servicesModule.killProcess(${pid}); this.closest('.modal-overlay').remove();" ${pid <= 100 ? 'disabled' : ''}>⛔ 终止进程</button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    viewServiceDetails(id) {
        const service = this.services.find(s => s.id === id);
        if (!service) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">🔧 服务详情 - ${service.name}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-3" style="gap: 20px; margin-bottom: 24px;">
                        <div style="text-align: center; padding: 20px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <div style="
                                width: 72px; height: 72px; border-radius: 50%;
                                background: ${service.status === 'running' ? '#10b981' : service.status === 'stopped' ? '#f59e0b' : '#ef4444'};
                                margin: 0 auto 12px;
                                display: flex; align-items: center; justify-content: center;
                                font-size: 32px; color: white;
                            ">${service.status === 'running' ? '✓' : service.status === 'stopped' ? '○' : '✕'}</div>
                            <h3 style="margin: 0 0 4px;">${service.name}</h3>
                            <span class="status-badge ${service.status === 'running' ? 'success' : service.status === 'stopped' ? 'warning' : 'danger'}" style="font-size: 13px;">
                                ${service.status === 'running' ? '运行中' : service.status === 'stopped' ? '已停止' : '异常'}
                            </span>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">📋 基本信息</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">版本:</td><td style="padding: 4px;"><code>v${service.version}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">PID:</td><td style="padding: 4px;"><code>${service.pid || '-'}</code></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">端口:</td><td style="padding: 4px;">${service.port ? `<code>${service.port}</code>` : '-'}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">自动启动:</td><td style="padding: 4px;">${service.autoStart ? '✓ 是' : '✗ 否'}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">运行时间:</td><td style="padding: 4px;">${service.uptime || '-'}</td></tr>
                            </table>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">📊 资源使用</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">CPU:</td><td style="padding: 4px;"><strong style="color: ${service.cpu > 5 ? 'var(--danger)' : 'var(--text-primary)'};">${service.cpu}%</strong></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">内存:</td><td style="padding: 4px;"><strong>${service.memory > 1024 ? (service.memory / 1024).toFixed(1) + ' GB' : service.memory + ' MB'}</strong></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">响应时间:</td><td style="padding: 4px;">${service.responseTime !== null ? service.responseTime + 'ms' : '-'}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">活跃连接:</td><td style="padding: 4px;"><strong>${service.connections}</strong></td></tr>
                            </table>
                        </div>
                    </div>

                    <div class="grid grid-2" style="gap: 20px;">
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">❤️ 健康状态</h4>
                            <div style="text-align: center; padding: 20px;">
                                <div style="
                                    width: 100px; height: 100px; border-radius: 50%;
                                    background: ${service.healthCheck === 'healthy' ? '#10b981' : service.healthCheck === 'warning' ? '#f59e0b' : service.healthCheck === 'critical' ? '#ef4444' : '#6b7280'};
                                    margin: 0 auto 16px;
                                    display: flex; align-items: center; justify-content: center;
                                    font-size: 48px; color: white;
                                ">${service.healthCheck === 'healthy' ? '✓' : service.healthCheck === 'warning' ? '!' : service.healthCheck === 'critical' ? '✕' : '?'}</div>
                                <span class="status-badge ${service.healthCheck === 'healthy' ? 'success' : service.healthCheck === 'warning' ? 'warning' : service.healthCheck === 'critical' ? 'danger' : 'default'}" style="font-size: 14px;">
                                    ${service.healthCheck === 'healthy' ? '健康运行' : service.healthCheck === 'warning' ? '需要关注' : service.healthCheck === 'critical' ? '严重异常' : '未知'}
                                </span>
                            </div>
                        </div>

                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md);">
                            <h4 style="margin-bottom: 12px; font-size: 14px;">🔄 运行历史</h4>
                            <table style="width: 100%; font-size: 13px;">
                                <tr><td style="padding: 4px; color: var(--text-secondary);">重启次数:</td><td style="padding: 4px;"><strong style="color: ${service.restartCount > 3 ? 'var(--danger)' : 'var(--text-primary)'};">${service.restartCount} 次</strong></td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">上次重启:</td><td style="padding: 4px;">${service.lastRestart || '-'}</td></tr>
                                <tr><td style="padding: 4px; color: var(--text-secondary);">崩溃频率:</td><td style="padding: 4px;">${service.restartCount > 3 ? '频繁 (需关注)' : '正常'}</td></tr>
                            </table>
                        </div>
                    </div>

                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); margin-top: 20px;">
                        <h4 style="margin-bottom: 12px; font-size: 14px;">🔗 服务依赖</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${(service.dependencies || []).map(dep => {
                                const depService = this.services.find(s => s.name === dep);
                                const isSystemTarget = dep.includes('.target') || dep.includes('.service');
                                
                                return isSystemTarget ?
                                    `<code style="font-size: 12px; padding: 4px 8px; background: var(--bg-tertiary); border-radius: 4px;">⚙️ ${dep}</code>` :
                                    `<span class="status-badge ${depService?.status === 'running' ? 'success' : 'warning'}" style="font-size: 12px;">
                                        ${depService?.status === 'running' ? '✓' : '○'} ${dep}
                                    </span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    ${service.status === 'running' ? `
                        <button class="btn btn-warning" onclick="servicesModule.restartService('${service.id}'); this.closest('.modal-overlay').remove();">🔄 重启服务</button>
                        <button class="btn btn-danger" onclick="servicesModule.stopService('${service.id}'); this.closest('.modal-overlay').remove();">⏹ 停止服务</button>
                    ` : `
                        <button class="btn btn-success" onclick="servicesModule.startService('${service.id}'); this.closest('.modal-overlay').remove();">▶ 启动服务</button>
                    `}
                    <button class="btn btn-outline" onclick="showPage('logs'); this.closest('.modal-overlay').remove();">📜 查看日志</button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showAddServiceModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">➕ 添加新服务</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <label class="form-label">服务名称 *</label>
                        <input type="text" class="form-input" id="newServiceName" placeholder="例如: myapp" required>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label class="form-label">描述</label>
                        <input type="text" class="form-input" id="newServiceDesc" placeholder="服务描述">
                    </div>
                    <div class="grid grid-2" style="margin-bottom: 20px;">
                        <div>
                            <label class="form-label">可执行路径 *</label>
                            <input type="text" class="form-input" id="newServiceExec" placeholder="/usr/local/bin/myapp" required>
                        </div>
                        <div>
                            <label class="form-label">工作目录</label>
                            <input type="text" class="form-input" id="newServiceWorkDir" placeholder="/opt/myapp">
                        </div>
                    </div>
                    <div class="grid grid-2" style="margin-bottom: 20px;">
                        <div>
                            <label class="form-label">监听端口</label>
                            <input type="number" class="form-input" id="newServicePort" placeholder="例如: 8080">
                        </div>
                        <div>
                            <label class="form-label">运行用户</label>
                            <select class="form-select" id="newServiceUser">
                                <option value="root">root</option>
                                <option value="www-data">www-data</option>
                                <option value="mysql">mysql</option>
                                <option value="xutao" selected>xutao</option>
                            </select>
                        </div>
                    </div>
                    <div class="grid grid-2" style="margin-bottom: 20px;">
                        <div>
                            <label class="form-label">自动重启策略</label>
                            <select class="form-select" id="newServiceRestart">
                                <option value="no">不自动重启</option>
                                <option value="on-success" selected>成功后重启</option>
                                <option value="on-failure">失败时重启</option>
                                <option value="always">总是重启</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">开机自启</label>
                            <select class="form-select" id="newServiceAutoStart">
                                <option value="yes" selected>是</option>
                                <option value="no">否</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin-bottom: 20px;">
                        <label class="form-label">依赖服务</label>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            ${['network.target', 'mysql', 'redis', 'docker'].map(dep => `
                                <label style="display: flex; align-items: center; gap: 4px; cursor: pointer; font-size: 13px;">
                                    <input type="checkbox" value="${dep}" class="service-dep-checkbox"> ${dep}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <label class="form-label">环境变量 (每行一个)</label>
                        <textarea class="form-textarea" id="newServiceEnv" rows="3" placeholder="NODE_ENV=production&#10;PORT=8080&#10;DATABASE_URL=mysql://localhost/mydb"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="servicesModule.createNewService()">创建服务</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createNewService() {
        const name = document.getElementById('newServiceName')?.value?.trim();
        const execPath = document.getElementById('newServiceExec')?.value?.trim();
        
        if (!name || !execPath) {
            Utils.showToast('请填写必填字段', 'error');
            return;
        }

        const newService = {
            id: `svc-${Date.now()}`,
            name: name,
            status: 'stopped',
            cpu: 0,
            memory: 0,
            memoryMB: 0,
            uptime: '-',
            pid: null,
            description: document.getElementById('newServiceDesc')?.value || '自定义服务',
            version: '1.0.0',
            port: parseInt(document.getElementById('newServicePort')?.value) || null,
            autoStart: document.getElementById('newServiceAutoStart')?.value === 'yes',
            restartCount: 0,
            lastRestart: null,
            dependencies: Array.from(document.querySelectorAll('.service-dep-checkbox:checked')).map(cb => cb.value),
            healthCheck: 'unknown',
            responseTime: null,
            connections: 0
        };

        this.services.push(newService);
        this.renderServicesView(document.getElementById('servicesViewContainer'));
        
        document.querySelector('.modal-overlay')?.remove();
        Utils.showToast(`服务 ${name} 创建成功`, 'success');
        
        eventBus.emit('notification:alert', {
            type: 'success',
            title: '新服务创建',
            message: `服务 ${name} 已添加到服务列表`,
            timestamp: new Date()
        });
    }

    showBatchOperationsModal() {
        if (this.selectedServices.size === 0) {
            Utils.showToast('请先选择要操作的服务', 'warning');
            return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📦 批量操作 - ${this.selectedServices.size} 个服务</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <h4 style="margin-bottom: 12px;">选中的服务：</h4>
                        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                            ${Array.from(this.selectedServices).map(id => {
                                const service = this.services.find(s => s.id === id);
                                return service ? `<span class="status-badge ${service.status === 'running' ? 'success' : 'warning'}">${service.name}</span>` : '';
                            }).join('')}
                        </div>
                    </div>
                    
                    <div class="grid grid-2" style="gap: 12px;">
                        <button class="btn btn-success" onclick="servicesModule.batchOperation('start')" style="padding: 16px;">
                            <div style="font-size: 24px; margin-bottom: 4px;">▶</div>
                            <div>批量启动</div>
                        </button>
                        <button class="btn btn-warning" onclick="servicesModule.batchOperation('restart')" style="padding: 16px;">
                            <div style="font-size: 24px; margin-bottom: 4px;">🔄</div>
                            <div>批量重启</div>
                        </button>
                        <button class="btn btn-danger" onclick="servicesModule.batchOperation('stop')" style="padding: 16px;">
                            <div style="font-size: 24px; margin-bottom: 4px;">⏹</div>
                            <div>批量停止</div>
                        </button>
                        <button class="btn btn-outline" onclick="servicesModule.batchOperation('enable-autostart')" style="padding: 16px;">
                            <div style="font-size: 24px; margin-bottom: 4px;">⚡</div>
                            <div>启用自启</div>
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    batchOperation(operation) {
        const selectedArray = Array.from(this.selectedServices);
        let successCount = 0;
        let failCount = 0;

        selectedArray.forEach(id => {
            const service = this.services.find(s => s.id === id);
            if (!service) return;

            switch(operation) {
                case 'start':
                    if (service.status !== 'running') {
                        service.status = 'running';
                        service.pid = Math.floor(Math.random() * 9000) + 1000;
                        service.uptime = '刚刚';
                        successCount++;
                    }
                    break;
                case 'stop':
                    if (service.status === 'running') {
                        service.status = 'stopped';
                        service.pid = null;
                        successCount++;
                    }
                    break;
                case 'restart':
                    if (service.status === 'running') {
                        service.restartCount++;
                        service.lastRestart = new Date().toISOString().replace('T', ' ').substring(0, 19);
                        service.pid = Math.floor(Math.random() * 9000) + 1000;
                        service.uptime = '刚刚';
                        successCount++;
                    }
                    break;
                case 'enable-autostart':
                    service.autoStart = true;
                    successCount++;
                    break;
            }
        });

        this.selectedServices.clear();
        this.renderServicesView(document.getElementById('servicesViewContainer'));
        document.querySelector('.modal-overlay')?.remove();
        
        Utils.showToast(`${operation === 'start' ? '启动' : operation === 'stop' ? '停止' : operation === 'restart' ? '重启' : '设置自启'}完成：成功 ${successCount} 个，失败 ${failCount} 个`, 'success');
    }

    showDependencyGraph() {
        this.switchView('dependencies', document.querySelector('.tabs .tab:nth-child(4)'));
    }

    exportDependencyGraph() {
        const data = {
            generated_at: new Date().toISOString(),
            nodes: [...new Set(this.serviceDependencies.flatMap(d => [d.source, d.target]))].map(name => ({
                name,
                type: this.services.some(s => s.name === name) ? 'service' : 'system_target',
                status: this.services.find(s => s.name === name)?.status || 'unknown'
            })),
            edges: this.serviceDependencies
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `service-dependencies-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        Utils.showToast('依赖图已导出为JSON文件', 'success');
    }

    checkCircularDependencies() {
        const graph = {};
        
        this.serviceDependencies.forEach(dep => {
            if (!graph[dep.source]) graph[dep.source] = [];
            graph[dep.source].push(dep.target);
        });

        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const dfs = (node, path) => {
            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            (graph[node] || []).forEach(neighbor => {
                if (!visited.has(neighbor)) {
                    dfs(neighbor, [...path]);
                } else if (recursionStack.has(neighbor)) {
                    const cycleStart = path.indexOf(neighbor);
                    cycles.push([...path.slice(cycleStart), neighbor]);
                }
            });

            recursionStack.delete(node);
        };

        Object.keys(graph).forEach(node => {
            if (!visited.has(node)) {
                dfs(node, []);
            }
        });

        if (cycles.length === 0) {
            Utils.showToast('✅ 未检测到循环依赖', 'success');
        } else {
            const modal = document.createElement('div');
            modal.className = 'modal-overlay';
            modal.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">⚠️ 发现 ${cycles.length} 个循环依赖</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                    </div>
                    <div class="modal-body">
                        ${cycles.map((cycle, index) => `
                            <div style="padding: 12px; background: var(--danger); color: white; border-radius: var(--radius-md); margin-bottom: 12px;">
                                <strong>循环 #${index + 1}:</strong> ${cycle.join(' → ')}
                            </div>
                        `).join('')}
                        <div style="margin-top: 16px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                            <strong>💡 建议：</strong>
                            <ul style="margin: 8px 0 0 20px; line-height: 1.6;">
                                <li>循环依赖可能导致服务无法正常启动</li>
                                <li>请重新设计服务依赖关系，打破循环</li>
                                <li>考虑引入中间件或事件驱动架构</li>
                            </ul>
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

    setPerfTimeRange(range) {
        document.querySelectorAll('[onclick^="servicesModule.setPerfTimeRange"]').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        Utils.showToast(`已切换到 ${range} 时间范围视图`, 'info');
    }

    startAutoRefresh() {
        this.refreshInterval = setInterval(() => {
            if (this.currentView === 'performance') {
                this.updatePerformanceData();
            }
        }, 5000);
    }

    destroy() {
        eventBus.off('services:refresh');
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }
}

let servicesModule;