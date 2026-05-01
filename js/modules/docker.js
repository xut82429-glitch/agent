class DockerModule {
    constructor() {
        this.containers = [];
        this.images = [];
        this.volumes = [];
        this.networks = [];
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.loadDockerData();
        this.startAutoRefresh();
        eventBus.on('docker:refresh', () => this.loadDockerData());
    }

    render() {
        const container = document.getElementById('page-docker');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>🐳 Docker 容器管理</h2>
                <div class="header-actions">
                    <span class="status-badge success pulse" id="dockerDaemonStatus">● Docker 运行中</span>
                    <button class="btn btn-primary" onclick="dockerModule.showCreateContainerModal()">➕ 创建容器</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('docker:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalContainers">0</div>
                    <div class="stat-label">总容器数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="runningContainers">0</div>
                    <div class="stat-label">运行中</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="stoppedContainers">0</div>
                    <div class="stat-label">已停止</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="totalImages">0</div>
                    <div class="stat-label">镜像数量</div>
                </div>
            </div>

            <div class="tabs">
                <button class="tab active" onclick="dockerModule.switchTab('containers', this)">📦 容器</button>
                <button class="tab" onclick="dockerModule.switchTab('images', this)">🖼️ 镜像</button>
                <button class="tab" onclick="dockerModule.switchTab('volumes', this)">💾 卷</button>
                <button class="tab" onclick="dockerModule.switchTab('networks', this;">🌐 网络</button>
            </div>

            <!-- 容器列表 -->
            <div id="tab-containers" class="settings-tab">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📦 容器列表</h3>
                        <div class="filter-bar" style="margin: 0;">
                            <input type="text" placeholder="搜索容器..." class="form-input" style="max-width: 300px;" oninput="dockerModule.searchContainers(this.value)">
                            <select class="form-select" style="width: auto;" onchange="dockerModule.filterByState(this.value)">
                                <option value="">所有状态</option>
                                <option value="running">运行中</option>
                                <option value="exited">已退出</option>
                                <option value="created">已创建</option>
                            </select>
                        </div>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>容器ID</th>
                                    <th>名称</th>
                                    <th>镜像</th>
                                    <th>状态</th>
                                    <th>端口</th>
                                    <th>CPU%</th>
                                    <th>内存</th>
                                    <th>运行时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="containersTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 镜像列表 -->
            <div id="tab-images" class="settings-tab hidden">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🖼️ 镜像列表</h3>
                        <button class="btn btn-primary btn-sm" onclick="dockerModule.pullImage()">⬇️ 拉取镜像</button>
                    </div>
                    <div id="imagesGrid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 16px; padding: 16px 0;"></div>
                </div>
            </div>

            <!-- 卷列表 -->
            <div id="tab-volumes" class="settings-tab hidden">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">💾 数据卷</h3>
                        <button class="btn btn-primary btn-sm" onclick="dockerModule.createVolume()">➕ 创建卷</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>名称</th>
                                    <th>驱动</th>
                                    <th>挂载点</th>
                                    <th>大小</th>
                                    <th>容器数</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="volumesTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- 网络列表 -->
            <div id="tab-networks" class="settings-tab hidden">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🌐 Docker网络</h3>
                        <button class="btn btn-primary btn-sm" onclick="dockerModule.createNetwork()">➕ 创建网络</button>
                    </div>
                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>名称</th>
                                    <th>驱动</th>
                                    <th>子网</th>
                                    <th>网关</th>
                                    <th>容器数</th>
                                    <th>作用域</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody id="networksTableBody"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    loadDockerData() {
        this.containers = [
            { id: 'a1b2c3d4', name: 'web-server', image: 'nginx:latest', status: 'running', ports: '80:8080, 443:8443', cpu: '2.3%', mem: '256MB', uptime: '15天 8小时' },
            { id: 'e5f6g7h8', name: 'database', image: 'mysql:8.0', status: 'running', ports: '3306:3306', cpu: '8.1%', mem: '512MB', uptime: '30天 2小时' },
            { id: 'i9j0k1l2', name: 'redis-cache', image: 'redis:alpine', status: 'running', ports: '6379:6379', cpu: '0.5%', mem: '32MB', uptime: '10天 14小时' },
            { id: 'm3n4o5p6', name: 'app-backend', image: 'node:18-alpine', status: 'exited', ports: '3000:3000', cpu: '-', mem: '-', uptime: '-' },
            { id: 'q7r8s9t0', name: 'worker', image: 'python:3.10', status: 'created', ports: '-', cpu: '-', mem: '-', uptime: '-' }
        ];

        this.images = [
            { name: 'nginx:latest', size: '142MB', created: '2026-04-28', containers: 1 },
            { name: 'mysql:8.0', size: '528MB', created: '2026-04-25', containers: 1 },
            { name: 'redis:alpine', size: '32MB', created: '2026-04-30', containers: 1 },
            { name: 'node:18-alpine', size: '168MB', created: '2026-04-29', containers: 0 },
            { name: 'python:3.10', size: '485MB', created: '2026-04-27', containers: 0 },
            { name: 'ubuntu:22.04', size: '72MB', created: '2026-05-01', containers: 0 }
        ];

        this.volumes = [
            { name: 'db_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/db_data', size: '12.5 GB', containers: 1 },
            { name: 'app_logs', driver: 'local', mountpoint: '/var/lib/docker/volumes/app_logs', size: '2.3 GB', containers: 2 },
            { name: 'redis_data', driver: 'local', mountpoint: '/var/lib/docker/volumes/redis_data', size: '128 MB', containers: 1 }
        ];

        this.networks = [
            { name: 'bridge', driver: 'bridge', subnet: '172.17.0.0/16', gateway: '172.17.0.1', containers: 5, scope: 'local' },
            { name: 'app_network', driver: 'bridge', subnet: '172.20.0.0/16', gateway: '172.20.0.1', containers: 3, scope: 'local' },
            { name: 'host', driver: 'host', subnet: '-', gateway: '-', containers: 0, scope: 'local' }
        ];

        this.renderContainers();
        this.renderImages();
        this.renderVolumes();
        this.renderNetworks();
        this.updateStats();
    }

    renderContainers(containers = null) {
        const data = containers || this.containers;
        const tbody = document.getElementById('containersTableBody');
        if (!tbody) return;

        tbody.innerHTML = data.map(c => `
            <tr>
                <td><code>${c.id.substring(0, 12)}</code></td>
                <td><strong>${c.name}</strong></td>
                <td><code>${c.image}</code></td>
                <td>
                    <span class="status-badge ${
                        c.status === 'running' ? 'success' :
                        c.status === 'exited' ? 'warning' : 'info'
                    }">${c.status === 'running' ? '● 运行中' : c.status === 'exited' ? '○ 已退出' : '◐ 已创建'}</span>
                </td>
                <td>${c.ports}</td>
                <td>${c.cpu}</td>
                <td>${c.mem}</td>
                <td>${c.uptime || '-'}</td>
                <td>
                    ${c.status === 'running' ? `
                        <button class="btn btn-sm btn-warning" onclick="dockerModule.restartContainer('${c.id}')">重启</button>
                        <button class="btn btn-sm btn-danger" onclick="dockerModule.stopContainer('${c.id}')">停止</button>
                        <button class="btn btn-sm btn-outline" onclick="dockerModule.logsContainer('${c.id}')">日志</button>
                    ` : c.status === 'exited' ? `
                        <button class="btn btn-sm btn-success" onclick="dockerModule.startContainer('${c.id}')">启动</button>
                        <button class="btn btn-sm btn-danger" onclick="dockerModule.removeContainer('${c.id}')">删除</button>
                    ` : `
                        <button class="btn btn-sm btn-success" onclick="dockerModule.startContainer('${c.id}')">启动</button>
                        <button class="btn btn-sm btn-danger" onclick="dockerModule.removeContainer('${c.id}')">删除</button>
                    `}
                </td>
            </tr>
        `).join('');
    }

    renderImages() {
        const grid = document.getElementById('imagesGrid');
        if (!grid) return;

        grid.innerHTML = this.images.map(img => `
            <div class="card" style="margin: 0; padding: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                    <div>
                        <h4 style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">${img.name}</h4>
                        <p style="font-size: 13px; color: var(--text-secondary);">
                            大小: ${img.size} | 容器: ${img.containers}
                        </p>
                    </div>
                    <span class="status-badge info">${img.size}</span>
                </div>
                <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="btn btn-sm btn-outline" onclick="dockerModule.runFromImage('${img.name}')">运行</button>
                    <button class="btn btn-sm btn-danger" onclick="dockerModule.removeImage('${img.name}')">删除</button>
                </div>
            </div>
        `).join('');
    }

    renderVolumes() {
        const tbody = document.getElementById('volumesTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.volumes.map(v => `
            <tr>
                <td><strong>${v.name}</strong></td>
                <td><code>${v.driver}</code></td>
                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis;"><code>${v.mountpoint}</code></td>
                <td>${v.size}</td>
                <td>${v.containers}</td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="dockerModule.removeVolume('${v.name}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    renderNetworks() {
        const tbody = document.getElementById('networksTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.networks.map(n => `
            <tr>
                <td><strong>${n.name}</strong></td>
                <td><code>${n.driver}</code></td>
                <td><code>${n.subnet}</code></td>
                <td><code>${n.gateway}</code></td>
                <td>${n.containers}</td>
                <td><span class="status-badge info">${n.scope}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="dockerModule.removeNetwork('${n.name}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        document.getElementById('totalContainers').textContent = this.containers.length;
        document.getElementById('runningContainers').textContent = this.containers.filter(c => c.status === 'running').length;
        document.getElementById('stoppedContainers').textContent = this.containers.filter(c => c.status !== 'running').length;
        document.getElementById('totalImages').textContent = this.images.length;
    }

    switchTab(tabId, element) {
        document.querySelectorAll('#page-docker .tab').forEach(t => t.classList.remove('active'));
        element.classList.add('active');

        document.querySelectorAll('#page-docker .settings-tab').forEach(tab => tab.classList.add('hidden'));
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    }

    startContainer(id) {
        Utils.showToast('正在启动容器...', 'info');
        setTimeout(() => {
            const container = this.containers.find(c => c.id === id);
            if (container) {
                container.status = 'running';
                container.cpu = Utils.randomInRange(1, 5) + '%';
                container.mem = Utils.randomInRange(50, 500) + 'MB';
                container.uptime = '刚刚';
                this.renderContainers();
                this.updateStats();
                Utils.showToast('容器启动成功！', 'success');
            }
        }, 1500);
    }

    stopContainer(id) {
        const container = this.containers.find(c => c.id === id);
        if (container && confirm(`确定要停止容器 ${container.name} 吗？`)) {
            container.status = 'exited';
            container.cpu = '-';
            container.mem = '-';
            container.uptime = '-';
            this.renderContainers();
            this.updateStats();
            Utils.showToast('容器已停止', 'warning');
        }
    }

    restartContainer(id) {
        Utils.showToast('正在重启容器...', 'info');
        setTimeout(() => {
            Utils.showToast('容器重启成功！', 'success');
        }, 2000);
    }

    removeContainer(id) {
        if (confirm('确定要删除这个容器吗？')) {
            this.containers = this.containers.filter(c => c.id !== id);
            this.renderContainers();
            this.updateStats();
            Utils.showToast('容器已删除', 'success');
        }
    }

    logsContainer(id) {
        showPage('logs');
        Utils.showToast('查看容器日志', 'info');
    }

    showCreateContainerModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal" style="max-width: 700px;">
                <div class="modal-header">
                    <h3 class="modal-title">🐳 创建新容器</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">镜像 *</label>
                        <input type="text" class="form-input" placeholder="例如: nginx:latest, mysql:8.0">
                    </div>
                    <div class="form-group">
                        <label class="form-label">容器名称</label>
                        <input type="text" class="form-input" placeholder="例如: my-web-app">
                    </div>
                    <div class="grid grid-2">
                        <div class="form-group">
                            <label class="form-label">端口映射</label>
                            <input type="text" class="form-input" placeholder="例如: 8080:80">
                        </div>
                        <div class="form-group">
                            <label class="form-label">环境变量</label>
                            <textarea class="form-textarea" rows="3" placeholder="KEY=value&#10;DB_HOST=localhost"></textarea>
                        </div>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" checked style="width: 18px; height: 18px;">
                            <span>自动重启策略 (--restart always)</span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="dockerModule.createContainer()">创建并启动</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createContainer() {
        document.querySelector('.modal-overlay').remove();
        Utils.showToast('正在创建容器...', 'info');
        setTimeout(() => {
            const newContainer = {
                id: Utils.generateId(),
                name: 'new-container-' + Utils.randomInRange(1, 99),
                image: 'nginx:latest',
                status: 'running',
                ports: '80:8080',
                cpu: Utils.randomInRange(1, 5) + '%',
                mem: Utils.randomInRange(50, 200) + 'MB',
                uptime: '刚刚'
            };
            this.containers.unshift(newContainer);
            this.renderContainers();
            this.updateStats();
            Utils.showToast('容器创建并启动成功！', 'success');
        }, 2000);
    }

    pullImage() {
        const image = prompt('请输入要拉取的镜像名称:', 'nginx:latest');
        if (image) {
            Utils.showToast(`正在拉取镜像: ${image}`, 'info');
            setTimeout(() => {
                this.images.unshift({
                    name: image,
                    size: Utils.randomInRange(50, 500) + 'MB',
                    created: new Date().toISOString().split('T')[0],
                    containers: 0
                });
                this.renderImages();
                Utils.showToast('镜像拉取成功！', 'success');
            }, 2500);
        }
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        eventBus.off('docker:refresh');
    }
}

let dockerModule;
