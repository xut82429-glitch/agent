class BackupModule {
    constructor() {
        this.backups = [];
        this.init();
    }

    init() {
        this.render();
        this.loadBackups();
        eventBus.on('backup:refresh', () => this.loadBackups());
    }

    render() {
        const container = document.getElementById('page-backup');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>💾 备份与恢复</h2>
                <div class="header-actions">
                    <button class="btn btn-primary" onclick="backupModule.showCreateBackupModal()">➕ 创建备份</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('backup:refresh')">🔄 刷新</button>
                </div>
            </div>

            <div class="grid grid-4" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalBackups">0</div>
                    <div class="stat-label">备份总数</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="successfulBackups">0</div>
                    <div class="stat-label">成功备份</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px;" id="totalBackupSize">0 GB</div>
                    <div class="stat-label">总占用空间</div>
                </div>
                <div class="card">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="lastBackupTime">-</div>
                    <div class="stat-label">最近备份时间</div>
                </div>
            </div>

            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📅 备份计划</h3>
                        <button class="btn btn-sm btn-outline" onclick="backupModule.showScheduleModal()">编辑计划</button>
                    </div>
                    <div style="padding: 10px 0;">
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-dark); border-radius: var(--radius-md);">
                                <div>
                                    <strong>每日完整备份</strong>
                                    <div style="font-size: 12px; color: var(--text-secondary);">每天凌晨 03:00 自动执行</div>
                                </div>
                                <span class="status-badge success">● 启用</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-dark); border-radius: var(--radius-md);">
                                <div>
                                    <strong>增量备份</strong>
                                    <div style="font-size: 12px; color: var(--text-secondary);">每6小时执行一次</div>
                                </div>
                                <span class="status-badge success">● 启用</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-dark); border-radius: var(--radius-md);">
                                <div>
                                    <strong>数据库备份</strong>
                                    <div style="font-size: 12px; color: var(--text-secondary);">每2小时执行一次</div>
                                </div>
                                <span class="status-badge success">● 启用</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">💽 存储空间使用情况</h3>
                    </div>
                    <div style="padding: 20px 0;">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 48px; font-weight: 700; color: var(--primary);" id="storageUsedPercent">65%</div>
                            <div class="stat-label">已使用</div>
                        </div>
                        <div class="progress-bar" style="height: 12px; margin-bottom: 20px;">
                            <div class="progress-fill" id="storageBar" style="width: 65%; background: linear-gradient(90deg, var(--primary), var(--success));"></div>
                        </div>
                        <div class="grid grid-2" style="gap: 12px; font-size: 13px;">
                            <div style="text-align: center; padding: 12px; background: var(--bg-dark); border-radius: var(--radius-md);">
                                <div style="color: var(--text-muted);">已使用</div>
                                <strong style="font-size: 18px; color: var(--primary);">130 GB</strong>
                            </div>
                            <div style="text-align: center; padding: 12px; background: var(--bg-dark); border-radius: var(--radius-md);">
                                <div style="color: var(--text-muted);">可用空间</div>
                                <strong style="font-size: 18px; color: var(--success);">70 GB</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">📋 备份历史记录</h3>
                    <div class="filter-bar" style="margin: 0;">
                        <select class="form-select" style="width: auto;" onchange="backupModule.filterByType(this.value)">
                            <option value="">所有类型</option>
                            <option value="full">完整备份</option>
                            <option value="incremental">增量备份</option>
                            <option value="database">数据库备份</option>
                        </select>
                        <select class="form-select" style="width: auto;" onchange="backupModule.filterByStatus(this.value)">
                            <option value="">所有状态</option>
                            <option value="completed">已完成</option>
                            <option value="failed">失败</option>
                            <option value="running">进行中</option>
                        </select>
                    </div>
                </div>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>备份名称</th>
                                <th>类型</th>
                                <th>大小</th>
                                <th>创建时间</th>
                                <th>耗时</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="backupsTableBody">
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    loadBackups() {
        this.backups = [
            { name: 'backup_20260501_030000', type: 'full', size: '45.2 GB', time: '2026-05-01 03:00:00', duration: '2小时15分', status: 'completed' },
            { name: 'backup_20260430_210000', type: 'incremental', size: '2.3 GB', time: '2026-04-30 21:00:00', duration: '18分钟', status: 'completed' },
            { name: 'db_backup_20260430_180000', type: 'database', size: '8.5 GB', time: '2026-04-30 18:00:00', duration: '12分钟', status: 'completed' },
            { name: 'backup_20260430_150000', type: 'incremental', size: '1.8 GB', time: '2026-04-30 15:00:00', duration: '15分钟', status: 'completed' },
            { name: 'backup_20260430_030000', type: 'full', size: '43.8 GB', time: '2026-04-30 03:00:00', duration: '2小时08分', status: 'completed' },
            { name: 'backup_20260429_210000', type: 'incremental', size: '0', time: '2026-04-29 21:00:00', duration: '-', status: 'failed' },
            { name: 'db_backup_20260429_180000', type: 'database', size: '8.3 GB', time: '2026-04-29 18:00:00', duration: '11分钟', status: 'completed' },
            { name: 'backup_20260429_030000', type: 'full', size: '42.5 GB', time: '2026-04-29 03:00:00', duration: '2小时05分', status: 'completed' }
        ];

        this.renderBackups();
        this.updateStats();
    }

    renderBackups(filteredBackups = null) {
        const backups = filteredBackups || this.backups;
        const tbody = document.getElementById('backupsTableBody');
        if (!tbody) return;

        tbody.innerHTML = backups.map(backup => `
            <tr>
                <td><strong>${backup.name}</strong></td>
                <td>
                    <span class="status-badge ${
                        backup.type === 'full' ? 'primary' :
                        backup.type === 'incremental' ? 'info' : 'warning'
                    }">${
                        backup.type === 'full' ? '完整' :
                        backup.type === 'incremental' ? '增量' : '数据库'
                    }</span>
                </td>
                <td>${backup.size || '-'}</td>
                <td>${backup.time}</td>
                <td>${backup.duration}</td>
                <td>
                    <span class="status-badge ${
                        backup.status === 'completed' ? 'success' :
                        backup.status === 'failed' ? 'danger' : 'info'
                    }">${
                        backup.status === 'completed' ? '✓ 完成' :
                        backup.status === 'failed' ? '✕ 失败' : '⟳ 进行中'
                    }</span>
                </td>
                <td>
                    ${backup.status === 'completed' ? `
                        <button class="btn btn-sm btn-success" onclick="backupModule.restoreBackup('${backup.name}')">恢复</button>
                        <button class="btn btn-sm btn-outline" onclick="backupModule.downloadBackup('${backup.name}')">下载</button>
                    ` : ''}
                    <button class="btn btn-sm btn-danger" onclick="backupModule.deleteBackup('${backup.name}')">删除</button>
                </td>
            </tr>
        `).join('');
    }

    updateStats() {
        const completed = this.backups.filter(b => b.status === 'completed');
        const totalSize = completed.reduce((sum, b) => sum + parseFloat(b.size) || 0, 0);

        document.getElementById('totalBackups').textContent = this.backups.length;
        document.getElementById('successfulBackups').textContent = completed.length;
        document.getElementById('totalBackupSize').textContent = `${totalSize.toFixed(1)} GB`;
        document.getElementById('lastBackupTime').textContent = this.backups[0] ? this.backups[0].time.split(' ')[0] : '-';
    }

    showCreateBackupModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">💾 创建新备份</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">备份类型 *</label>
                        <select class="form-select" id="backupType">
                            <option value="full">完整备份 (包含所有数据)</option>
                            <option value="incremental">增量备份 (仅变更部分)</option>
                            <option value="database">仅备份数据库</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">备份名称</label>
                        <input type="text" class="form-input" id="backupName" placeholder="自动生成或自定义名称">
                    </div>
                    <div class="form-group">
                        <label class="form-label">备份目标位置</label>
                        <select class="form-select" id="backupLocation">
                            <option value="/var/backups">/var/backups (本地)</option>
                            <option value="/mnt/nas/backups">/mnt/nas/backups (NAS存储)</option>
                            <option value="s3://bucket">S3 云存储 (AWS)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="compressBackup" checked style="width: 18px; height: 18px;">
                            <span>启用压缩 (可节省50-70%空间)</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="encryptBackup" checked style="width: 18px; height: 18px;">
                            <span>启用加密 (AES-256)</span>
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="form-label">备注</label>
                        <textarea class="form-textarea" id="backupNotes" placeholder="添加备份说明..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="backupModule.createBackup()">开始备份</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createBackup() {
        const type = document.getElementById('backupType').value;
        
        document.querySelector('.modal-overlay').remove();

        Utils.showToast(`正在创建${type === 'full' ? '完整' : type === 'incremental' ? '增量' : '数据库'}备份...`, 'info');

        Utils.simulateLoading(() => {
            const newBackup = {
                name: `backup_${new Date().toISOString().replace(/[-:T]/g, '').split('.')[0]}`,
                type: type,
                size: type === 'full' ? '45.5 GB' : type === 'incremental' ? '2.1 GB' : '8.6 GB',
                time: new Date().toLocaleString('zh-CN'),
                duration: type === 'full' ? '2小时12分' : type === 'incremental' ? '16分钟' : '11分钟',
                status: 'completed'
            };

            this.backups.unshift(newBackup);
            this.renderBackups();
            this.updateStats();
            Utils.showToast('备份创建成功！', 'success');
        }, 2500);
    }

    restoreBackup(name) {
        if (confirm(`确定要从备份 "${name}" 恢复系统吗？\n\n警告：此操作将覆盖当前数据，请确保已做好当前数据的备份。`)) {
            Utils.showToast(`正在从备份 ${name} 恢复系统...`, 'info');
            Utils.simulateLoading(() => {
                Utils.showToast('系统恢复成功！建议重启服务器以完成恢复过程。', 'success');
            }, 4000);
        }
    }

    downloadBackup(name) {
        Utils.showToast(`正在准备下载备份: ${name}`, 'info');
        setTimeout(() => {
            Utils.showToast('下载链接已生成！', 'success');
        }, 1500);
    }

    deleteBackup(name) {
        if (confirm(`确定要删除备份 "${name}" 吗？\n\n此操作不可撤销！`)) {
            this.backups = this.backups.filter(b => b.name !== name);
            this.renderBackups();
            this.updateStats();
            Utils.showToast('备份已删除', 'success');
        }
    }

    filterByType(type) {
        if (!type) {
            this.renderBackups();
            return;
        }
        const filtered = this.backups.filter(b => b.type === type);
        this.renderBackups(filtered);
    }

    filterByStatus(status) {
        if (!status) {
            this.renderBackups();
            return;
        }
        const filtered = this.backups.filter(b => b.status === status);
        this.renderBackups(filtered);
    }

    showScheduleModal() {
        Utils.showToast('备份计划设置功能开发中...', 'info');
    }

    destroy() {
        eventBus.off('backup:refresh');
    }
}

let backupModule;
