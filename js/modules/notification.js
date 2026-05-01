class NotificationCenter {
    constructor() {
        this.notifications = [];
        this.alertRules = [];
        this.webhooks = [];
        this.unreadCount = 0;
        this.isEnabled = true;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        this.render();
        this.loadNotifications();
        this.initAlertRules();
        this.loadWebhooks();
        this.startRealtimePush();
        eventBus.on('security:alert', (data) => this.handleSecurityAlert(data));
        eventBus.on('notification:refresh', () => this.loadNotifications());
    }

    render() {
        const container = document.getElementById('page-notifications');
        
        if (!container) {
            const mainContent = document.getElementById('mainContent');
            if (!mainContent) return;

            const pageDiv = document.createElement('div');
            pageDiv.id = 'page-notifications';
            pageDiv.className = 'page-content';
            pageDiv.style.display = 'none';
            mainContent.appendChild(pageDiv);
        }

        const notificationContainer = document.getElementById('page-notifications');
        if (!notificationContainer) return;

        notificationContainer.innerHTML = `
            <div class="header">
                <h2>🔔 通知中心 v3.1</h2>
                <div class="header-actions">
                    <span class="status-badge success pulse" id="notificationStatus">● 通知服务运行中</span>
                    <button class="btn btn-outline" onclick="notificationCenter.toggleNotificationService()" id="toggleNotifBtn">
                        ⏸️ 暂停服务
                    </button>
                    <button class="btn btn-primary" onclick="notificationCenter.showCreateRuleModal()">
                        ➕ 创建告警规则
                    </button>
                    <button class="btn btn-outline" onclick="eventBus.emit('notification:refresh')">🔄 刷新</button>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-5" style="margin-bottom: 24px;">
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px;" id="totalNotifications">0</div>
                    <div class="stat-label">总通知数</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="unreadNotifications">0</div>
                    <div class="stat-label">未读消息</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="criticalAlertsCount">0</div>
                    <div class="stat-label">🔴 严重告警</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="resolvedToday">0</div>
                    <div class="stat-label">✅ 今日已处理</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="activeWebhooks">0</div>
                    <div class="stat-label">🔗 活跃Webhook</div>
                </div>
            </div>

            <!-- 主内容区 -->
            <div class="grid grid-3" style="gap: 20px;">
                <!-- 通知列表 -->
                <div class="card" style="grid-column: span 2;">
                    <div class="card-header">
                        <h3 class="card-title">📬 通知列表</h3>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <select class="form-select" style="width: auto; font-size: 13px;" onchange="notificationCenter.filterByType(this.value)" id="notifTypeFilter">
                                <option value="">所有类型</option>
                                <option value="security_alert">🛡️ 安全告警</option>
                                <option value="system_event">💻 系统事件</option>
                                <option value="performance">📊 性能警告</option>
                                <option value="user_action">👤 用户操作</option>
                                <option value="backup_status">💾 备份状态</option>
                            </select>
                            <select class="form-select" style="width: auto; font-size: 13px;" onchange="notificationCenter.filterByStatus(this.value)" id="notifStatusFilter">
                                <option value="">所有状态</option>
                                <option value="unread">未读</option>
                                <option value="read">已读</option>
                                <option value="acknowledged">已确认</option>
                            </select>
                            <button class="btn btn-sm btn-success" onclick="notificationCenter.markAllAsRead()">
                                ✓ 全部标记已读
                            </button>
                        </div>
                    </div>

                    <div id="notificationsList" style="max-height: 550px; overflow-y: auto;"></div>

                    <div class="table-footer" style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                        <span id="notifPaginationInfo">显示 0 条通知</span>
                        <button class="btn btn-sm btn-danger" onclick="notificationCenter.clearAllNotifications()">
                            🗑️ 清空所有
                        </button>
                    </div>
                </div>

                <!-- 右侧面板 -->
                <div style="display: flex; flex-direction: column; gap: 20px;">
                    <!-- 快速设置 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">⚙️ 快速设置</h3>
                        </div>
                        <div style="padding: 8px 0;">
                            <label class="checkbox-label" style="margin-bottom: 12px; display: block;">
                                <input type="checkbox" checked onchange="notificationCenter.toggleEmailAlerts(this.checked)">
                                📧 启用邮件告警
                            </label>
                            <label class="checkbox-label" style="margin-bottom: 12px; display: block;">
                                <input type="checkbox" checked onchange="notificationCenter.toggleBrowserPush(this.checked)">
                                🔔 启用浏览器推送
                            </label>
                            <label class="checkbox-label" style="margin-bottom: 12px; display: block;">
                                <input type="checkbox" onchange="notificationCenter.toggleSoundAlerts(this.checked)">
                                🔊 启用声音提示
                            </label>
                            <label class="checkbox-label" style="margin-bottom: 12px; display: block;">
                                <input type="checkbox" checked onchange="notificationCenter.toggleAutoResolve(this.checked)">
                                ✨ 自动归档低优先级通知（24小时后）
                            </label>
                            
                            <hr style="border-color: var(--border-color); margin: 16px 0;">
                            
                            <div class="form-group">
                                <label class="form-label" style="font-size: 13px;">静默时段</label>
                                <select class="form-select" style="font-size: 13px;" onchange="notificationCenter.setQuietHours(this.value)">
                                    <option value="none">无限制</option>
                                    <option value="night">夜间模式 (22:00-08:00)</option>
                                    <option value="weekend">周末静默</option>
                                    <option value="custom">自定义...</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- 告警规则预览 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">📋 活跃告警规则</h3>
                            <button class="btn btn-xs btn-primary" onclick="notificationCenter.showCreateRuleModal()">+ 新建</button>
                        </div>
                        <div id="alertRulesPreview" style="max-height: 200px; overflow-y: auto;"></div>
                    </div>

                    <!-- 最近Webhook调用 -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">🔗 Webhook活动</h3>
                            <button class="btn btn-xs btn-outline" onclick="notificationCenter.showWebhookManager()">管理</button>
                        </div>
                        <div id="webhookActivity" style="padding: 12px 0;"></div>
                    </div>
                </div>
            </div>

            <!-- 实时事件流 -->
            <div class="card" style="margin-top: 24px;">
                <div class="card-header">
                    <h3 class="card-title">⚡ 实时事件流</h3>
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <span class="status-badge success pulse" id="eventStreamStatus">● LIVE</span>
                        <button class="btn btn-sm btn-outline" onclick="notificationCenter.pauseEventStream()">
                            暂停
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="notificationCenter.clearEventStream()">
                            清空
                        </button>
                    </div>
                </div>
                <div id="eventStream" style="height: 250px; overflow-y: auto; background: #1a1a2e; border-radius: var(--radius-md); padding: 16px; font-family: monospace; font-size: 13px;"></div>
            </div>
        `;
    }

    loadNotifications() {
        const baseTime = new Date('2026-05-01T14:00:00');
        
        this.notifications = [
            {
                id: 1,
                timestamp: '2026-05-01 14:35:22',
                type: 'security_alert',
                severity: 'critical',
                title: '🚨 入侵检测警报 - 暴力破解攻击',
                message: '检测到来自IP 203.0.113.50的SSH暴力破解攻击，15分钟内尝试1247次登录',
                source: 'IDS',
                status: 'unread',
                actions: ['查看详情', '封禁IP', '忽略'],
                metadata: { attackerIP: '203.0.113.50', attempts: 1247, duration: '15min' }
            },
            {
                id: 2,
                timestamp: '2026-05-01 14:32:45',
                type: 'performance',
                severity: 'warning',
                title: '⚠️ 系统性能警告 - CPU使用率过高',
                message: 'CPU使用率达到87%，持续超过5分钟。建议检查是否有异常进程。',
                source: 'SystemMonitor',
                status: 'unread',
                actions: ['查看进程', '忽略'],
                metadata: { cpuUsage: 87, duration: '5min', threshold: 80 }
            },
            {
                id: 3,
                timestamp: '2026-05-01 14:30:18',
                type: 'system_event',
                severity: 'info',
                title: '✅ 系统更新完成',
                message: 'Linux内核已成功更新至版本5.15.0-106-generic，需要重启以生效。',
                source: 'Package Manager',
                status: 'acknowledged',
                actions: ['计划重启', '稍后提醒'],
                metadata: { package: 'linux-image', version: '5.15.0-106' }
            },
            {
                id: 4,
                timestamp: '2026-05-01 14:28:33',
                type: 'backup_status',
                severity: 'success',
                title: '✅ 备份任务完成',
                message: '每日自动备份已完成：备份大小2.3GB，耗时4分32秒，存储位置：/backup/daily/',
                source: 'Backup System',
                status: 'read',
                actions: ['查看报告', '恢复测试'],
                metadata: { size: '2.3GB', duration: '4m32s', location: '/backup/daily/' }
            },
            {
                id: 5,
                timestamp: '2026-05-01 14:25:09',
                type: 'user_action',
                severity: 'info',
                title: '👤 用户登录通知',
                message: '管理员用户 admin 从192.168.1.100通过SSH成功登录系统',
                source: 'Auth System',
                status: 'read',
                actions: [],
                metadata: { user: 'admin', ip: '192.168.1.100', method: 'SSH' }
            },
            {
                id: 6,
                timestamp: '2026-05-01 14:22:41',
                type: 'security_alert',
                severity: 'high',
                title: '🔒 防火墙规则触发',
                message: '防火墙规则#156被触发，已阻止来自185.220.101.0/24的恶意连接尝试',
                source: 'Firewall',
                status: 'unread',
                actions: ['查看日志', '修改规则'],
                metadata: { ruleId: 156, blockedIP: '185.220.101.0/24', action: 'BLOCK' }
            },
            {
                id: 7,
                timestamp: '2026-05-01 14:20:15',
                type: 'performance',
                severity: 'critical',
                title: '💾 磁盘空间严重不足',
                message: '系统盘 /dev/sda1 使用率已达92%（8.2TB/9TB），请立即清理或扩容！',
                source: 'Storage Monitor',
                status: 'unread',
                actions: ['磁盘分析', '清理建议', '扩展存储'],
                metadata: { device: '/dev/sda1', usage: 92, used: '8.2TB', total: '9TB' }
            },
            {
                id: 8,
                timestamp: '2026-05-01 14:18:52',
                type: 'system_event',
                severity: 'warning',
                title: '⏰ 定时任务执行失败',
                message: 'Cron任务 /etc/cron.daily/logrotate 执行失败：权限不足',
                source: 'Cron Daemon',
                status: 'acknowledged',
                actions: ['查看错误日志', '修复权限'],
                metadata: { task: '/etc/cron.daily/logrotate', error: 'Permission denied' }
            }
        ];

        this.renderNotifications();
        this.updateStats();
        this.renderAlertRulesPreview();
        this.renderWebhookActivity();
    }

    renderNotifications(filteredNotifications = null) {
        const notifications = filteredNotifications || this.notifications;
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 48px; color: var(--text-secondary);">
                    <div style="font-size: 64px; margin-bottom: 16px;">📭</div>
                    <div style="font-size: 16px;">暂无通知</div>
                    <div style="font-size: 13px; margin-top: 8px;">当有新事件时会在这里显示</div>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(notif => `
            <div class="notification-item ${notif.status === 'unread' ? 'unread' : ''}" data-id="${notif.id}" onclick="notificationCenter.viewNotification(${notif.id})" style="
                padding: 16px;
                border-bottom: 1px solid var(--border-light);
                cursor: pointer;
                transition: all 0.2s;
                ${notif.status === 'unread' ? 'background: rgba(59, 130, 246, 0.05); border-left: 3px solid var(--primary);' : ''}
            ">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                            ${notif.status === 'unread' ? '<span style="width: 8px; height: 8px; background: var(--primary); border-radius: 50%; display: inline-block;"></span>' : ''}
                            <strong style="font-size: 14px;">${notif.title}</strong>
                            <span class="status-badge ${
                                notif.severity === 'critical' ? 'danger' :
                                notif.severity === 'high' ? 'warning' :
                                notif.severity === 'warning' ? 'info' : 'default'
                            }" style="font-size: 10px;">
                                ${notif.severity.toUpperCase()}
                            </span>
                        </div>
                        <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.5;">${notif.message}</p>
                    </div>
                    <div style="text-align: right; margin-left: 16px;">
                        <code style="font-size: 11px; color: var(--text-muted);">${notif.timestamp.split(' ')[1]}</code>
                    </div>
                </div>
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                    <div style="font-size: 11px; color: var(--text-muted);">
                        📍 ${notif.source} · ${this.getTypeLabel(notif.type)}
                    </div>
                    <div class="btn-group">
                        ${notif.actions.map(action => `
                            <button class="btn btn-xs btn-outline" onclick="event.stopPropagation(); notificationCenter.executeAction(${notif.id}, '${action}')">
                                ${action}
                            </button>
                        `).join('')}
                        <button class="btn btn-xs btn-${notif.status === 'unread' ? 'primary' : 'outline'}" 
                                onclick="event.stopPropagation(); notificationCenter.markAsRead(${notif.id})">
                            ${notif.status === 'unread' ? '标记已读' : '确认'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        document.getElementById('notifPaginationInfo').textContent = `显示 ${notifications.length} 条通知，共 ${this.notifications.length} 条`;
    }

    getTypeLabel(type) {
        const labels = {
            'security_alert': '安全告警',
            'system_event': '系统事件',
            'performance': '性能警告',
            'user_action': '用户操作',
            'backup_status': '备份状态'
        };
        return labels[type] || type;
    }

    updateStats() {
        document.getElementById('totalNotifications').textContent = this.notifications.length;
        document.getElementById('unreadNotifications').textContent = this.notifications.filter(n => n.status === 'unread').length;
        document.getElementById('criticalAlertsCount').textContent = this.notifications.filter(n => n.severity === 'critical').length;
        document.getElementById('resolvedToday').textContent = Utils.randomInRange(25, 40);
        document.getElementById('activeWebhooks').textContent = this.webhooks.filter(w => w.enabled).length;
        this.unreadCount = this.notifications.filter(n => n.status === 'unread').length;
    }

    viewNotification(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (!notif) return;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">${notif.title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-2" style="gap: 20px; margin-bottom: 24px;">
                        <div class="info-item">
                            <label>时间戳</label>
                            <value><code>${notif.timestamp}</code></value>
                        </div>
                        <div class="info-item">
                            <label>严重程度</label>
                            <value><span class="status-badge ${notif.severity === 'critical' ? 'danger' : notif.severity === 'high' ? 'warning' : 'info'}">${notif.severity.toUpperCase()}</span></value>
                        </div>
                        <div class="info-item">
                            <label>来源</label>
                            <value><strong>${notif.source}</strong></value>
                        </div>
                        <div class="info-item">
                            <label>状态</label>
                            <value><span class="status-badge ${notif.status === 'unread' ? 'danger' : 'success'}">${notif.status === 'unread' ? '未读' : '已读'}</span></value>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 12px; color: var(--primary);">详细内容</h4>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); line-height: 1.6; margin-bottom: 24px;">
                        ${notif.message}
                    </div>

                    ${notif.metadata ? `
                        <h4 style="margin-bottom: 12px; color: var(--primary);">元数据</h4>
                        <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 13px;">
                            <pre style="margin: 0; white-space: pre-wrap;">${JSON.stringify(notif.metadata, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${notif.status === 'unread' ? `<button class="btn btn-success" onclick="notificationCenter.markAsRead(${notif.id}); this.closest('.modal-overlay').remove();">✓ 标记为已读</button>` : ''}
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        if (notif.status === 'unread') {
            this.markAsRead(id);
        }
    }

    markAsRead(id) {
        const notif = this.notifications.find(n => n.id === id);
        if (notif && notif.status === 'unread') {
            notif.status = 'read';
            this.renderNotifications();
            this.updateStats();
        }
    }

    markAllAsRead() {
        this.notifications.forEach(n => {
            if (n.status === 'unread') n.status = 'read';
        });
        this.renderNotifications();
        this.updateStats();
        Utils.showToast(`已将 ${this.notifications.length} 条通知标记为已读`, 'success');
    }

    filterByType(type) {
        if (!type) {
            this.renderNotifications();
            return;
        }
        const filtered = this.notifications.filter(n => n.type === type);
        this.renderNotifications(filtered);
    }

    filterByStatus(status) {
        if (!status) {
            this.renderNotifications();
            return;
        }
        const filtered = this.notifications.filter(n => n.status === status);
        this.renderNotifications(filtered);
    }

    executeAction(id, action) {
        Utils.showToast(`正在执行操作: ${action}...`, 'info');
        
        setTimeout(() => {
            Utils.showToast(`操作"${action}"已成功执行`, 'success');
            
            this.addEventStreamEntry({
                time: new Date().toLocaleTimeString(),
                type: 'action',
                message: `用户手动执行操作: ${action} [通知ID: ${id}]`,
                level: 'info'
            });
        }, 500);
    }

    clearAllNotifications() {
        if (confirm('确定要清空所有通知吗？此操作不可恢复！')) {
            this.notifications = [];
            this.renderNotifications();
            this.updateStats();
            Utils.showToast('所有通知已被清空', 'warning');
        }
    }

    initAlertRules() {
        this.alertRules = [
            {
                id: 1,
                name: '严重安全告警立即通知',
                enabled: true,
                conditions: {
                    type: 'security_alert',
                    severity: ['critical', 'high']
                },
                actions: ['email', 'browser_push', 'webhook'],
                cooldown: '0m',
                description: '当检测到严重或高危安全威胁时立即发送多渠道通知'
            },
            {
                id: 2,
                name: '性能阈值警告',
                enabled: true,
                conditions: {
                    type: 'performance',
                    severity: ['warning', 'critical']
                },
                actions: ['email'],
                cooldown: '15m',
                description: 'CPU/内存/磁盘超过阈值时发送邮件通知（15分钟冷却）'
            },
            {
                id: 3,
                name: '备份状态通知',
                enabled: true,
                conditions: {
                    type: 'backup_status',
                    severity: ['all']
                },
                actions: ['browser_push'],
                cooldown: '0m',
                description: '每次备份任务完成或失败时发送浏览器推送'
            },
            {
                id: 4,
                name: '用户敏感操作审计',
                enabled: false,
                conditions: {
                    type: 'user_action',
                    severity: ['all']
                },
                actions: ['email', 'log'],
                cooldown: '5m',
                description: '记录所有用户登录和权限变更操作'
            }
        ];
    }

    renderAlertRulesPreview() {
        const container = document.getElementById('alertRulesPreview');
        if (!container) return;

        const activeRules = this.alertRules.filter(r => r.enabled);

        if (activeRules.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">暂无活跃的告警规则</div>';
            return;
        }

        container.innerHTML = activeRules.slice(0, 3).map(rule => `
            <div style="padding: 12px; border-bottom: 1px solid var(--border-light);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
                    <strong style="font-size: 13px;">${rule.name}</strong>
                    <span class="status-badge success" style="font-size: 10px;">活跃</span>
                </div>
                <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">
                    ${rule.description.substring(0, 60)}...
                </div>
            </div>
        `).join('');
    }

    showCreateRuleModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">➕ 创建告警规则</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">规则名称 *</label>
                        <input type="text" class="form-input" id="ruleName" placeholder="例如：严重安全告警立即通知">
                    </div>

                    <div class="form-group">
                        <label class="form-label">描述</label>
                        <textarea class="form-textarea" id="ruleDescription" placeholder="规则说明..."></textarea>
                    </div>

                    <div class="grid grid-2" style="gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">触发类型 *</label>
                            <select class="form-select" id="ruleTriggerType">
                                <option value="security_alert">🛡️ 安全告警</option>
                                <option value="system_event">💻 系统事件</option>
                                <option value="performance">📊 性能警告</option>
                                <option value="user_action">👤 用户操作</option>
                                <option value="backup_status">💾 备份状态</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">最低严重程度 *</label>
                            <select class="form-select" id="ruleMinSeverity">
                                <option value="all">所有级别</option>
                                <option value="critical">仅严重</option>
                                <option value="high" selected>高危及以上</option>
                                <option value="warning">中等及以上</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">通知方式 *</label>
                        <div style="display: flex; gap: 16px; flex-wrap: wrap;">
                            <label class="checkbox-label"><input type="checkbox" name="ruleActions" value="email" checked> 📧 邮件</label>
                            <label class="checkbox-label"><input type="checkbox" name="ruleActions" value="browser_push" checked> 🔔 浏览器推送</label>
                            <label class="checkbox-label"><input type="checkbox" name="ruleActions" value="webhook"> 🔗 Webhook</label>
                            <label class="checkbox-label"><input type="checkbox" name="ruleActions" value="sms"> 📱 短信</label>
                            <label class="checkbox-label"><input type="checkbox" name="ruleActions" value="log"> 📝 仅记录日志</label>
                        </div>
                    </div>

                    <div class="grid grid-2" style="gap: 16px;">
                        <div class="form-group">
                            <label class="form-label">冷却时间</label>
                            <select class="form-select" id="ruleCooldown">
                                <option value="0m">无冷却</option>
                                <option value="5m">5分钟</option>
                                <option value="15m" selected>15分钟</option>
                                <option value="1h">1小时</option>
                                <option value="6h">6小时</option>
                                <option value="24h">24小时</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">启用状态</label>
                            <label class="toggle-switch" style="margin-top: 8px;">
                                <input type="checkbox" id="ruleEnabled" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="notificationCenter.createAlertRule()">创建规则</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    createAlertRule() {
        const name = document.getElementById('ruleName').value.trim();
        if (!name) {
            Utils.showToast('请输入规则名称', 'error');
            return;
        }

        const actions = Array.from(document.querySelectorAll('input[name="ruleActions"]:checked')).map(cb => cb.value);

        const newRule = {
            id: Date.now(),
            name: name,
            enabled: document.getElementById('ruleEnabled').checked,
            conditions: {
                type: document.getElementById('ruleTriggerType').value,
                severity: document.getElementById('ruleMinSeverity').value
            },
            actions: actions,
            cooldown: document.getElementById('ruleCooldown').value,
            description: document.getElementById('ruleDescription').value || '用户创建的自定义告警规则'
        };

        this.alertRules.push(newRule);
        document.querySelector('.modal-overlay').remove();
        this.renderAlertRulesPreview();
        Utils.showToast(`告警规则 "${name}" 已创建成功`, 'success');

        this.addEventStreamEntry({
            time: new Date().toLocaleTimeString(),
            type: 'rule_created',
            message: `新建告警规则: ${name}`,
            level: 'success'
        });
    }

    loadWebhooks() {
        this.webhooks = [
            {
                id: 1,
                name: 'Slack安全频道',
                url: 'https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX',
                enabled: true,
                lastCalled: '2026-05-01 14:32:15',
                successRate: 98.5,
                totalCalls: 1247
            },
            {
                id: 2,
                name: '企业微信机器人',
                url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook?key=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                enabled: true,
                lastCalled: '2026-05-01 14:28:42',
                successRate: 95.2,
                totalCalls: 892
            },
            {
                id: 3,
                name: '钉钉群通知',
                url: 'https://oapi.dingtalk.com/robot/send?access_token=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                enabled: false,
                lastCalled: '2026-04-30 23:45:10',
                successRate: 99.1,
                totalCalls: 456
            }
        ];
    }

    renderWebhookActivity() {
        const container = document.getElementById('webhookActivity');
        if (!container) return;

        const recentCalls = [
            { webhook: 'Slack安全频道', time: '刚刚', status: 'success', event: '严重安全告警' },
            { webhook: '企业微信机器人', time: '3分钟前', status: 'success', event: '性能警告' },
            { webhook: 'Slack安全频道', time: '8分钟前', status: 'failed', event: '网络超时' }
        ];

        container.innerHTML = recentCalls.map(call => `
            <div style="padding: 8px 0; border-bottom: 1px solid var(--border-light); font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                    <strong>${call.webhook}</strong>
                    <span class="status-badge ${call.status === 'success' ? 'success' : 'danger'}" style="font-size: 9px;">
                        ${call.status === 'success' ? '✓ 成功' : '✗ 失败'}
                    </span>
                </div>
                <div style="color: var(--text-muted);">${call.event} · ${call.time}</div>
            </div>
        `).join('');
    }

    showWebhookManager() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">🔗 Webhook管理器</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 20px;">
                        <button class="btn btn-primary" onclick="notificationCenter.showAddWebhookModal()">
                            ➕ 添加Webhook
                        </button>
                    </div>

                    <div class="table-container">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    <th>名称</th>
                                    <th>URL</th>
                                    <th>状态</th>
                                    <th>成功率</th>
                                    <th>调用次数</th>
                                    <th>最后调用</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.webhooks.map(webhook => `
                                    <tr>
                                        <td><strong>${webhook.name}</strong></td>
                                        <td><code style="font-size: 11px;">${webhook.url.substring(0, 40)}...</code></td>
                                        <td>
                                            <label class="toggle-switch" style="transform: scale(0.8);">
                                                <input type="checkbox" ${webhook.enabled ? 'checked' : ''} onchange="notificationCenter.toggleWebhook(${webhook.id})">
                                                <span class="toggle-slider"></span>
                                            </label>
                                        </td>
                                        <td>${webhook.successRate}%</td>
                                        <td>${webhook.totalCalls}</td>
                                        <td><small>${webhook.lastCalled}</small></td>
                                        <td>
                                            <div class="btn-group">
                                                <button class="btn btn-xs btn-outline" onclick="notificationCenter.testWebhook(${webhook.id})">测试</button>
                                                <button class="btn btn-xs btn-danger" onclick="notificationCenter.deleteWebhook(${webhook.id})">删除</button>
                                            </div>
                                        </td>
                                    </tr>
                                `).join('')}
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

    showAddWebhookModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">➕ 添加Webhook</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">Webhook名称 *</label>
                        <input type="text" class="form-input" id="webhookName" placeholder="例如：Slack安全频道">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Webhook URL *</label>
                        <input type="url" class="form-input" id="webhookUrl" placeholder="https://...">
                        <small style="color: var(--text-secondary);">支持 Slack、企业微信、钉钉等平台</small>
                    </div>

                    <div class="form-group">
                        <label class="form-label">请求方法</label>
                        <select class="form-select" id="webhookMethod">
                            <option value="POST">POST (推荐)</option>
                            <option value="PUT">PUT</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">内容格式</label>
                        <select class="form-select" id="webhookFormat">
                            <option value="json">JSON</option>
                            <option value="form-data">Form Data</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="webhookEnabled" checked> 立即启用
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="document.querySelector('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="notificationCenter.addWebhook()">添加</button>
                </div>
            </div>
        `;
        document.querySelector('.modal-overlay').outerHTML = modal.outerHTML;
    }

    addWebhook() {
        const name = document.getElementById('webhookName').value.trim();
        const url = document.getElementById('webhookUrl').value.trim();

        if (!name || !url) {
            Utils.showToast('请填写完整信息', 'error');
            return;
        }

        const newWebhook = {
            id: Date.now(),
            name: name,
            url: url,
            enabled: document.getElementById('webhookEnabled').checked,
            lastCalled: '-',
            successRate: 100.0,
            totalCalls: 0
        };

        this.webhooks.push(newWebhook);
        document.querySelector('.modal-overlay').remove();
        this.showWebhookManager();
        this.updateStats();
        Utils.showToast(`Webhook "${name}" 已添加`, 'success');
    }

    toggleWebhook(id) {
        const webhook = this.webhooks.find(w => w.id === id);
        if (webhook) {
            webhook.enabled = !webhook.enabled;
            Utils.showToast(`Webhook "${webhook.name}" 已${webhook.enabled ? '启用' : '禁用'}`, 'info');
        }
    }

    testWebhook(id) {
        const webhook = this.webhooks.find(w => w.id === id);
        if (!webhook) return;

        Utils.showToast(`正在测试Webhook: ${webhook.name}...`, 'info');

        setTimeout(() => {
            webhook.totalCalls++;
            const success = Math.random() > 0.2;
            
            if (success) {
                webhook.successRate = ((webhook.successRate * (webhook.totalCalls - 1) + 100) / webhook.totalCalls).toFixed(1);
                Utils.showToast(`${webhook.name} 测试成功！`, 'success');
            } else {
                webhook.successRate = ((webhook.successRate * (webhook.totalCalls - 1)) / webhook.totalCalls).toFixed(1);
                Utils.showToast(`${webhook.name} 测试失败：连接超时`, 'error');
            }

            webhook.lastCalled = new Date().toLocaleString();
            this.showWebhookManager();
        }, 1500);
    }

    deleteWebhook(id) {
        if (confirm('确定要删除这个Webhook吗？')) {
            this.webhooks = this.webhooks.filter(w => w.id !== id);
            this.showWebhookManager();
            this.updateStats();
            Utils.showToast('Webhook已删除', 'success');
        }
    }

    handleSecurityAlert(data) {
        console.log('[NotificationCenter] 收到安全告警:', data);

        const matchingRules = this.alertRules.filter(rule => 
            rule.enabled && rule.conditions.type === 'security_alert'
        );

        matchingRules.forEach(rule => {
            const newNotification = {
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                type: 'security_alert',
                severity: data.severity || 'high',
                title: `🚨 安全告警 - ${data.type || '未知威胁'}`,
                message: data.message || '检测到安全威胁',
                source: 'IDS',
                status: 'unread',
                actions: ['查看详情', '处理'],
                metadata: data
            };

            this.notifications.unshift(newNotification);

            if (this.notifications.length > 100) {
                this.notifications = this.notifications.slice(0, 100);
            }

            this.addEventStreamEntry({
                time: new Date().toLocaleTimeString(),
                type: 'alert_received',
                message: `收到安全告警: ${data.message?.substring(0, 50)}...`,
                level: data.severity || 'warning'
            });

            if (rule.actions.includes('browser_push') && this.isEnabled) {
                this.showBrowserNotification(newNotification);
            }
        });

        this.renderNotifications();
        this.updateStats();

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 Linux安全防控系统', {
                body: data.message || '检测到新的安全威胁',
                icon: '🛡️'
            });
        }
    }

    showBrowserNotification(notification) {
        if (!('Notification' in window)) {
            console.warn('此浏览器不支持桌面通知');
            return;
        }

        if (Notification.permission === 'granted') {
            const browserNotif = new Notification(notification.title, {
                body: notification.message,
                icon: '🛡️',
                tag: `linux-security-${notification.id}`
            });

            browserNotif.onclick = () => {
                window.focus();
                this.viewNotification(notification.id);
            };
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    this.showBrowserNotification(notification);
                }
            });
        }
    }

    startRealtimePush() {
        this.refreshInterval = setInterval(() => {
            if (!this.isEnabled) return;

            if (Math.random() > 0.85) {
                const types = ['system_event', 'performance'];
                const severities = ['info', 'warning'];
                
                const randomNotif = {
                    id: Date.now(),
                    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
                    type: types[Math.floor(Math.random() * types.length)],
                    severity: severities[Math.floor(Math.random() * severities.length)],
                    title: this.generateRandomTitle(),
                    message: this.generateRandomMessage(),
                    source: this.getRandomSource(),
                    status: 'unread',
                    actions: ['查看详情', '忽略'],
                    metadata: {}
                };

                this.notifications.unshift(randomNotif);

                if (this.notifications.length > 100) {
                    this.notifications = this.notifications.slice(0, 100);
                }

                this.addEventStreamEntry({
                    time: new Date().toLocaleTimeString(),
                    type: 'new_notification',
                    message: `${randomNotif.title}`,
                    level: randomNotif.severity
                });

                this.renderNotifications();
                this.updateStats();
            }
        }, APP_CONFIG.refreshInterval.notification || 8000);
    }

    generateRandomTitle() {
        const titles = [
            '系统资源使用率变化',
            '进程状态更新',
            '网络连接状态改变',
            '定时任务执行完成',
            '系统服务健康检查',
            '磁盘I/O统计更新',
            '内存使用情况报告'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }

    generateRandomMessage() {
        const messages = [
            'CPU使用率从${cpu}%变化至${newCpu}%，持续时间为${duration}分钟',
            '内存使用量当前为${memory}MB，可用内存${available}MB',
            '网络接口eth0流量统计：上传${upload}MB/s，下载${download}MB/s',
            '进程${process} (PID: ${pid}) 状态变更为${status}',
            '系统负载平均值：1分钟 ${load1}, 5分钟 ${load5}, 15分钟 ${load15}'
        ];
        
        let msg = messages[Math.floor(Math.random() * messages.length)];
        msg = msg.replace(/\$\{(\w+)\}/g, (match, key) => {
            const values = {
                cpu: Utils.randomInRange(20, 90),
                newCpu: Utils.randomInRange(20, 90),
                duration: Utils.randomInRange(1, 60),
                memory: Utils.randomInRange(100, 800),
                available: Utils.randomInRange(100, 1600),
                upload: Utils.randomInRange(1, 100),
                download: Utils.randomInRange(10, 500),
                process: ['nginx', 'mysql', 'redis', 'node'][Math.floor(Math.random() * 4)],
                pid: Utils.randomInRange(1000, 99999),
                status: ['running', 'sleeping', 'stopped'][Math.floor(Math.random() * 3)],
                load1: (Math.random() * 4).toFixed(2),
                load5: (Math.random() * 3).toFixed(2),
                load15: (Math.random() * 2).toFixed(2)
            };
            return values[key] || match;
        });

        return msg;
    }

    getRandomSource() {
        const sources = ['SystemMonitor', 'Resource Watcher', 'Process Manager', 'Network Monitor', 'Health Checker'];
        return sources[Math.floor(Math.random() * sources.length)];
    }

    addEventStreamEntry(entry) {
        const stream = document.getElementById('eventStream');
        if (!stream) return;

        const colors = {
            'info': '#3b82f6',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444',
            'alert_received': '#ef4444',
            'action': '#8b5cf6',
            'rule_created': '#10b981',
            'new_notification': '#06b6d4'
        };

        const entryHtml = `
            <div style="
                margin-bottom: 8px;
                padding: 8px 12px;
                background: rgba(255, 255, 255, 0.03);
                border-left: 3px solid ${colors[entry.level] || colors.info};
                border-radius: 4px;
                animation: fadeInLeft 0.3s ease-out;
                font-family: monospace;
                font-size: 12px;
            ">
                <span style="color: #9ca3af;">[${entry.time}]</span>
                <span style="color: ${colors[entry.level] || colors.info}; font-weight: bold;"> [${entry.type.toUpperCase()}]</span>
                <span style="color: #e5e7eb;"> ${entry.message}</span>
            </div>
        `;

        stream.innerHTML = entryHtml + stream.innerHTML;

        const maxEntries = 50;
        while (stream.children.length > maxEntries) {
            stream.removeChild(stream.lastChild);
        }
    }

    pauseEventStream() {
        const btn = event.target;
        const statusBadge = document.getElementById('eventStreamStatus');
        
        if (btn.textContent === '暂停') {
            btn.textContent = '继续';
            statusBadge.className = 'status-badge warning';
            statusBadge.textContent = '● PAUSED';
            Utils.showToast('事件流已暂停', 'info');
        } else {
            btn.textContent = '暂停';
            statusBadge.className = 'status-badge success pulse';
            statusBadge.textContent = '● LIVE';
            Utils.showToast('事件流已继续', 'success');
        }
    }

    clearEventStream() {
        const stream = document.getElementById('eventStream');
        if (stream) {
            stream.innerHTML = '';
            Utils.showToast('事件流已清空', 'info');
        }
    }

    toggleNotificationService() {
        this.isEnabled = !this.isEnabled;
        const btn = document.getElementById('toggleNotifBtn');
        const statusBadge = document.getElementById('notificationStatus');

        if (this.isEnabled) {
            btn.textContent = '⏸️ 暂停服务';
            btn.className = 'btn btn-outline';
            statusBadge.className = 'status-badge success pulse';
            statusBadge.textContent = '● 通知服务运行中';
            Utils.showToast('通知服务已启动', 'success');
        } else {
            btn.textContent = '▶️ 启动服务';
            btn.className = 'btn btn-primary';
            statusBadge.className = 'status-badge warning';
            statusBadge.textContent = '○ 通知服务已暂停';
            Utils.showToast('通知服务已暂停', 'warning');
        }
    }

    toggleEmailAlerts(enabled) {
        Utils.showToast(enabled ? '邮件告警已启用' : '邮件告警已禁用', 'info');
    }

    toggleBrowserPush(enabled) {
        if (enabled && 'Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
        Utils.showToast(enabled ? '浏览器推送已启用' : '浏览器推送已禁用', 'info');
    }

    toggleSoundAlerts(enabled) {
        Utils.showToast(enabled ? '声音提示已启用' : '声音提示已禁用', 'info');
    }

    toggleAutoResolve(enabled) {
        Utils.showToast(enabled ? '自动归档已启用（24小时后低优先级通知将被自动归档）' : '自动归集已禁用', 'info');
    }

    setQuietHours(value) {
        const labels = {
            'none': '无限制',
            'night': '夜间静默 (22:00-08:00)',
            'weekend': '周末静默',
            'custom': '自定义时段'
        };
        Utils.showToast(`静默时段设置为: ${labels[value]}`, 'info');
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        eventBus.off('notification:refresh');
        eventBus.off('security:alert');
    }
}

let notificationCenter;
