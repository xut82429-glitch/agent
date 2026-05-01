class IntrusionModule {
    constructor() {
        this.alerts = [];
        this.attackMap = null;
        this.threatTimeline = null;
        this.refreshInterval = null;
        this.geoDatabase = this.initGeoDatabase();
        this.init();
    }

    init() {
        this.render();
        this.loadAlerts();
        this.initAttackMap();
        this.startRealTimeMonitoring();
        eventBus.on('intrusion:refresh', () => this.loadAlerts());
        eventBus.on('security:alert', (data) => this.handleSecurityAlert(data));
    }

    initGeoDatabase() {
        return {
            '203.0.113.50': { country: '🇺🇸 美国', city: '洛杉矶', isp: 'Cloudflare Inc.', lat: 34.05, lng: -118.24, risk: 'high' },
            '198.51.100.23': { country: '🇩🇪 德国', city: '法兰克福', isp: 'Hetzner Online GmbH', lat: 50.11, lng: 8.68, risk: 'high' },
            '192.0.2.100': { country: '🇷🇺 俄罗斯', city: '莫斯科', isp: 'Yandex LLC', lat: 55.75, lng: 37.61, risk: 'critical' },
            '203.0.113.77': { country: '🇨🇳 中国', city: '北京', isp: 'China Telecom', lat: 39.90, lng: 116.40, risk: 'medium' },
            '198.51.100.45': { country: '🇧🇷 巴西', city: '圣保罗', isp: 'Claro SA', lat: -23.55, lng: -46.63, risk: 'low' },
            '192.0.2.150': { country: '🇮🇳 印度', city: '孟买', isp: 'Bharti Airtel Ltd.', lat: 19.07, lng: 72.87, risk: 'high' },
            '203.0.113.99': { country: '🇬🇧 英国', city: '伦敦', isp: 'Amazon.com Inc.', lat: 51.50, lng: -0.12, risk: 'medium' },
            '198.51.100.88': { country: '🇯🇵 日本', city: '东京', isp: 'NTT Communications', lat: 35.68, lng: 139.69, risk: 'medium' },
            '185.220.101.0': { country: '🇳🇱 荷兰', city: '阿姆斯特丹', isp: 'DataCamp Limited', lat: 52.36, lng: 4.90, risk: 'critical' },
            '91.121.87.25': { country: '🇫🇷 法国', city: '巴黎', isp: 'OVH SAS', lat: 48.85, lng: 2.35, risk: 'high' },
            '194.163.128.45': { country: '🇺🇦 乌克兰', city: '基辅', isp: 'Hostinger International Ltd', lat: 50.45, lng: 30.52, risk: 'critical' },
            '89.248.167.131': { country: '🇹🇷 土耳其', city: '伊斯坦布尔', isp: 'Turk Telekomunikasyon A.S.', lat: 41.00, lng: 28.98, risk: 'medium' }
        };
    }

    getGeoInfo(ip) {
        return this.geoDatabase[ip] || {
            country: '🌍 未知',
            city: '未知',
            isp: 'Unknown ISP',
            lat: Math.random() * 180 - 90,
            lng: Math.random() * 360 - 180,
            risk: 'unknown'
        };
    }

    render() {
        const container = document.getElementById('page-intrusion');
        if (!container) return;

        container.innerHTML = `
            <div class="header">
                <h2>🚨 入侵检测系统 (IDS) v3.1</h2>
                <div class="header-actions">
                    <span class="status-badge success pulse" id="idsStatus">● IDS 运行中</span>
                    <button class="btn btn-outline" onclick="intrusionModule.showThreatIntelModal()">🔍 威胁情报</button>
                    <button class="btn btn-primary" onclick="intrusionModule.runFullScan()">🔍 全面扫描</button>
                    <button class="btn btn-outline" onclick="eventBus.emit('intrusion:refresh')">🔄 刷新</button>
                </div>
            </div>

            <!-- 统计卡片 -->
            <div class="grid grid-5" style="margin-bottom: 24px;">
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--danger);" id="criticalAlerts">0</div>
                    <div class="stat-label">🔴 严重威胁</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">需要立即处理</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--warning);" id="highAlerts">0</div>
                    <div class="stat-label">🟠 高危告警</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">1小时内处理</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--primary);" id="mediumAlerts">0</div>
                    <div class="stat-label">🟡 中等风险</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">24小时内处理</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--success);" id="blockedAttacks">0</div>
                    <div class="stat-label">✅ 已拦截攻击</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">今日统计</div>
                </div>
                <div class="card hover-lift">
                    <div class="stat-value" style="font-size: 28px; color: var(--info);" id="activeAttackers">0</div>
                    <div class="stat-label">🎯 活跃攻击者</div>
                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">当前在线</div>
                </div>
            </div>

            <!-- 攻击地图和实时监控 -->
            <div class="grid grid-2" style="margin-bottom: 24px;">
                <!-- 实时攻击地图 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🌍 全球实时攻击地图</h3>
                        <span class="status-badge danger pulse">LIVE</span>
                    </div>
                    <div id="attackMapContainer" style="height: 350px; position: relative; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: var(--radius-md); overflow: hidden;">
                        <canvas id="attackMapCanvas" style="width: 100%; height: 100%;"></canvas>
                        <div id="mapLegend" style="position: absolute; bottom: 16px; right: 16px; background: rgba(0,0,0,0.7); padding: 12px; border-radius: var(--radius-sm); font-size: 11px;">
                            <div style="margin-bottom: 4px;"><span style="color: #ef4444;">●</span> 严重攻击</div>
                            <div style="margin-bottom: 4px;"><span style="color: #f59e0b;">●</span> 高危攻击</div>
                            <div><span style="color: #3b82f6;">●</span> 一般扫描</div>
                        </div>
                        <div id="mapStats" style="position: absolute; top: 16px; left: 16px; background: rgba(0,0,0,0.7); padding: 12px; border-radius: var(--radius-sm);">
                            <div style="font-size: 18px; font-weight: bold; color: #ef4444;" id="liveAttackCount">0</div>
                            <div style="font-size: 11px; color: #9ca3af;">实时攻击数/分钟</div>
                        </div>
                    </div>
                </div>

                <!-- 实时威胁流 -->
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">⚡ 实时威胁流</h3>
                        <button class="btn btn-sm btn-outline" onclick="intrusionModule.toggleThreatStream()">暂停/继续</button>
                    </div>
                    <div id="realtimeThreats" style="max-height: 350px; overflow-y: auto;"></div>
                </div>
            </div>

            <!-- 攻击类型分布和时间线 -->
            <div class="grid grid-2" style="margin-bottom: 24px;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">📊 攻击类型分析</h3>
                    </div>
                    <div class="canvas-wrapper" style="height: 280px;">
                        <canvas id="attackTypesChart"></canvas>
                    </div>
                </div>

                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">🕐 24小时攻击时间线</h3>
                    </div>
                    <div class="canvas-wrapper" style="height: 280px;">
                        <canvas id="attackTimelineChart"></canvas>
                    </div>
                </div>
            </div>

            <!-- 安全告警列表 -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">⚠️ 安全告警中心</h3>
                    <div class="filter-bar" style="margin: 0; display: flex; gap: 12px; align-items: center;">
                        <input type="text" placeholder="搜索IP或攻击类型..." class="form-input" style="max-width: 250px;" oninput="intrusionModule.searchAlerts(this.value)">
                        <select class="form-select" style="width: auto;" onchange="intrusionModule.filterBySeverity(this.value)">
                            <option value="">所有级别</option>
                            <option value="critical">🔴 严重</option>
                            <option value="high">🟠 高危</option>
                            <option value="medium">🟡 中等</option>
                            <option value="low">🔵 低危</option>
                        </select>
                        <select class="form-select" style="width: auto;" onchange="intrusionModule.filterByStatus(this.value)">
                            <option value="">所有状态</option>
                            <option value="active">● 活跃</option>
                            <option value="resolved">✓ 已处理</option>
                            <option value="ignored">⊘ 已忽略</option>
                        </select>
                        <select class="form-select" style="width: auto;" onchange="intrusionModule.filterByType(this.value)">
                            <option value="">所有类型</option>
                            <option value="暴力破解">暴力破解</option>
                            <option value="端口扫描">端口扫描</option>
                            <option value="DDoS攻击">DDoS攻击</option>
                            <option value="SQL注入尝试">SQL注入</option>
                            <option value="XSS攻击">XSS攻击</option>
                        </select>
                    </div>
                </div>
                
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>时间</th>
                                <th>级别</th>
                                <th>攻击类型</th>
                                <th>源IP / 地理位置</th>
                                <th>目标</th>
                                <th>状态</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody id="alertsTableBody">
                        </tbody>
                    </table>
                </div>

                <div class="table-footer" style="padding: 16px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                    <span id="alertPaginationInfo">显示 0 条告警，共 0 条</span>
                    <div>
                        <button class="btn btn-sm btn-danger" onclick="intrusionModule.blockAllActiveIPs()">
                            🚫 批量封禁活跃IP
                        </button>
                        <button class="btn btn-sm btn-success" onclick="intrusionModule.resolveAllActive()">
                            ✓ 全部标记已处理
                        </button>
                    </div>
                </div>
            </div>

            <!-- 快速响应面板 -->
            <div class="grid grid-3" style="margin-top: 24px;">
                <div class="card hover-lift">
                    <div class="card-body" style="text-align: center; padding: 24px;">
                        <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
                        <h4 style="margin-bottom: 8px;">启用自动防御</h4>
                        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">自动封禁高危IP并告警</p>
                        <label class="toggle-switch" style="margin: 0 auto;">
                            <input type="checkbox" id="autoDefenseToggle" checked onchange="intrusionModule.toggleAutoDefense()">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
                <div class="card hover-lift">
                    <div class="card-body" style="text-align: center; padding: 24px;">
                        <div style="font-size: 48px; margin-bottom: 12px;">📧</div>
                        <h4 style="margin-bottom: 8px;">邮件告警设置</h4>
                        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">接收实时安全告警通知</p>
                        <button class="btn btn-primary" onclick="intrusionModule.showEmailConfig()" style="width: 100%;">
                            ⚙️ 配置邮件
                        </button>
                    </div>
                </div>
                <div class="card hover-lift">
                    <div class="card-body" style="text-align: center; padding: 24px;">
                        <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
                        <h4 style="margin-bottom: 8px;">导出安全报告</h4>
                        <p style="color: var(--text-secondary); font-size: 13px; margin-bottom: 16px;">生成详细的安全审计报告</p>
                        <button class="btn btn-primary" onclick="intrusionModule.exportSecurityReport()" style="width: 100%;">
                            📥 导出报告
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    loadAlerts() {
        this.alerts = [
            { 
                time: '2026-05-01 14:35:18', 
                severity: 'critical', 
                type: '暴力破解', 
                sourceIP: '203.0.113.50', 
                target: 'SSH (Port 22)', 
                status: 'active',
                attempts: 1247,
                duration: '15分钟',
                payload: 'admin/root/test/123456',
                userAgent: 'python-requests/2.28.0'
            },
            { 
                time: '2026-05-01 14:32:45', 
                severity: 'high', 
                type: '端口扫描', 
                sourceIP: '198.51.100.23', 
                target: '全端口范围 (1-65535)', 
                status: 'active',
                attempts: 65534,
                duration: '8分钟',
                portsScanned: [22, 80, 443, 3306, 8080, 8443],
                technique: 'SYN Scan'
            },
            { 
                time: '2026-05-01 14:28:12', 
                severity: 'medium', 
                type: 'DDoS攻击', 
                sourceIP: '192.0.2.100', 
                target: 'HTTP (Port 80)', 
                status: 'resolved',
                requestsPerSecond: 15420,
                duration: '30分钟',
                attackType: 'HTTP Flood',
                mitigation: 'Rate Limiting Applied'
            },
            { 
                time: '2026-05-01 14:25:33', 
                severity: 'high', 
                type: 'SQL注入尝试', 
                sourceIP: '203.0.113.77', 
                target: '/api/login?user=admin', 
                status: 'active',
                payload: "' OR '1'='1' --",
                database: 'MySQL',
                impact: '数据泄露风险'
            },
            { 
                time: '2026-05-01 14:20:08', 
                severity: 'low', 
                type: 'XSS攻击', 
                sourceIP: '198.51.100.45', 
                target: '/search?q=<script>', 
                status: 'ignored',
                payload: '<script>alert(document.cookie)</script>',
                type: 'Reflected XSS'
            },
            { 
                time: '2026-05-01 14:15:22', 
                severity: 'critical', 
                type: '暴力破解', 
                sourceIP: '192.0.2.150', 
                target: 'WordPress登录 (/wp-login.php)', 
                status: 'resolved',
                attempts: 8934,
                duration: '45分钟',
                usernames: ['admin', 'administrator', 'wpadmin'],
                sourceCountry: '印度'
            },
            { 
                time: '2026-05-01 14:10:45', 
                severity: 'medium', 
                type: '目录遍历', 
                sourceIP: '203.0.113.99', 
                target: '/../../etc/passwd', 
                status: 'resolved',
                pathsAttempted: ['/etc/passwd', '/etc/shadow', '/proc/self/environ'],
                vulnerability: 'Path Traversal (CWE-22)'
            },
            { 
                time: '2026-05-01 14:05:18', 
                severity: 'high', 
                type: '恶意User-Agent', 
                sourceIP: '198.51.100.88', 
                target: 'Web服务器根目录', 
                status: 'active',
                userAgent: 'sqlmap/1.6.7#stable (https://sqlmap.org)',
                toolDetected: 'SqlMap - Automated SQL Injection Tool',
                threatLevel: 'Automated Attack Tool'
            }
        ];

        this.renderAlerts();
        this.updateStats();
        this.loadRealtimeThreats();
        this.initCharts();
    }

    renderAlerts(filteredAlerts = null) {
        const alerts = filteredAlerts || this.alerts;
        const tbody = document.getElementById('alertsTableBody');
        if (!tbody) return;

        if (alerts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 48px; color: var(--text-secondary);">
                        <div style="font-size: 48px; margin-bottom: 16px;">🛡️</div>
                        <div>暂无安全告警</div>
                        <div style="font-size: 14px; margin-top: 8px;">系统运行正常，未检测到威胁</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = alerts.map(alert => {
            const geo = this.getGeoInfo(alert.sourceIP);
            return `
                <tr class="${alert.status === 'active' ? 'alert-active-row' : ''}">
                    <td>
                        <code>${alert.time}</code>
                    </td>
                    <td>
                        <span class="status-badge ${
                            alert.severity === 'critical' ? 'danger' :
                            alert.severity === 'high' ? 'warning' :
                            alert.severity === 'medium' ? 'info' : 'default'
                        }">
                            ${alert.severity === 'critical' ? '🔴' : 
                              alert.severity === 'high' ? '🟠' :
                              alert.severity === 'medium' ? '🟡' : '🔵'}
                            ${alert.severity.toUpperCase()}
                        </span>
                    </td>
                    <td><strong>${alert.type}</strong></td>
                    <td>
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                            <code>${alert.sourceIP}</code>
                            <small style="color: var(--text-secondary);">
                                ${geo.country} · ${geo.city}
                                <span class="status-badge ${geo.risk === 'critical' ? 'danger' : geo.risk === 'high' ? 'warning' : 'info'}" style="font-size: 10px; margin-left: 4px;">
                                    ${geo.risk.toUpperCase()}
                                </span>
                            </small>
                        </div>
                    </td>
                    <td>${alert.target}</td>
                    <td>
                        <span class="status-badge ${
                            alert.status === 'active' ? 'danger pulse' :
                            alert.status === 'resolved' ? 'success' : 'warning'
                        }">${
                            alert.status === 'active' ? '● 活跃' :
                            alert.status === 'resolved' ? '✓ 已处理' : '⊘ 已忽略'
                        }</span>
                    </td>
                    <td>
                        <div class="btn-group">
                            ${alert.status === 'active' ? `
                                <button class="btn btn-sm btn-success" onclick="intrusionModule.resolveAlert('${alert.time}')" title="处理">✓</button>
                                <button class="btn btn-sm btn-danger" onclick="intrusionModule.blockIP('${alert.sourceIP}')" title="封禁IP">🚫</button>
                            ` : ''}
                            <button class="btn btn-sm btn-outline" onclick="intrusionModule.viewAlertDetail('${alert.time}')" title="详情">👁️</button>
                            <button class="btn btn-sm btn-info" onclick="intrusionModule.showGeoLocation('${alert.sourceIP}')" title="地理位置">📍</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        document.getElementById('alertPaginationInfo').textContent = `显示 ${alerts.length} 条告警，共 ${this.alerts.length} 条`;
    }

    updateStats() {
        document.getElementById('criticalAlerts').textContent = this.alerts.filter(a => a.severity === 'critical').length;
        document.getElementById('highAlerts').textContent = this.alerts.filter(a => a.severity === 'high').length;
        document.getElementById('mediumAlerts').textContent = this.alerts.filter(a => a.severity === 'medium').length;
        document.getElementById('blockedAttacks').textContent = Utils.randomInRange(250, 400);
        document.getElementById('activeAttackers').textContent = [...new Set(this.alerts.filter(a => a.status === 'active').map(a => a.sourceIP))].length;
    }

    initAttackMap() {
        setTimeout(() => {
            this.renderAttackMap();
        }, 500);
    }

    renderAttackMap() {
        const canvas = document.getElementById('attackMapCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const container = document.getElementById('attackMapContainer');
        
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

        const attacks = [
            { ip: '203.0.113.50', lat: 34.05, lng: -118.24, severity: 'critical', count: 47 },
            { ip: '198.51.100.23', lat: 50.11, lng: 8.68, severity: 'high', count: 32 },
            { ip: '192.0.2.100', lat: 55.75, lng: 37.61, severity: 'critical', count: 89 },
            { ip: '185.220.101.0', lat: 52.36, lng: 4.90, severity: 'critical', count: 156 },
            { ip: '91.121.87.25', lat: 48.85, lng: 2.35, severity: 'high', count: 28 },
            { ip: '194.163.128.45', lat: 50.45, lng: 30.52, severity: 'critical', count: 67 }
        ];

        let animationFrame = 0;
        const maxFrames = 60;

        const animate = () => {
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.strokeStyle = 'rgba(59, 130, 246, 0.2)';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < canvas.width; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i, canvas.height);
                ctx.stroke();
            }
            
            for (let i = 0; i < canvas.height; i += 40) {
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(canvas.width, i);
                ctx.stroke();
            }

            const toCanvasX = (lng) => ((lng + 180) / 360) * canvas.width;
            const toCanvasY = (lat) => ((90 - lat) / 180) * canvas.height;

            attacks.forEach((attack, index) => {
                const x = toCanvasX(attack.lng);
                const y = toCanvasY(attack.lat);
                const progress = Math.min(animationFrame / maxFrames, 1);
                const currentRadius = progress * (Math.min(attack.count, 80) / 4 + 8);
                
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, currentRadius * 3);
                if (attack.severity === 'critical') {
                    gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
                    gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');
                } else if (attack.severity === 'high') {
                    gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
                    gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
                } else {
                    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
                    gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
                }

                ctx.beginPath();
                ctx.arc(x, y, currentRadius * 3, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(x, y, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = attack.severity === 'critical' ? '#ef4444' : 
                               attack.severity === 'high' ? '#f59e0b' : '#3b82f6';
                ctx.fill();

                ctx.font = 'bold 10px Arial';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(attack.count.toString(), x, y + 4);

                if (progress > 0.5 && animationFrame % 120 < 60) {
                    ctx.beginPath();
                    ctx.arc(x, y, currentRadius + 10 + (animationFrame % 60), 0, Math.PI * 2);
                    ctx.strokeStyle = `${attack.severity === 'critical' ? '#ef4444' : attack.severity === 'high' ? '#f59e0b' : '#3b82f6'}40`;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            });

            animationFrame++;
            
            if (animationFrame <= maxFrames * 2) {
                requestAnimationFrame(animate);
            }
        };

        animate();

        setInterval(() => {
            const liveCount = document.getElementById('liveAttackCount');
            if (liveCount) {
                liveCount.textContent = Utils.randomInRange(15, 45);
            }
        }, 3000);
    }

    loadRealtimeThreats() {
        const threats = [
            { time: '刚刚', ip: '185.220.101.0', action: 'SSH暴力破解尝试被拦截', blocked: true, severity: 'critical', location: '🇳🇱 荷兰' },
            { time: '2分钟前', ip: '91.121.87.25', action: '可疑的HTTP请求模式检测到', blocked: false, severity: 'high', location: '🇫🇷 法国' },
            { time: '5分钟前', ip: '194.163.128.45', action: 'SQL注入特征匹配成功', blocked: true, severity: 'critical', location: '🇺🇦 乌克兰' },
            { time: '8分钟前', ip: '89.248.167.131', action: '异常用户代理: sqlmap/1.6.7', blocked: false, severity: 'high', location: '🇹🇷 土耳其' },
            { time: '12分钟前', ip: '203.0.113.50', action: 'WordPress XML-RPC攻击被阻止', blocked: true, severity: 'high', location: '🇺🇸 美国' },
            { time: '15分钟前', ip: '198.51.100.23', action: '目录枚举扫描进行中', blocked: false, severity: 'medium', location: '🇩🇪 德国' }
        ];

        const container = document.getElementById('realtimeThreats');
        if (!container) return;

        container.innerHTML = threats.map(threat => `
            <div class="threat-item ${threat.blocked ? 'blocked' : 'monitoring'}" style="
                padding: 12px; 
                border-bottom: 1px solid var(--border-light); 
                display: flex; 
                align-items: center; 
                gap: 12px;
                animation: fadeInLeft 0.3s ease-out;
            ">
                <span class="status-badge ${threat.blocked ? 'success' : threat.severity === 'critical' ? 'danger' : 'warning'}" style="flex-shrink: 0;">
                    ${threat.blocked ? '✓ 已拦截' : threat.severity === 'critical' ? '🔴 严重' : '⚠ 监控中'}
                </span>
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 13px; color: var(--text-primary); font-weight: 500;">${threat.action}</div>
                    <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                        <code>${threat.ip}</code> · ${threat.location} · ${threat.time}
                    </div>
                </div>
                ${!threat.blocked ? `<button class="btn btn-xs btn-danger" onclick="intrusionModule.quickBlock('${threat.ip}')">封锁</button>` : ''}
            </div>
        `).join('');
    }

    initCharts() {
        this.initAttackTypesChart();
        this.initAttackTimelineChart();
    }

    initAttackTypesChart() {
        const ctx = document.getElementById('attackTypesChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.charts?.attackTypes) {
            this.charts.attackTypes.destroy();
        }

        this.charts = this.charts || {};
        
        this.charts.attackTypes = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['暴力破解', '端口扫描', 'DDoS攻击', 'SQL注入', 'XSS攻击', '其他'],
                datasets: [{
                    data: [35, 25, 18, 12, 6, 4],
                    backgroundColor: [
                        '#ef4444',
                        '#f59e0b',
                        '#3b82f6',
                        '#8b5cf6',
                        '#ec4899',
                        '#6b7280'
                    ],
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#9ca3af',
                            font: { size: 12 },
                            padding: 12
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#f3f4f6',
                        bodyColor: '#d1d5db',
                        borderColor: '#374151',
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    initAttackTimelineChart() {
        const ctx = document.getElementById('attackTimelineChart');
        if (!ctx || typeof Chart === 'undefined') return;

        if (this.charts?.timeline) {
            this.charts.timeline.destroy();
        }

        const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        const attackCounts = hours.map(() => Utils.randomInRange(5, 50));

        this.charts.timeline = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: '攻击次数',
                    data: attackCounts,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#ef4444',
                    pointHoverBorderColor: '#fff',
                    pointHoverBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: { color: 'rgba(75, 85, 99, 0.2)' },
                        ticks: { 
                            color: '#9ca3af',
                            maxTicksLimit: 12,
                            font: { size: 10 }
                        }
                    },
                    y: {
                        grid: { color: 'rgba(75, 85, 99, 0.2)' },
                        ticks: { color: '#9ca3af' },
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.95)',
                        titleColor: '#f3f4f6',
                        bodyColor: '#d1d5db',
                        borderColor: '#374151',
                        borderWidth: 1,
                        mode: 'index',
                        intersect: false
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    searchAlerts(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderAlerts();
            return;
        }

        const filtered = this.alerts.filter(alert =>
            alert.sourceIP.includes(searchTerm) ||
            alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.target.toLowerCase().includes(searchTerm.toLowerCase())
        );
        this.renderAlerts(filtered);
    }

    filterBySeverity(severity) {
        if (!severity) {
            this.renderAlerts();
            return;
        }
        const filtered = this.alerts.filter(a => a.severity === severity);
        this.renderAlerts(filtered);
    }

    filterByStatus(status) {
        if (!status) {
            this.renderAlerts();
            return;
        }
        const filtered = this.alerts.filter(a => a.status === status);
        this.renderAlerts(filtered);
    }

    filterByType(type) {
        if (!type) {
            this.renderAlerts();
            return;
        }
        const filtered = this.alerts.filter(a => a.type.includes(type));
        this.renderAlerts(filtered);
    }

    resolveAlert(time) {
        const alert = this.alerts.find(a => a.time === time);
        if (alert) {
            alert.status = 'resolved';
            this.renderAlerts();
            this.updateStats();
            Utils.showToast('威胁已处理并记录', 'success');
        }
    }

    blockIP(ip) {
        const geo = this.getGeoInfo(ip);
        
        if (confirm(`确定要封禁IP地址吗？\n\nIP: ${ip}\n位置: ${geo.country} ${geo.city}\nISP: ${geo.isp}\n\n此操作将在防火墙中添加规则阻止该IP的所有连接。`)) {
            Utils.showToast(`IP ${ip} (${geo.country}) 已加入黑名单`, 'success');
            
            eventBus.emit('security:alert', {
                type: 'ip_blocked',
                message: `从IDS封禁IP: ${ip}`,
                severity: 'high',
                sourceIP: ip
            });

            setTimeout(() => {
                showPage('firewall');
            }, 1000);
        }
    }

    quickBlock(ip) {
        const geo = this.getGeoInfo(ip);
        Utils.showToast(`正在封锁 ${ip} (${geo.country})...`, 'info');
        
        setTimeout(() => {
            Utils.showToast(`${ip} 已被快速封锁！`, 'success');
        }, 800);
    }

    blockAllActiveIPs() {
        const activeIPs = [...new Set(this.alerts.filter(a => a.status === 'active').map(a => a.sourceIP))];
        
        if (activeIPs.length === 0) {
            Utils.showToast('没有需要封禁的活跃IP', 'info');
            return;
        }

        if (confirm(`确定要批量封禁以下 ${activeIPs.length} 个活跃攻击IP吗？\n\n${activeIPs.join('\n')}`)) {
            activeIPs.forEach(ip => {
                const alert = this.alerts.find(a => a.sourceIP === ip);
                if (alert) alert.status = 'resolved';
            });
            
            this.renderAlerts();
            this.updateStats();
            Utils.showToast(`已成功封禁 ${activeIPs.length} 个恶意IP`, 'success');
        }
    }

    resolveAllActive() {
        const activeAlerts = this.alerts.filter(a => a.status === 'active');
        
        if (activeAlerts.length === 0) {
            Utils.showToast('没有需要处理的活跃告警', 'info');
            return;
        }

        if (confirm(`确定要将 ${activeAlerts.length} 条活跃告警全部标记为已处理吗？`)) {
            activeAlerts.forEach(alert => alert.status = 'resolved');
            this.renderAlerts();
            this.updateStats();
            Utils.showToast(`已处理 ${activeAlerts.length} 条告警`, 'success');
        }
    }

    viewAlertDetail(time) {
        const alert = this.alerts.find(a => a.time === time);
        if (!alert) return;

        const geo = this.getGeoInfo(alert.sourceIP);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">🔍 告警详细信息</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="grid grid-2" style="gap: 24px; margin-bottom: 24px;">
                        <div>
                            <h4 style="margin-bottom: 12px; color: var(--primary);">基本信息</h4>
                            <table style="width: 100%; font-size: 14px;">
                                <tr><td style="padding: 8px; color: var(--text-secondary);">告警时间:</td><td style="padding: 8px;"><code>${alert.time}</code></td></tr>
                                <tr><td style="padding: 8px; color: var(--text-secondary);">威胁级别:</td><td style="padding: 8px;"><span class="status-badge ${alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'info'}">${alert.severity.toUpperCase()}</span></td></tr>
                                <tr><td style="padding: 8px; color: var(--text-secondary);">攻击类型:</td><td style="padding: 8px;"><strong>${alert.type}</strong></td></tr>
                                <tr><td style="padding: 8px; color: var(--text-secondary);">当前状态:</td><td style="padding: 8px;"><span class="status-badge ${alert.status === 'active' ? 'danger' : 'success'}">${alert.status === 'active' ? '● 活跃' : '✓ 已处理'}</span></td></tr>
                            </table>
                        </div>
                        <div>
                            <h4 style="margin-bottom: 12px; color: var(--primary);">攻击者信息</h4>
                            <table style="width: 100%; font-size: 14px;">
                                <tr><td style="padding: 8px; color: var(--text-secondary);">源IP地址:</td><td style="padding: 8px;"><code>${alert.sourceIP}</code></td></tr>
                                <tr><td style="padding: 8px; color: var(--text-secondary);">地理位置:</td><td style="padding: 8px;">${geo.country} ${geo.city}</td></tr>
                                <tr><td style="padding: 8px; color: var(--text-secondary);">ISP提供商:</td><td style="padding: 8px;">${geo.isp}</td></tr>
                                <tr><td style="padding: 8px; color: var(--text-secondary);">风险评估:</td><td style="padding: 8px;"><span class="status-badge ${geo.risk === 'critical' ? 'danger' : geo.risk === 'high' ? 'warning' : 'info'}">${geo.risk.toUpperCase()}</span></td></tr>
                            </table>
                        </div>
                    </div>

                    <h4 style="margin-bottom: 12px; color: var(--primary);">攻击详情</h4>
                    <div style="background: var(--bg-secondary); padding: 16px; border-radius: var(--radius-md); font-family: monospace; font-size: 13px; overflow-x: auto;">
                        ${Object.entries(alert)
                            .filter(([key]) => !['time', 'severity', 'type', 'sourceIP', 'target', 'status'].includes(key))
                            .map(([key, value]) => `<div style="margin-bottom: 8px;"><strong style="color: var(--primary);">${key}:</strong> ${Array.isArray(value) ? value.join(', ') : value}</div>`)
                            .join('')}
                    </div>

                    <h4 style="margin: 20px 0 12px; color: var(--primary);">建议措施</h4>
                    <ul style="color: var(--text-secondary); line-height: 1.8;">
                        ${this.getRecommendations(alert).map(rec => `<li>${rec}</li>`).join('')}
                    </ul>
                </div>
                <div class="modal-footer">
                    ${alert.status === 'active' ? `
                        <button class="btn btn-success" onclick="intrusionModule.resolveAlert('${alert.time}'); this.closest('.modal-overlay').remove();">✓ 标记为已处理</button>
                        <button class="btn btn-danger" onclick="intrusionModule.blockIP('${alert.sourceIP}'); this.closest('.modal-overlay').remove();">🚫 封禁IP</button>
                    ` : ''}
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getRecommendations(alert) {
        const recommendations = {
            '暴力破解': [
                '立即检查相关账户的登录日志',
                '考虑启用双因素认证(2FA)',
                '将攻击源IP加入防火墙黑名单',
                '审查密码策略，强制使用强密码',
                '考虑使用fail2ban等工具自动防护'
            ],
            '端口扫描': [
                '确认开放的端口都是必要的',
                '关闭不必要的服务和端口',
                '配置端口敲门(Port Knocking)机制',
                '将扫描行为记录并上报给ISP',
                '考虑部署蜜罐系统(Honeypot)'
            ],
            'DDoS攻击': [
                '立即联系CDN或云服务提供商',
                '启用流量清洗和速率限制',
                '临时屏蔽攻击源IP段',
                '准备应急响应计划',
                '考虑使用专业的DDoS防护服务'
            ],
            'SQL注入尝试': [
                '立即检查受影响的数据库表',
                '审查Web应用的输入验证逻辑',
                '更新ORM框架和安全库',
                '实施参数化查询(Parameterized Queries)',
                '部署Web应用防火墙(WAF)'
            ],
            'default': [
                '详细记录此次攻击事件',
                '评估潜在的业务影响',
                '更新安全策略和规则集',
                '对相关团队进行安全培训',
                '定期进行安全审计和渗透测试'
            ]
        };

        return recommendations[alert.type] || recommendations['default'];
    }

    showGeoLocation(ip) {
        const geo = this.getGeoInfo(ip);

        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📍 IP地理位置信息</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 24px;">
                        <div style="font-size: 64px; margin-bottom: 8px;">${geo.country.split(' ')[0]}</div>
                        <h3 style="margin: 0;">${ip}</h3>
                        <p style="color: var(--text-secondary); margin-top: 4px;">${geo.isp}</p>
                    </div>

                    <div class="grid grid-2" style="gap: 16px;">
                        <div class="info-item">
                            <label>国家/地区</label>
                            <value>${geo.country}</value>
                        </div>
                        <div class="info-item">
                            <label>城市</label>
                            <value>${geo.city}</value>
                        </div>
                        <div class="info-item">
                            <label>ISP提供商</label>
                            <value>${geo.isp}</value>
                        </div>
                        <div class="info-item">
                            <label>坐标</label>
                            <value>${geo.lat.toFixed(2)}, ${geo.lng.toFixed(2)}</value>
                        </div>
                        <div class="info-item">
                            <label>风险评估</label>
                            <value><span class="status-badge ${geo.risk === 'critical' ? 'danger' : geo.risk === 'high' ? 'warning' : 'info'}">${geo.risk.toUpperCase()}</span></value>
                        </div>
                        <div class="info-item">
                            <label>查询时间</label>
                            <value>${new Date().toLocaleString()}</value>
                        </div>
                    </div>

                    <div style="margin-top: 24px; padding: 16px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                        <h4 style="font-size: 14px; margin-bottom: 8px;">⚠️ 安全提示</h4>
                        <p style="font-size: 13px; color: var(--text-secondary); margin: 0;">
                            此IP地址的风险等级为 <strong>${geo.risk.toUpperCase()}</strong>。
                            ${geo.risk === 'critical' ? '该IP已被多个威胁情报平台标记为恶意，建议立即封禁。' :
                              geo.risk === 'high' ? '该IP有较高的恶意活动历史，请密切监控。' :
                              '该IP目前风险较低，但仍需保持警惕。'}
                        </p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-danger" onclick="intrusionModule.blockIP('${ip}'); this.closest('.modal-overlay').remove();">🚫 立即封禁</button>
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    showThreatIntelModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal modal-lg">
                <div class="modal-header">
                    <h3 class="modal-title">🔍 威胁情报中心</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">查询IP地址或域名</label>
                        <div style="display: flex; gap: 12px;">
                            <input type="text" class="form-input" id="threatIntelInput" placeholder="输入IP地址或域名..." style="flex: 1;">
                            <button class="btn btn-primary" onclick="intrusionModule.queryThreatIntel()">查询</button>
                        </div>
                    </div>

                    <div id="threatIntelResult" style="display: none;">
                        <!-- 结果会动态加载到这里 -->
                    </div>

                    <div style="margin-top: 32px;">
                        <h4 style="margin-bottom: 16px;">📊 全球威胁态势概览</h4>
                        <div class="grid grid-3" style="gap: 16px;">
                            <div class="card" style="text-align: center; padding: 20px;">
                                <div style="font-size: 32px; color: var(--danger); font-weight: bold;">1,247</div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">今日全球攻击事件</div>
                            </div>
                            <div class="card" style="text-align: center; padding: 20px;">
                                <div style="font-size: 32px; color: var(--warning); font-weight: bold;">89</div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">新增恶意IP</div>
                            </div>
                            <div class="card" style="text-align: center; padding: 20px;">
                                <div style="font-size: 32px; color: var(--primary); font-weight: bold;">156</div>
                                <div style="font-size: 13px; color: var(--text-secondary); margin-top: 4px;">活跃僵尸网络</div>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top: 24px;">
                        <h4 style="margin-bottom: 12px;">🎯 最新威胁情报</h4>
                        <div style="max-height: 250px; overflow-y: auto;">
                            ${[
                                { type: 'CVE-2026-1234', severity: 'critical', desc: 'Linux内核提权漏洞，影响所有主流发行版', date: '2小时前' },
                                { type: 'APT-Group-29', severity: 'high', desc: '新型APT组织针对能源行业发起攻击', date: '5小时前' },
                                { type: 'Ransomware-X', severity: 'critical', desc: '新型勒索软件变种被发现，采用双重勒索策略', date: '1天前' },
                                { type: 'Botnet-Mirai', severity: 'medium', desc: 'Mirai僵尸网络新变种针对IoT设备', date: '2天前' }
                            ].map(item => `
                                <div style="padding: 12px; border-bottom: 1px solid var(--border-light); display: flex; justify-content: space-between; align-items: start;">
                                    <div>
                                        <strong style="color: var(--primary);">${item.type}</strong>
                                        <span class="status-badge ${item.severity === 'critical' ? 'danger' : item.severity === 'high' ? 'warning' : 'info'}" style="margin-left: 8px; font-size: 10px;">
                                            ${item.severity.toUpperCase()}
                                        </span>
                                        <p style="font-size: 13px; color: var(--text-secondary); margin: 4px 0 0;">${item.desc}</p>
                                    </div>
                                    <small style="color: var(--text-muted); white-space: nowrap;">${item.date}</small>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    queryThreatIntel() {
        const input = document.getElementById('threatIntelInput');
        const query = input.value.trim();

        if (!query) {
            Utils.showToast('请输入IP地址或域名', 'error');
            return;
        }

        const resultDiv = document.getElementById('threatIntelResult');
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = '<div style="text-align: center; padding: 32px;"><div class="loading-spinner"></div><p style="margin-top: 12px;">正在查询威胁情报...</p></div>';

        setTimeout(() => {
            const isIP = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(query);
            const geo = isIP ? this.getGeoInfo(query) : null;

            resultDiv.innerHTML = `
                <div style="background: var(--bg-secondary); border-radius: var(--radius-lg); padding: 24px; margin-top: 16px;">
                    <h4 style="margin-bottom: 16px;">查询结果: ${query}</h4>
                    
                    ${isIP ? `
                        <div class="grid grid-2" style="gap: 16px; margin-bottom: 20px;">
                            <div class="info-item"><label>IP地址</label><value>${query}</value></div>
                            <div class="info-item"><label>国家</label><value>${geo?.country || '未知'}</value></div>
                            <div class="info-item"><label>城市</label><value>${geo?.city || '未知'}</value></div>
                            <div class="info-item"><label>ISP</label><value>${geo?.isp || '未知'}</value></div>
                        </div>
                    ` : `
                        <div class="grid grid-2" style="gap: 16px; margin-bottom: 20px;">
                            <div class="info-item"><label>域名</label><value>${query}</value></div>
                            <div class="info-item"><label>注册商</label><value>NameCheap Inc.</value></div>
                            <div class="info-item"><label>创建日期</label><value>2024-03-15</value></div>
                            <div class="info-item"><label>DNS服务器</label><value>dns1.registrar-servers.com</value></div>
                        </div>
                    `}

                    <h4 style="margin: 20px 0 12px;">威胁评分与分析</h4>
                    <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 20px;">
                        <div style="text-align: center;">
                            <div style="font-size: 48px; font-weight: bold; color: ${geo?.risk === 'critical' ? '#ef4444' : geo?.risk === 'high' ? '#f59e0b' : '#10b981'};">
                                ${geo?.risk === 'critical' ? '95' : geo?.risk === 'high' ? '72' : '23'}
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">威胁评分</div>
                        </div>
                        <div style="flex: 1;">
                            <div style="margin-bottom: 8px;">
                                <span>恶意分数:</span>
                                <div style="float: right; color: #ef4444;">高</div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${geo?.risk === 'critical' ? '85%' : geo?.risk === 'high' ? '65%' : '20%'}; background: ${geo?.risk === 'critical' ? '#ef4444' : geo?.risk === 'high' ? '#f59e0b' : '#10b981'};"></div>
                            </div>
                            
                            <div style="margin-top: 12px; font-size: 13px; color: var(--text-secondary);">
                                <div style="margin-bottom: 4px;">✗ 在 ${Utils.randomInRange(5, 15)} 个黑名单中被发现</div>
                                <div style="margin-bottom: 4px;">✗ 与 ${Utils.randomInRange(2, 8)} 个已知恶意活动关联</div>
                                <div>✓ 最近 ${Utils.randomInRange(1, 30)} 天内有异常活动</div>
                            </div>
                        </div>
                    </div>

                    <div style="display: flex; gap: 12px; margin-top: 20px;">
                        ${isIP ? `<button class="btn btn-danger" onclick="intrusionModule.blockIP('${query}')">🚫 封禁此IP</button>` : ''}
                        <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">关闭结果</button>
                    </div>
                </div>
            `;
        }, 1500);
    }

    runFullScan() {
        Utils.showToast('正在执行全面安全扫描...', 'info');
        
        const scanSteps = [
            '正在扫描开放端口...',
            '检测漏洞利用尝试...',
            '分析异常网络流量...',
            '检查恶意文件特征...',
            '验证系统完整性...',
            '生成扫描报告...'
        ];

        let currentStep = 0;
        const scanInterval = setInterval(() => {
            if (currentStep < scanSteps.length) {
                Utils.showToast(scanSteps[currentStep], 'info');
                currentStep++;
            } else {
                clearInterval(scanInterval);
                
                const newAlerts = [
                    { 
                        time: new Date().toLocaleString(), 
                        severity: ['critical', 'high', 'medium'][Math.floor(Math.random() * 3)], 
                        type: ['暴力破解', '端口扫描', 'SQL注入尝试'][Math.floor(Math.random() * 3)], 
                        sourceIP: Object.keys(this.geoDatabase)[Math.floor(Math.random() * Object.keys(this.geoDatabase).length)], 
                        target: '扫描发现', 
                        status: 'active'
                    }
                ];

                this.alerts.unshift(...newAlerts);
                this.renderAlerts();
                this.updateStats();
                Utils.showToast(`扫描完成！发现 ${newAlerts.length} 个新的潜在威胁`, 'warning');
            }
        }, 800);
    }

    toggleAutoDefense() {
        const toggle = document.getElementById('autoDefenseToggle');
        Utils.showToast(toggle.checked ? '自动防御已启用' : '自动防御已禁用', 'info');
    }

    showEmailConfig() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3 class="modal-title">📧 邮件告警配置</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label class="form-label">SMTP服务器</label>
                        <input type="text" class="form-input" value="smtp.gmail.com" placeholder="smtp.example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">端口</label>
                        <input type="number" class="form-input" value="587" placeholder="587">
                    </div>
                    <div class="form-group">
                        <label class="form-label">发件人邮箱</label>
                        <input type="email" class="form-input" value="security@yourdomain.com" placeholder="sender@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">收件人邮箱（多个用逗号分隔）</label>
                        <input type="email" class="form-input" value="admin@yourdomain.com" placeholder="recipient@example.com">
                    </div>
                    <div class="form-group">
                        <label class="form-label">告警级别阈值</label>
                        <select class="form-select">
                            <option value="critical">仅严重级别</option>
                            <option value="high" selected>严重和高危</option>
                            <option value="medium">中等及以上</option>
                            <option value="low">所有级别</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" checked> 启用实时告警推送
                        </label>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" checked> 发送每日摘要报告
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" onclick="this.closest('.modal-overlay').remove()">取消</button>
                    <button class="btn btn-primary" onclick="this.closest('.modal-overlay').remove(); intrusionModule.saveEmailConfig()">保存配置</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    saveEmailConfig() {
        Utils.showToast('邮件告警配置已保存！', 'success');
    }

    exportSecurityReport() {
        const report = {
            generatedAt: new Date().toISOString(),
            systemVersion: '3.1 Ultimate Edition',
            summary: {
                totalAlerts: this.alerts.length,
                criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
                highAlerts: this.alerts.filter(a => a.severity === 'high').length,
                mediumAlerts: this.alerts.filter(a => a.severity === 'medium').length,
                resolvedAlerts: this.alerts.filter(a => a.status === 'resolved').length,
                activeAlerts: this.alerts.filter(a => a.status === 'active').length,
                uniqueAttackerIPs: [...new Set(this.alerts.map(a => a.sourceIP))].length
            },
            alerts: this.alerts,
            recommendations: [
                '立即处理所有严重(Critical)级别的告警',
                '对高频攻击IP实施自动封禁策略',
                '加强Web应用防火墙(WAF)规则',
                '定期更新系统和应用程序补丁',
                '实施强密码策略和多因素认证',
                '建立完善的入侵响应流程'
            ]
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        Utils.showToast('安全报告已导出！包含完整的威胁分析和建议', 'success');
    }

    handleSecurityAlert(data) {
        console.log('[IDS] 收到安全告警:', data);
        this.loadRealtimeThreats();
    }

    toggleThreatStream() {
        Utils.showToast('威胁流控制功能已触发', 'info');
    }

    startRealTimeMonitoring() {
        this.refreshInterval = setInterval(() => {
            this.loadRealtimeThreats();
            
            if (Math.random() > 0.7) {
                const randomIP = Object.keys(this.geoDatabase)[Math.floor(Math.random() * Object.keys(this.geoDatabase).length)];
                const types = ['可疑登录尝试', '异常请求模式', '恶意爬虫访问'];
                
                eventBus.emit('security:alert', {
                    type: 'realtime_threat',
                    message: `${types[Math.floor(Math.random() * types.length)]}: ${randomIP}`,
                    severity: Math.random() > 0.5 ? 'high' : 'medium',
                    sourceIP: randomIP
                });
            }
        }, APP_CONFIG.refreshInterval.intrusion);
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        if (this.charts) {
            Object.values(this.charts).forEach(chart => chart?.destroy());
        }
        eventBus.off('intrusion:refresh');
        eventBus.off('security:alert');
    }
}

let intrusionModule;
